import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  DEFAULT_COURIER,
  getCourierLabel,
  isCourierCode,
  resolveCourierCode,
} from "@enjambre/logistica";
import { createAdminClient } from "@enjambre/auth/browser";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { isShippedStatus, notifyShipmentDispatched } from "@/lib/notifications/enqueue-transactional";

const CreateEnvioSchema = z.object({
  tracking_code: z.string().min(1),
  destino: z.string().min(1),
  items: z.string().min(1),
  status: z.string().min(1),
  eta: z.string().optional(),
  via: z.string().optional(),
  courier_code: z.string().optional(),
  venta_id: z.string().uuid().optional(),
});

const UpdateEnvioSchema = z.object({
  tracking_code: z.string().min(1).optional(),
  destino: z.string().min(1).optional(),
  items: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  eta: z.string().nullable().optional(),
  via: z.string().nullable().optional(),
  courier_code: z.string().nullable().optional(),
  courier_tracking_url: z.string().url().nullable().optional(),
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
  envios.forEach((e: { via: string | null; courier_code?: string | null }) => {
    const v = getCourierLabel(e.courier_code ?? e.via);
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

  const courierCode = input.courier_code
    ? resolveCourierCode(input.courier_code)
    : DEFAULT_COURIER;
  if (input.courier_code && !isCourierCode(input.courier_code)) {
    return c.json({ code: "invalid_courier", message: "Courier no disponible" }, 400);
  }

  const { data, error } = await supabase
    .from("logistica_envios")
    .insert({
      user_id: user.id,
      tracking_code: input.tracking_code,
      destino: input.destino,
      items: input.items,
      status: input.status,
      eta: input.eta ?? null,
      via: input.via ?? getCourierLabel(courierCode),
      courier_code: courierCode,
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

  const { data: previous, error: fetchError } = await supabase
    .from("logistica_envios")
    .select("id, status, tracking_code, destino, user_id, venta_id, empresa_id")
    .eq("id", envioId)
    .maybeSingle();

  if (fetchError) {
    return c.json({ code: "fetch_failed", message: fetchError.message }, 500);
  }
  if (!previous) {
    return c.json({ code: "not_found", message: "Envío no encontrado" }, 404);
  }

  const { data, error } = await supabase
    .from("logistica_envios")
    .update(input)
    .eq("id", envioId)
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "update_failed", message: error.message }, 400);
  }

  const newStatus = input.status ?? data.status;
  const statusChanged = Boolean(input.status) && input.status !== previous.status;
  if (statusChanged && isShippedStatus(newStatus)) {
    const admin = createAdminClient();
    if (admin) {
      let buyerEmail: string | null = null;
      let buyerUserId: string | null = previous.user_id;
      let buyOrder: string | null = null;

      if (previous.venta_id) {
        const { data: venta } = await admin
          .from("ventas")
          .select("buyer_email, user_id, buy_order")
          .eq("id", previous.venta_id)
          .maybeSingle();

        buyerEmail = (venta?.buyer_email as string | null) ?? null;
        buyerUserId = buyerUserId ?? (venta?.user_id as string | null) ?? null;
        buyOrder = (venta?.buy_order as string | null) ?? null;
      }

      if (buyerEmail || buyerUserId) {
        try {
          await notifyShipmentDispatched(admin, {
            envioId,
            trackingCode: data.tracking_code,
            destino: data.destino,
            status: newStatus,
            email: buyerEmail,
            userId: buyerUserId,
            buyOrder,
            empresaId: (data.empresa_id as string | null) ?? previous.empresa_id,
          });
        } catch (notifErr) {
          console.error("[logistica/envios] shipment notification failed:", notifErr);
        }
      }
    }
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
