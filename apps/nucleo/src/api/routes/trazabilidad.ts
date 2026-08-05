import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";

export const trazabilidadRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/trazabilidad/lote/:loteId/qr — público solo si el lote está publicado
// (pasaporte del frasco). Admin con Bearer puede leer aunque no sea público.
// Integridad: recompute SHA-256 de cada evento vs hash almacenado.
trazabilidadRoutes.get("/lote/:loteId/qr", async (c) => {
  const { loteId } = c.req.param();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loteId)) {
    return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  }

  const supabase = createAdminClient();

  const { data: loteGate } = await supabase
    .from("lotes")
    .select("id, publico")
    .eq("id", loteId)
    .maybeSingle();

  if (!loteGate) {
    return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
  }

  // Lectura anónima solo con pasaporte publicado; operadores con Bearer sí ven borradores
  if (!loteGate.publico) {
    const authHeader = c.req.header("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return c.json(
        { code: "not_public", message: "Este lote no tiene pasaporte público" },
        404,
      );
    }
  }

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, codigo, activo, created_at, fecha_produccion")
    .eq("lote_id", loteId)
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!qr) {
    return c.json(
      { code: "not_found", message: "Este lote aún no tiene QR de trazabilidad" },
      404,
    );
  }

  // RPC service_role-only: recomputa cada hash y compara con el almacenado
  const { data: verificacion } = await rpcLoose(supabase, "verificar_integridad_audit_trail", {
    p_qr_id: qr.id,
  });

  const eventos = Array.isArray(verificacion) ? verificacion : [];
  const total = eventos.length;
  const validos = eventos.filter((e: { es_valido?: boolean }) => e.es_valido === true).length;

  return c.json({
    data: {
      codigo: qr.codigo,
      fecha_produccion: qr.fecha_produccion,
      creado_en: qr.created_at,
      integridad: {
        es_valido: total > 0 && validos === total,
        eventos_verificados: validos,
        total_eventos: total,
      },
      eventos: eventos.map((e: {
        evento?: string;
        ubicacion?: string | null;
        created_at?: string;
        metadata?: Record<string, unknown>;
        hash_almacenado?: string | null;
        es_valido?: boolean;
      }) => ({
        evento: e.evento ?? "desconocido",
        ubicacion: e.ubicacion ?? null,
        created_at: e.created_at ?? null,
        metadata: e.metadata ?? {},
        hash: e.hash_almacenado ?? null,
        valido: e.es_valido === true,
      })),
    },
  });
});

// POST /api/trazabilidad/lote/:loteId/qr — admin: genera el QR del lote (firma el pasaporte).
// El bypass global de auth para /api/trazabilidad solo salta la validación global;
// esta ruta exige Bearer + rol admin (authMiddleware + requireProfileRole).
trazabilidadRoutes.post(
  "/lote/:loteId/qr",
  authMiddleware,
  tenantMiddleware,
  requireProfileRole("admin"),
  async (c) => {
    const { loteId } = c.req.param();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loteId)) {
      return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
    }

    const supabase = createAdminClient();

    // fromLoose: relación lotes→productos existe en runtime pero no en el typegen local
    const { data: lote } = await fromLoose(supabase, "lotes")
      .select("id, created_at, fecha_envasado, productos(id)")
      .eq("id", loteId)
      .single();

    if (!lote) {
      return c.json({ code: "not_found", message: "Lote no encontrado" }, 404);
    }

    const { data: empresa } = await supabase.from("empresas").select("id").limit(1).maybeSingle();
    if (!empresa?.id) {
      return c.json({ code: "empresa_missing", message: "Configuración de empresa incompleta" }, 500);
    }

    const producto =
      Array.isArray(lote.productos) ? lote.productos[0] : lote.productos;
    const fechaProduccion = String(
      lote.fecha_envasado ?? lote.created_at ?? new Date().toISOString(),
    ).slice(0, 10);

    const { data: creados, error } = await rpcLoose(supabase, "crear_qr_producto", {
      p_producto_id: producto?.id ?? null,
      p_lote_id: loteId,
      p_apiario_id: null,
      p_cosecha_id: null,
      p_fecha_produccion: fechaProduccion,
      p_empresa_id: empresa.id,
      p_fecha_vencimiento: null,
      p_cantidad: 1,
    });

    const primerQr = Array.isArray(creados) ? creados[0] : undefined;
    if (error || !primerQr) {
      return c.json(
        { code: "qr_create_failed", message: error?.message ?? "No se pudo generar el QR" },
        400,
      );
    }

    return c.json({ data: primerQr }, 201);
  },
);
