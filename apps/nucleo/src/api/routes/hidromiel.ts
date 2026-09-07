import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUuid(c: { req: { param: (k: string) => string } }): boolean {
  return UUID_RE.test(c.req.param("id"));
}

/* ── Schemas ──────────────────────────────────────────────────────────────── */

const CreateLoteSchema = z.object({
  nombre: z.string().max(200).optional().nullable(),
  miel_lote_id: z.string().uuid().optional().nullable(),
  fecha_inicio: z.string().datetime().optional(),
  estado: z.string().min(1).max(120).optional(),
  volumen_litros: z.number().positive().max(10000).optional().nullable(),
  densidad_inicial: z.number().min(0.98).max(1.2).optional().nullable(),
  densidad_final: z.number().min(0.98).max(1.2).optional().nullable(),
  levadura_cepa: z.string().max(200).optional().nullable(),
  co2_target_vol: z.number().min(0).max(6).optional().nullable(),
  presion_target_bar: z.number().min(0).max(20).optional().nullable(),
  temperatura_fermentacion: z.number().min(-10).max(60).optional().nullable(),
  n_botellas: z.number().int().min(0).max(100000).optional().nullable(),
  costo_insumos: z.number().int().min(0).optional(),
  costo_envases: z.number().int().min(0).optional(),
  nota_personal: z.number().int().min(1).max(10).optional().nullable(),
  observaciones: z.string().max(20000).optional().nullable(),
  publico: z.boolean().optional(),
  relato_publico: z.string().max(5000).optional().nullable(),
});

const UpdateLoteSchema = CreateLoteSchema.partial().strict();

const CreateMedicionSchema = z.object({
  tipo: z.string().min(1).max(120),
  valor: z.number().optional().nullable(),
  unidad: z.string().max(60).optional().nullable(),
  fecha: z.string().datetime().optional(),
  nota: z.string().max(2000).optional().nullable(),
});

const UpdateMedicionSchema = CreateMedicionSchema.partial().strict();

const CreateIngredienteSchema = z.object({
  nombre: z.string().min(1).max(200),
  cantidad: z.number().optional().nullable(),
  unidad: z.string().max(60).optional().nullable(),
  nota: z.string().max(2000).optional().nullable(),
});

const UpdateIngredienteSchema = CreateIngredienteSchema.partial().strict();

const CreateEtapaSchema = z.object({
  nombre: z.string().min(1).max(200),
  fecha: z.string().datetime().optional(),
  nota: z.string().max(2000).optional().nullable(),
});

const UpdateEtapaSchema = CreateEtapaSchema.partial().strict();

/* ── Rutas autenticadas ───────────────────────────────────────────────────── */

export const hidromielRoutes = new Hono<{
  Variables: AppVariables;
}>();

hidromielRoutes.use("*", authMiddleware, tenantMiddleware);

