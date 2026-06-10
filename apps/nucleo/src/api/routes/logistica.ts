import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const CreateEnvioSchema = z.object({
  tracking_code: z.string().min(1),
  destino: z.string().min(1),
  items: z.string().min(1),
  status: z.string().min(1),
  eta: z.string().optional(),
  via: z.string().optional(),
  venta_id: z.string().uuid().optional(),
});

const UpdateEnvioSchema = z.object({
  tracking_code: z.string().min(1).optional(),
  destino: z.string().min(1).optional(),
  items: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  eta: z.string().nullable().optional(),
  via: z.string().nullable().optional(),
});

export const logisticaRoutes = new Hono<{
  Variables: AppVariables;
}>();

logisticaRoutes.use("*", authMiddleware, tenantMiddleware);

logisticaRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const [enviosRes, stockRes, proveedoresRes, ventasRecientesRes] = await Promise.all([
    supabase
      .from("logistica_envios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("stock_centers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("proveedores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ventas")
      .select("id, total, channel, created_at, metodo_pago, items")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const envios = enviosRes.data ?? [];
  const stockCenters = stockRes.data ?? [];
  const proveedores = proveedoresRes.data ?? [];
  const ventasRecientes = ventasRecientesRes.data ?? [];

  const byStatus: Record<string, number> = {};
  envios.forEach((e: { status: string }) => {
    byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  });

  const byVia: Record<string, number> = {};
  envios.forEach((e: { via: string | null }) => {
    const v = e.via ?? "sin_via";
    byVia[v] = (byVia[v] ?? 0) + 1;
  });

  const urgentProviders = proveedores.filter(
    (p: { urgent: boolean | null }) => p.urgent === true
  ).length;

  const lowStockCenters = stockCenters.filter(
    (s: { ok: boolean | null }) => s.ok !== true
  ).length;

  return c.json({
    data: {
      envios,
      stockCenters,
      proveedores,
      ventasRecientes,
      stats: {
        totalEnvios: envios.length,
        pendientes: byStatus["pendiente"] ?? byStatus["Programado"] ?? 0,
        enTransito: byStatus["En tránsito"] ?? byStatus["en_transito"] ?? 0,
        empacando: byStatus["Empacando"] ?? byStatus["empacando"] ?? 0,
        entregados: byStatus["Entregado"] ?? byStatus["entregado"] ?? 0,
        byStatus,
        byVia,
        totalStockCenters: stockCenters.length,
        lowStockCenters,
        totalProveedores: proveedores.length,
        urgentProviders,
      },
    },
  });
});

logisticaRoutes.get("/envios", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const status = c.req.query("status");

  let query = supabase
    .from("logistica_envios")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

logisticaRoutes.post("/envios", zValidator("json", CreateEnvioSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("logistica_envios")
    .insert({
      user_id: user.id,
      tracking_code: input.tracking_code,
      destino: input.destino,
      items: input.items,
      status: input.status,
      eta: input.eta ?? null,
      via: input.via ?? null,
      venta_id: input.venta_id ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "envio_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

logisticaRoutes.patch("/envios/:id", zValidator("json", UpdateEnvioSchema), async (c) => {
  const envioId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("logistica_envios")
    .update(input)
    .eq("id", envioId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

logisticaRoutes.delete("/envios/:id", async (c) => {
  const envioId = c.req.param("id");
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("logistica_envios")
    .delete()
    .eq("id", envioId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});
