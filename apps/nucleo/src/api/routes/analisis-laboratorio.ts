import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { AppVariables } from "@/api/lib/middleware";
import { requireProfileRole } from "@/api/lib/middleware";
import { evaluarCodex } from "@/api/lib/laboratorio/codex";

export const analisisLaboratorioRoutes = new Hono<{ Variables: AppVariables }>();

const UUID_RE = /^[0-9a-f-]{36}$/i;

const AnalisisSchema = z.object({
  lote_id: z.string().regex(UUID_RE),
  fecha: z.string().date().optional(),
  laboratorio: z.string().trim().min(2).max(160),
  humedad_pct: z.number().min(0).max(100).optional().nullable(),
  hmf_mgkg: z.number().min(0).max(1000).optional().nullable(),
  diastasa: z.number().min(0).max(100).optional().nullable(),
  cenizas_pct: z.number().min(0).max(100).optional().nullable(),
  conductividad_ms: z.number().min(0).max(10).optional().nullable(),
  conteo_polinico: z.record(z.string(), z.number()).optional(),
  certificado_path: z.string().max(500).optional().nullable(),
});

type AnalisisRow = {
  id: string;
  lote_id: string;
  fecha: string;
  laboratorio: string;
  humedad_pct: number | null;
  hmf_mgkg: number | null;
  diastasa: number | null;
  cenizas_pct: number | null;
  conductividad_ms: number | null;
  conteo_polinico: Record<string, number>;
  certificado_path: string | null;
  created_at: string;
};

// GET /api/analisis-laboratorio/publico/lote/:loteId — último análisis (PDP, público).
analisisLaboratorioRoutes.get("/publico/lote/:loteId", async (c) => {
  const loteId = c.req.param("loteId");
  if (!UUID_RE.test(loteId)) return c.json({ code: "invalid_id", message: "Lote inválido" }, 400);
  const admin = createAdminClient();

  const [{ data: lote }, { data: analisis }] = await Promise.all([
    admin.from("lotes").select("id, nombre_lote, bloqueado_calidad").eq("id", loteId).maybeSingle(),
    admin
      .from("analisis_laboratorio")
      .select("id, lote_id, fecha, laboratorio, humedad_pct, hmf_mgkg, diastasa, cenizas_pct, conductividad_ms, conteo_polinico, created_at")
      .eq("lote_id", loteId)
      .order("fecha", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!lote) return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
  return c.json({ data: { lote, analisis } });
});

// GET /api/analisis-laboratorio/lote/:loteId — historial (equipo).
analisisLaboratorioRoutes.get(
  "/lote/:loteId",
  requireProfileRole("admin", "apicultor", "territorial"),
  async (c) => {
    const loteId = c.req.param("loteId");
    if (!UUID_RE.test(loteId)) return c.json({ code: "invalid_id", message: "Lote inválido" }, 400);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("analisis_laboratorio")
      .select("*")
      .eq("lote_id", loteId)
      .order("fecha", { ascending: false });
    if (error) return c.json({ code: "query_failed", message: error.message }, 500);
    return c.json({ data: data ?? [] });
  },
);

// POST /api/analisis-laboratorio — registrar análisis + evaluar Codex.
analisisLaboratorioRoutes.post(
  "/",
  requireProfileRole("admin", "apicultor"),
  zValidator("json", AnalisisSchema),
  async (c) => {
    const admin = createAdminClient();
    const user = c.get("user");
    const input = c.req.valid("json");

    const { data: lote, error: loteError } = await admin
      .from("lotes")
      .select("id")
      .eq("id", input.lote_id)
      .maybeSingle();
    if (loteError || !lote) {
      return c.json({ code: "lote_not_found", message: "Lote no encontrado" }, 404);
    }

    const { data: analisis, error: insertError } = await admin
      .from("analisis_laboratorio")
      .insert({
        lote_id: input.lote_id,
        fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
        laboratorio: input.laboratorio,
        humedad_pct: input.humedad_pct ?? null,
        hmf_mgkg: input.hmf_mgkg ?? null,
        diastasa: input.diastasa ?? null,
        cenizas_pct: input.cenizas_pct ?? null,
        conductividad_ms: input.conductividad_ms ?? null,
        conteo_polinico: input.conteo_polinico ?? {},
        certificado_path: input.certificado_path ?? null,
        creado_por: (user?.id as string | undefined) ?? null,
      })
      .select()
      .single();

    if (insertError || !analisis) {
      return c.json({ code: "insert_failed", message: insertError?.message ?? "No se pudo registrar" }, 400);
    }

    // Evaluación Codex: HMF > 40 bloquea venta; humedad > 20 alerta al equipo.
    const hmf = Number(input.hmf_mgkg ?? NaN);
    const humedad = Number(input.humedad_pct ?? NaN);
    const { bloqueado, alertaHumedad } = evaluarCodex({ hmf_mgkg: hmf, humedad_pct: humedad });

    const lotePatch: Record<string, unknown> = {};
    if (Number.isFinite(humedad)) lotePatch.analisis_humedad = humedad;
    if (Number.isFinite(hmf)) lotePatch.analisis_hmf = hmf;
    if (input.conductividad_ms != null) lotePatch.analisis_conductividad = input.conductividad_ms;
    lotePatch.lab_nombre = input.laboratorio;
    lotePatch.lab_fecha = input.fecha ?? new Date().toISOString().slice(0, 10);
    if (bloqueado) lotePatch.bloqueado_calidad = true;
    await admin.from("lotes").update(lotePatch).eq("id", input.lote_id);

    if (alertaHumedad || bloqueado) {
      try {
        const { data: admins } = await admin
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null)
          .limit(5);
        const motivo = bloqueado
          ? `HMF ${hmf} mg/kg sobre el límite Codex (40): venta bloqueada para el lote.`
          : `Humedad ${humedad}% sobre el umbral operativo (20%).`;
        const rows = ((admins ?? []) as Array<{ email: string }>)
          .map((a) => a.email)
          .filter(Boolean)
          .map((email) => ({
            channel: "email",
            recipient: email,
            subject: `Alerta de calidad — lote ${input.lote_id.slice(0, 8)}`,
            body: `${motivo}\nLaboratorio: ${input.laboratorio}\nRevisa Producción → Lotes.`,
            status: "pending",
            metadata: { via: "analisis_laboratorio", lote_id: input.lote_id },
          }));
        if (rows.length > 0) await admin.from("notification_queue").insert(rows);
      } catch (err) {
        console.warn("[analisis-laboratorio] quality alert enqueue failed:", err);
      }
    }

    return c.json(
      { data: { ...(analisis as AnalisisRow), bloqueado_calidad: bloqueado } },
      201,
    );
  },
);