/** Genera el código HM-YYYY-#### contando los lotes creados en el año (único). */
async function generarCodigoHidromiel(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const year = new Date().getFullYear();
  const inicio = `${year}-01-01T00:00:00.000Z`;
  const fin = `${year + 1}-01-01T00:00:00.000Z`;

  const { count, error } = await supabase
    .from("hidromiel_lotes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", inicio)
    .lt("created_at", fin);

  if (error) return null;
  return `HM-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

/** Verifica que el lote exista y sea de la empresa (RLS) — 404 limpio en vez de error crudo. */
async function loteExiste(
  supabase: SupabaseClient<Database>,
  loteId: string,
  empresaId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("hidromiel_lotes")
    .select("id")
    .eq("id", loteId)
    .eq("empresa_id", empresaId)
    .maybeSingle();
  return Boolean(data);
}

hidromielRoutes.get("/lotes", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("hidromiel_lotes")
    .select(
      "*, miel_lote:lotes(id, nombre_lote, variedad_floral, kg_total, publico)",
    )
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

hidromielRoutes.get("/lotes/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const loteId = c.req.param("id");

  const [loteRes, medicionesRes, ingredientesRes, etapasRes] = await Promise.all([
    supabase
      .from("hidromiel_lotes")
      .select("*, miel_lote:lotes(id, nombre_lote, variedad_floral, kg_total, publico)")
      .eq("id", loteId)
      .eq("empresa_id", empresaId)
      .maybeSingle(),
    supabase
      .from("hidromiel_mediciones")
      .select("*")
      .eq("lote_id", loteId)
      .order("fecha", { ascending: true }),
    supabase
      .from("hidromiel_ingredientes")
      .select("*")
      .eq("lote_id", loteId)
      .order("created_at", { ascending: true }),
    supabase
      .from("hidromiel_etapas")
      .select("*")
      .eq("lote_id", loteId)
      .order("fecha", { ascending: true }),
  ]);

  if (loteRes.error) return c.json({ code: "query_failed", message: loteRes.error.message }, 500);
  if (!loteRes.data) return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);

  return c.json({
    data: {
      lote: loteRes.data,
      mediciones: medicionesRes.data ?? [],
      ingredientes: ingredientesRes.data ?? [],
      etapas: etapasRes.data ?? [],
    },
  });
});

hidromielRoutes.post("/lotes", zValidator("json", CreateLoteSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");
  const input = c.req.valid("json");

  // El código es único por año; si colisiona (doble click/raza), reintenta.
  for (let attempt = 0; attempt < 5; attempt++) {
    const codigo = await generarCodigoHidromiel(supabase);
    if (!codigo) {
      return c.json({ code: "codigo_failed", message: "No se pudo generar el código del lote" }, 500);
    }

    const { data, error } = await supabase
      .from("hidromiel_lotes")
      .insert({
        user_id: user.id,
        empresa_id: empresaId,
        ...input,
        codigo,
      })
      .select("id, codigo, nombre, estado")
      .single();

    if (!error) return c.json({ data }, 201);
    if (!/duplicate key|unique/i.test(error.message)) {
      return c.json({ code: "lote_create_failed", message: error.message }, 400);
    }
  }

  return c.json({ code: "codigo_conflict", message: "Conflicto al generar código único" }, 409);
});

hidromielRoutes.patch("/lotes/:id", zValidator("json", UpdateLoteSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const loteId = c.req.param("id");
  const input = c.req.valid("json");

  const { data: previous, error: fetchError } = await supabase
    .from("hidromiel_lotes")
    .select("id, estado")
    .eq("id", loteId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (fetchError) return c.json({ code: "fetch_failed", message: fetchError.message }, 500);
  if (!previous) return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);

  const { data, error } = await supabase
    .from("hidromiel_lotes")
    .update(input)
    .eq("id", loteId)
    .eq("empresa_id", empresaId)
    .select("*")
    .single();

  if (error) return c.json({ code: "update_failed", message: error.message }, 400);

  // Cambio de estado → queda en la línea de tiempo (historia, no control).
  const estadoCambio = input.estado !== undefined && input.estado !== previous.estado;
  if (estadoCambio && data.estado) {
    await supabase
      .from("hidromiel_etapas")
      .insert({ lote_id: loteId, nombre: data.estado })
      .select("id")
      .maybeSingle();
  }

  return c.json({ data });
});

hidromielRoutes.delete("/lotes/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { error } = await supabase
    .from("hidromiel_lotes")
    .delete()
    .eq("id", c.req.param("id"))
    .eq("empresa_id", empresaId);

  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Mediciones (diario libre) ────────────────────────────────────────────── */

hidromielRoutes.post("/lotes/:id/mediciones", zValidator("json", CreateMedicionSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const loteId = c.req.param("id");
  const input = c.req.valid("json");

  if (!(await loteExiste(supabase, loteId, empresaId))) {
    return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
  }

  const { data, error } = await supabase
    .from("hidromiel_mediciones")
    .insert({ lote_id: loteId, ...input })
    .select("*")
    .single();

  if (error) return c.json({ code: "medicion_create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

hidromielRoutes.patch("/mediciones/:id", zValidator("json", UpdateMedicionSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("hidromiel_mediciones")
    .update(input)
    .eq("id", c.req.param("id"))
    .select("*")
    .single();

  if (error) return c.json({ code: "medicion_update_failed", message: error.message }, 400);
  return c.json({ data });
});

hidromielRoutes.delete("/mediciones/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("hidromiel_mediciones")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "medicion_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Ingredientes (receta libre) ──────────────────────────────────────────── */

hidromielRoutes.post("/lotes/:id/ingredientes", zValidator("json", CreateIngredienteSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const loteId = c.req.param("id");
  const input = c.req.valid("json");

  if (!(await loteExiste(supabase, loteId, empresaId))) {
    return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
  }

  const { data, error } = await supabase
    .from("hidromiel_ingredientes")
    .insert({ lote_id: loteId, ...input })
    .select("*")
    .single();

  if (error) return c.json({ code: "ingrediente_create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

hidromielRoutes.patch("/ingredientes/:id", zValidator("json", UpdateIngredienteSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("hidromiel_ingredientes")
    .update(input)
    .eq("id", c.req.param("id"))
    .select("*")
    .single();

  if (error) return c.json({ code: "ingrediente_update_failed", message: error.message }, 400);
  return c.json({ data });
});

hidromielRoutes.delete("/ingredientes/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("hidromiel_ingredientes")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "ingrediente_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Etapas (línea de tiempo libre) ───────────────────────────────────────── */

hidromielRoutes.post("/lotes/:id/etapas", zValidator("json", CreateEtapaSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const loteId = c.req.param("id");
  const input = c.req.valid("json");

  if (!(await loteExiste(supabase, loteId, empresaId))) {
    return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
  }

  const { data, error } = await supabase
    .from("hidromiel_etapas")
    .insert({ lote_id: loteId, ...input })
    .select("*")
    .single();

  if (error) return c.json({ code: "etapa_create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

hidromielRoutes.patch("/etapas/:id", zValidator("json", UpdateEtapaSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("hidromiel_etapas")
    .update(input)
    .eq("id", c.req.param("id"))
    .select("*")
    .single();

  if (error) return c.json({ code: "etapa_update_failed", message: error.message }, 400);
  return c.json({ data });
});

hidromielRoutes.delete("/etapas/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("hidromiel_etapas")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "etapa_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Página pública (pasaporte QR) — sin auth ─────────────────────────────── */

export const hidromielPublicRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/hidromiel/publico/:id — valida explícitamente publico = true
hidromielPublicRoutes.get("/publico/:id", async (c) => {
  const { id } = c.req.param();

  if (!UUID_RE.test(id)) {
    return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("hidromiel_lotes")
    .select(
      "id, codigo, nombre, estado, fecha_inicio, volumen_litros, densidad_inicial, densidad_final, levadura_cepa, co2_target_vol, presion_target_bar, temperatura_fermentacion, n_botellas, nota_personal, relato_publico, publico, miel_lote:lotes(id, nombre_lote, variedad_floral, kg_total), mediciones:hidromiel_mediciones(id, tipo, valor, unidad, fecha, nota), ingredientes:hidromiel_ingredientes(id, nombre, cantidad, unidad, nota), etapas:hidromiel_etapas(id, nombre, fecha, nota)",
    )
    .eq("id", id)
    .eq("publico", true)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: "Lote no encontrado o no es público" }, 404);
  }

  // Las relaciones inversas (padre→hijos) no están en el typegen; se moldean aquí.
  const d = data as unknown as Record<string, unknown>;

  return c.json({
    data: {
      id: String(d.id),
      codigo: d.codigo ? String(d.codigo) : String(d.id).split("-")[0],
      nombre: d.nombre ? String(d.nombre) : null,
      estado: String(d.estado ?? ""),
      fecha_inicio: String(d.fecha_inicio ?? ""),
      volumen_litros: d.volumen_litros != null ? Number(d.volumen_litros) : null,
      densidad_inicial: d.densidad_inicial != null ? Number(d.densidad_inicial) : null,
      densidad_final: d.densidad_final != null ? Number(d.densidad_final) : null,
      levadura_cepa: d.levadura_cepa ? String(d.levadura_cepa) : null,
      co2_target_vol: d.co2_target_vol != null ? Number(d.co2_target_vol) : null,
      presion_target_bar: d.presion_target_bar != null ? Number(d.presion_target_bar) : null,
      temperatura_fermentacion: d.temperatura_fermentacion != null ? Number(d.temperatura_fermentacion) : null,
      n_botellas: d.n_botellas != null ? Number(d.n_botellas) : null,
      nota_personal: d.nota_personal != null ? Number(d.nota_personal) : null,
      relato_publico: d.relato_publico ? String(d.relato_publico) : null,
      miel_lote:
        d.miel_lote && typeof d.miel_lote === "object" && d.miel_lote !== null
          ? {
              id: String((d.miel_lote as Record<string, unknown>).id),
              nombre_lote: (d.miel_lote as Record<string, unknown>).nombre_lote ? String((d.miel_lote as Record<string, unknown>).nombre_lote) : null,
              variedad_floral: (d.miel_lote as Record<string, unknown>).variedad_floral ? String((d.miel_lote as Record<string, unknown>).variedad_floral) : null,
              kg_total: (d.miel_lote as Record<string, unknown>).kg_total != null ? Number((d.miel_lote as Record<string, unknown>).kg_total) : null,
            }
          : null,
      mediciones: Array.isArray(d.mediciones)
        ? (d.mediciones as Record<string, unknown>[]).map((m) => ({
            id: String(m.id),
            tipo: String(m.tipo ?? ""),
            valor: m.valor != null ? Number(m.valor) : null,
            unidad: m.unidad ? String(m.unidad) : null,
            fecha: String(m.fecha ?? ""),
            nota: m.nota ? String(m.nota) : null,
          }))
        : [],
      ingredientes: Array.isArray(d.ingredientes)
        ? (d.ingredientes as Record<string, unknown>[]).map((i) => ({
            id: String(i.id),
            nombre: String(i.nombre ?? ""),
            cantidad: i.cantidad != null ? Number(i.cantidad) : null,
            unidad: i.unidad ? String(i.unidad) : null,
            nota: i.nota ? String(i.nota) : null,
          }))
        : [],
      etapas: Array.isArray(d.etapas)
        ? (d.etapas as Record<string, unknown>[]).map((e) => ({
            id: String(e.id),
            nombre: String(e.nombre ?? ""),
            fecha: String(e.fecha ?? ""),
            nota: e.nota ? String(e.nota) : null,
          }))
        : [],
    },
  });
});
