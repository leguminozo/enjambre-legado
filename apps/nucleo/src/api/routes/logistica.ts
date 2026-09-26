import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import {
  DEFAULT_COURIER,
  getCourierLabel,
  isCourierCode,
  resolveCourierCode,
} from "@enjambre/logistica";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { fromLoose } from "@/api/lib/supabase-loose";
import { isShippedStatus, notifyShipmentDispatched } from "@/lib/notifications/enqueue-transactional";
import { desmenuzarDocumento } from "./logistica/desmenuzar-factura";

type VentaLinea = { cantidad: number; nombre: string };

/** Normaliza ventas.productos (Json) al shape {cantidad, nombre} del dashboard.
 * El checkout inserta {quantity, name} y el POS {cantidad, nombre}. */
function parseVentaLineas(productos: unknown): VentaLinea[] {
  if (!Array.isArray(productos)) return [];
  return productos.flatMap((linea) => {
    if (typeof linea !== "object" || linea === null || Array.isArray(linea)) return [];
    const l = linea as Record<string, unknown>;
    const cantidadRaw = l.cantidad ?? l.quantity;
    const nombre = l.nombre ?? l.name;
    if (typeof cantidadRaw !== "number" || typeof nombre !== "string") return [];
    return [{ cantidad: cantidadRaw, nombre }];
  });
}

const LineItemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().positive().max(9_999),
});

const CreateEnvioSchema = z.object({
  tracking_code: z.string().min(1).max(120),
  destino: z.string().min(1).max(500),
  items: z.string().min(1).max(4000),
  status: z.string().min(1).max(80),
  eta: z.string().max(80).optional(),
  via: z.string().max(120).optional(),
  courier_code: z.string().max(40).optional(),
  venta_id: z.string().uuid().optional(),
  line_items: z.array(LineItemSchema).max(50).optional(),
});

type DecrementedLine = { productId: string; quantity: number };

const UpdateEnvioSchema = z.object({
  tracking_code: z.string().min(1).max(120).optional(),
  destino: z.string().min(1).max(500).optional(),
  items: z.string().min(1).max(4000).optional(),
  status: z.string().min(1).max(80).optional(),
  eta: z.string().nullable().optional(),
  via: z.string().nullable().optional(),
  courier_code: z.string().nullable().optional(),
  courier_tracking_url: z.string().url().nullable().optional(),
}).strict();

const CreateProveedorSchema = z.object({
  name: z.string().min(1).max(200),
  item: z.string().min(1).max(500),
  next_delivery: z.string().max(100).nullable().optional(),
  next_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  urgent: z.boolean().optional().default(false),
  tercero_id: z.string().uuid().nullable().optional(),
  rut: z.string().max(20).nullable().optional(),
  contacto: z.string().max(200).nullable().optional(),
  telefono: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  notas: z.string().max(1000).nullable().optional(),
  insumos_ids: z.array(z.string().uuid()).max(50).optional().default([]),
  estado_entrega: z.enum(["pendiente", "en_camino", "recibido", "sin_programar"]).optional().default("pendiente"),
});

const UpdateProveedorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  item: z.string().min(1).max(500).optional(),
  next_delivery: z.string().max(100).nullable().optional(),
  next_delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  urgent: z.boolean().optional(),
  tercero_id: z.string().uuid().nullable().optional(),
  rut: z.string().max(20).nullable().optional(),
  contacto: z.string().max(200).nullable().optional(),
  telefono: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  notas: z.string().max(1000).nullable().optional(),
  insumos_ids: z.array(z.string().uuid()).max(50).optional(),
  estado_entrega: z.enum(["pendiente", "en_camino", "recibido", "sin_programar"]).optional(),
}).strict();

const RecepcionProveedorSchema = z.object({
  items: z.array(
    z.object({
      item_id: z.string().uuid(),
      cantidad: z.number().positive(),
      costo_unitario: z.number().min(0).optional(),
      formato_asignado: z.string().max(100).optional(),
    })
  ).min(1),
  doc_tipo: z.enum(["factura", "boleta", "guia", "orden_compra", "comprobante", "otro"]).optional(),
  doc_numero: z.string().max(100).optional(),
  doc_fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notas: z.string().max(500).optional(),
  actualizar_costo_empaque: z.boolean().optional(),
});

const CreateStockCenterSchema = z.object({
  name: z.string().min(1).max(200),
  sachets: z.number().int().min(0).optional().default(0),
  frascos: z.number().int().min(0).optional().default(0),
  cofres: z.number().int().min(0).optional().default(0),
  ok: z.boolean().optional().default(true),
});

const UpdateStockCenterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sachets: z.number().int().min(0).optional(),
  frascos: z.number().int().min(0).optional(),
  cofres: z.number().int().min(0).optional(),
  ok: z.boolean().optional(),
}).strict();

const DerivarStockSchema = z.object({
  origen_tipo: z.enum(["inventario_item", "producto"]),
  origen_id: z.string().uuid(),
  cantidad: z.number().positive(),
  motivo: z.string().max(200).optional(),
});

const CreateStockCenterItemSchema = z.object({
  nombre: z.string().min(1).max(200),
  sku_code: z.string().max(80).optional().nullable(),
  clase: z
    .enum(["producto", "insumo", "etiqueta", "envase", "apicola", "destilacion"])
    .default("producto"),
  unidad: z
    .enum(["unidad", "kg", "g", "l", "ml", "rollo", "plancha", "caja"])
    .default("unidad"),
  cantidad: z.number().min(0).default(0),
  stock_minimo: z.number().min(0).default(0),
  notas: z.string().max(500).optional().nullable(),
});

const UpdateStockCenterItemSchema = z
  .object({
    nombre: z.string().min(1).max(200).optional(),
    sku_code: z.string().max(80).optional().nullable(),
    unidad: z
      .enum(["unidad", "kg", "g", "l", "ml", "rollo", "plancha", "caja"])
      .optional(),
    cantidad: z.number().min(0).optional(),
    stock_minimo: z.number().min(0).optional(),
    notas: z.string().max(500).optional().nullable(),
  })
  .strict();


export const logisticaRoutes = new Hono<{
  Variables: AppVariables;
}>();

logisticaRoutes.use("*", authMiddleware, tenantMiddleware);

logisticaRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const [
    enviosRes,
    stockRes,
    proveedoresRes,
    ventasRecientesRes,
    productosRes,
    envioVentaIdsRes,
    stockCenterItemsRes,
  ] = await Promise.all([
    supabase
      .from("logistica_envios")
      .select("*")
      .eq("empresa_id", empresaId)
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
      .select("id, total, channel, created_at, metodo_pago, productos")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("productos")
      .select("id, nombre, stock, categoria, formato")
      .eq("visible", true)
      .order("nombre", { ascending: true }),
    // Verdad única de "ya enviado": ventas con envío en la empresa.
    // Evita duplicados cuando el envío lo creó otro usuario (checkout de Tienda).
    supabase
      .from("logistica_envios")
      .select("venta_id")
      .eq("empresa_id", empresaId)
      .not("venta_id", "is", null),
    fromLoose(supabase, "stock_center_items")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  const envios = enviosRes.data ?? [];
  const rawStockCenterItems = (stockCenterItemsRes?.data ?? []) as Array<{
    id: string;
    stock_center_id: string;
    [key: string]: unknown;
  }>;
  const stockCenters = (stockRes.data ?? []).map((sc: Record<string, unknown>) => ({
    ...sc,
    items: rawStockCenterItems.filter((it) => it.stock_center_id === sc.id),
  }));
  const rawProveedores = proveedoresRes.data ?? [];
  const productos = productosRes.data ?? [];

  // Enriquecer proveedores con detalle de inventario_items y estado de stock
  const allInsumoIds = new Set<string>();
  rawProveedores.forEach((p: Record<string, unknown>) => {
    if (Array.isArray(p.insumos_ids)) {
      p.insumos_ids.forEach((id: unknown) => {
        if (typeof id === "string" && id) allInsumoIds.add(id);
      });
    }
  });

  const itemsMap = new Map<
    string,
    { id: string; nombre: string; clase: string; stock: number; stock_minimo: number; unidad: string; en_alerta: boolean }
  >();
  if (allInsumoIds.size > 0) {
    try {
      const { data: invData } = await supabase
        .from("inventario_items")
        .select("id, nombre, clase, stock, stock_minimo, unidad")
        .in("id", Array.from(allInsumoIds));

      if (invData) {
        invData.forEach((it: { id: string; nombre: string; clase: string; stock: number; stock_minimo: number; unidad: string }) => {
          const stockNum = Number(it.stock ?? 0);
          const minNum = Number(it.stock_minimo ?? 0);
          itemsMap.set(it.id, {
            id: it.id,
            nombre: it.nombre,
            clase: it.clase,
            stock: stockNum,
            stock_minimo: minNum,
            unidad: it.unidad,
            en_alerta: stockNum <= minNum,
          });
        });
      }
    } catch {
      /* fallback if inventory items query fails */
    }
  }

  const proveedores = rawProveedores.map((p: Record<string, unknown>) => {
    const insumosIds = Array.isArray(p.insumos_ids) ? (p.insumos_ids as string[]) : [];
    const insumosDetalle = insumosIds
      .map((id) => itemsMap.get(id))
      .filter((it): it is NonNullable<typeof it> => Boolean(it));
    const tieneAlertaStock = insumosDetalle.some((it) => it.en_alerta);

    return {
      ...p,
      insumos_ids: insumosIds,
      insumos_detalle: insumosDetalle,
      tiene_alerta_stock: tieneAlertaStock,
    };
  });
  const envioVentaIds = new Set(
    (envioVentaIdsRes.data ?? [])
      .map((e: { venta_id: string | null }) => e.venta_id)
      .filter((id): id is string => Boolean(id)),
  );
  const ventasRecientes = (ventasRecientesRes.data ?? []).map((v) => ({
    id: v.id,
    total: v.total,
    channel: v.channel,
    created_at: v.created_at,
    metodo_pago: v.metodo_pago,
    items: parseVentaLineas(v.productos),
    pendiente_envio: !envioVentaIds.has(String(v.id)),
  }));

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
    (p) => (p as { urgent?: boolean | null }).urgent === true
  ).length;

  const lowStockCenters = stockCenters.filter(
    (s) => (s as { ok?: boolean | null }).ok !== true
  ).length;

  return c.json({
    data: {
      envios,
      stockCenters,
      proveedores,
      ventasRecientes,
      productos,
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
  const empresaId = c.get("empresaId");

  const status = c.req.query("status");

  let query = supabase
    .from("logistica_envios")
    .select("*")
    .eq("empresa_id", empresaId)
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
  const empresaId = c.get("empresaId");

  const courierCode = input.courier_code
    ? resolveCourierCode(input.courier_code)
    : DEFAULT_COURIER;
  if (input.courier_code && !isCourierCode(input.courier_code)) {
    return c.json({ code: "invalid_courier", message: "Courier no disponible" }, 400);
  }

  const decremented: DecrementedLine[] = [];
  const lineItems = input.line_items ?? [];

  if (lineItems.length > 0) {
    const merged = new Map<string, number>();
    for (const line of lineItems) {
      merged.set(line.producto_id, (merged.get(line.producto_id) ?? 0) + line.cantidad);
    }

    for (const [productoId, cantidad] of merged) {
      const { data: stockData, error: stockErr } = await supabase.rpc("decrement_stock_force", {
        p_id: productoId,
        p_qty: cantidad,
      });

      if (stockErr || !stockData || (stockData as unknown[]).length === 0) {
        for (const d of decremented) {
          const { data: product } = await supabase
            .from("productos")
            .select("stock")
            .eq("id", d.productId)
            .maybeSingle();
          if (product?.stock != null) {
            await supabase
              .from("productos")
              .update({ stock: product.stock + d.quantity })
              .eq("id", d.productId);
          }
        }
        return c.json(
          { code: "stock_insufficient", message: "Stock insuficiente en inventario para uno o más productos" },
          409,
        );
      }

      decremented.push({ productId: productoId, quantity: cantidad });
    }
  }

  const { data, error } = await supabase
    .from("logistica_envios")
    .insert({
      user_id: user.id,
      empresa_id: empresaId,
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
    for (const d of decremented) {
      const { data: product } = await supabase
        .from("productos")
        .select("stock")
        .eq("id", d.productId)
        .maybeSingle();
      if (product?.stock != null) {
        await supabase
          .from("productos")
          .update({ stock: product.stock + d.quantity })
          .eq("id", d.productId);
      }
    }
    return c.json({ code: "envio_create_failed", message: error.message }, 400);
  }

  if (isShippedStatus(data.status)) {
    const admin = createAdminClient();
    if (admin && data.venta_id) {
      await admin.from("ventas").update({ estado: "despachado" }).eq("id", data.venta_id);
      const { data: venta } = await admin
        .from("ventas")
        .select("buyer_email, user_id, buy_order")
        .eq("id", data.venta_id)
        .maybeSingle();

      if (venta?.buyer_email || venta?.user_id) {
        try {
          await notifyShipmentDispatched(admin, {
            envioId: data.id,
            trackingCode: data.tracking_code,
            destino: data.destino,
            status: data.status,
            email: (venta.buyer_email as string | null) ?? null,
            userId: (venta.user_id as string | null) ?? null,
            buyOrder: (venta.buy_order as string | null) ?? null,
            empresaId: data.empresa_id as string | null,
          });
        } catch (notifErr) {
          console.error("[logistica/envios] shipment notification failed on POST:", notifErr);
        }
      }
    }
  }

  return c.json({ data }, 201);
});

logisticaRoutes.patch("/envios/:id", zValidator("json", UpdateEnvioSchema), async (c) => {
  const envioId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data: previous, error: fetchError } = await supabase
    .from("logistica_envios")
    .select("id, status, tracking_code, destino, user_id, venta_id, empresa_id")
    .eq("id", envioId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (fetchError) {
    return c.json({ code: "fetch_failed", message: fetchError.message }, 500);
  }
  if (!previous) {
    return c.json({ code: "not_found", message: "Envío no encontrado" }, 404);
  }

  const payload = {
    ...(input.tracking_code !== undefined && { tracking_code: input.tracking_code }),
    ...(input.destino !== undefined && { destino: input.destino }),
    ...(input.items !== undefined && { items: input.items }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.eta !== undefined && { eta: input.eta }),
    ...(input.via !== undefined && { via: input.via }),
    ...(input.courier_code !== undefined && { courier_code: input.courier_code }),
    ...(input.courier_tracking_url !== undefined && { courier_tracking_url: input.courier_tracking_url }),
  };

  const { data, error } = await supabase
    .from("logistica_envios")
    .update(payload)
    .eq("id", envioId)
    .eq("empresa_id", empresaId)
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
        await admin.from("ventas").update({ estado: "despachado" }).eq("id", previous.venta_id);
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
  const empresaId = c.get("empresaId");

  const { error } = await supabase
    .from("logistica_envios")
    .delete()
    .eq("id", envioId)
    .eq("empresa_id", empresaId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

logisticaRoutes.post("/proveedores", zValidator("json", CreateProveedorSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("proveedores")
    .insert({
      user_id: user.id,
      empresa_id: empresaId ?? null,
      name: input.name,
      item: input.item,
      next_delivery: input.next_delivery ?? null,
      next_delivery_date: input.next_delivery_date ?? null,
      urgent: input.urgent ?? false,
      tercero_id: input.tercero_id ?? null,
      rut: input.rut ?? null,
      contacto: input.contacto ?? null,
      telefono: input.telefono ?? null,
      email: input.email ?? null,
      notas: input.notas ?? null,
      insumos_ids: input.insumos_ids ?? [],
      estado_entrega: input.estado_entrega ?? "pendiente",
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "proveedor_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

logisticaRoutes.patch(
  "/proveedores/:id",
  zValidator("json", UpdateProveedorSchema),
  async (c) => {
    const proveedorId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");

    const { data, error } = await supabase
      .from("proveedores")
      .update(input)
      .eq("id", proveedorId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "proveedor_update_failed", message: error.message }, 400);
    }

    return c.json({ data });
  },
);

logisticaRoutes.post("/desmenuzar-factura", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await c.req.json();
      const content = json.content || json.xml || json.text || "";
      const fileName = json.fileName || "factura.xml";
      const mimeType = json.mimeType || "application/xml";
      const buffer = Buffer.from(content, "utf-8");
      const data = await desmenuzarDocumento(fileName, mimeType, buffer);
      return c.json({ data }, 200);
    }

    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || typeof file === "string") {
      return c.json({ code: "missing_file", message: "Archivo de factura requerido (PDF, XML, imagen)" }, 400);
    }

    const uploadFile = file as File;
    const buffer = Buffer.from(await uploadFile.arrayBuffer());
    const mimeType = uploadFile.type || "application/octet-stream";
    const fileName = uploadFile.name || "documento";

    const data = await desmenuzarDocumento(fileName, mimeType, buffer);
    return c.json({ data }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al procesar el archivo";
    return c.json({ code: "desmenuzar_failed", message: msg }, 500);
  }
});

logisticaRoutes.post(
  "/proveedores/:id/recepcion",
  zValidator("json", RecepcionProveedorSchema),
  async (c) => {
    const proveedorId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const empresaId = c.get("empresaId");

    const { data: prov, error: provErr } = await supabase
      .from("proveedores")
      .select("id, name, insumos_ids")
      .eq("id", proveedorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (provErr || !prov) {
      return c.json({ code: "proveedor_not_found", message: "Proveedor no encontrado" }, 404);
    }

    const resultados: Array<{ item_id: string; ok: boolean; error?: string }> = [];
    for (const line of input.items) {
      try {
        const { error: rpcErr } = await supabase.rpc("inventario_aplicar_movimiento", {
          p_item_id: line.item_id,
          p_tipo: "entrada",
          p_cantidad: line.cantidad,
          p_motivo: input.notas || `Recepción despacho: ${prov.name}`,
          p_ref_tipo: "proveedor_recepcion",
          p_ref_id: proveedorId,
          p_doc_tipo: input.doc_tipo || "guia",
          p_doc_numero: input.doc_numero || undefined,
          p_doc_fecha: input.doc_fecha || new Date().toISOString().slice(0, 10),
        });

        if (rpcErr) {
          resultados.push({ item_id: line.item_id, ok: false, error: rpcErr.message });
        } else {
          // Si la línea tiene costo unitario > 0, actualizar el costo de bodega del ítem
          if (typeof line.costo_unitario === "number" && line.costo_unitario > 0) {
            await fromLoose(supabase, "inventario_items")
              .update({
                costo_unitario: Math.round(line.costo_unitario),
                updated_at: new Date().toISOString(),
              })
              .eq("id", line.item_id);
          }
          resultados.push({ item_id: line.item_id, ok: true });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error aplicando entrada";
        resultados.push({ item_id: line.item_id, ok: false, error: msg });
      }
    }

    // Actualización dinámica de costo de empaque en recetas si se solicitó
    const recetasActualizadas: Array<{ formato: string; costo_empaque: number; recetas_afectadas: number }> = [];
    if (input.actualizar_costo_empaque) {
      const costoPorFormato = new Map<string, number>();
      for (const item of input.items) {
        if (item.formato_asignado && typeof item.costo_unitario === "number" && item.costo_unitario > 0) {
          const key = item.formato_asignado.trim();
          costoPorFormato.set(key, (costoPorFormato.get(key) || 0) + item.costo_unitario);
        }
      }

      for (const [formato, totalCostoEmpaque] of costoPorFormato.entries()) {
        const roundedCosto = Math.round(totalCostoEmpaque);
        const { data: updatedRecetas } = await supabase
          .from("recipes")
          .update({
            costo_empaque: roundedCosto,
            updated_at: new Date().toISOString(),
          })
          .eq("empresa_id", empresaId)
          .eq("activa", true)
          .ilike("formato_frasco", formato)
          .select("id");

        recetasActualizadas.push({
          formato,
          costo_empaque: roundedCosto,
          recetas_afectadas: updatedRecetas?.length ?? 0,
        });
      }
    }

    // Asegurar que los insumos recibidos queden asociados a la red de insumos del proveedor
    const currentInsumos = new Set(prov.insumos_ids || []);
    for (const item of input.items) {
      if (!currentInsumos.has(item.item_id)) {
        currentInsumos.add(item.item_id);
      }
    }

    await supabase
      .from("proveedores")
      .update({
        estado_entrega: "recibido",
        urgent: false,
        insumos_ids: Array.from(currentInsumos),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proveedorId)
      .eq("user_id", user.id);

    return c.json(
      {
        data: {
          success: true,
          resultados,
          recetas_actualizadas: recetasActualizadas,
        },
      },
      200,
    );
  },
);

logisticaRoutes.delete("/proveedores/:id", async (c) => {
  const proveedorId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { error } = await supabase
    .from("proveedores")
    .delete()
    .eq("id", proveedorId)
    .eq("user_id", user.id);

  if (error) {
    return c.json({ code: "proveedor_delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

logisticaRoutes.post("/stock-centers", zValidator("json", CreateStockCenterSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("stock_centers")
    .insert({
      user_id: user.id,
      name: input.name,
      sachets: input.sachets ?? 0,
      frascos: input.frascos ?? 0,
      cofres: input.cofres ?? 0,
      ok: input.ok ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "stock_center_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

logisticaRoutes.patch(
  "/stock-centers/:id",
  zValidator("json", UpdateStockCenterSchema),
  async (c) => {
    const centerId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");

    const { data, error } = await supabase
      .from("stock_centers")
      .update(input)
      .eq("id", centerId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "stock_center_update_failed", message: error.message }, 400);
    }

    return c.json({ data });
  },
);

logisticaRoutes.delete("/stock-centers/:id", async (c) => {
  const centerId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { error } = await supabase
    .from("stock_centers")
    .delete()
    .eq("id", centerId)
    .eq("user_id", user.id);

  if (error) {
    return c.json({ code: "stock_center_delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

/** POST /api/logistica/stock-centers/:id/derivar — Deriva stock desde Pureo (inventario general o productos) hacia este centro */
logisticaRoutes.post(
  "/stock-centers/:id/derivar",
  zValidator("json", DerivarStockSchema),
  async (c) => {
    const centerId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const empresaId = c.get("empresaId");

    // 1. Obtener centro de stock
    const { data: center, error: centerErr } = await supabase
      .from("stock_centers")
      .select("id, name, sachets, frascos, cofres")
      .eq("id", centerId)
      .single();

    if (centerErr || !center) {
      return c.json({ code: "not_found", message: "Centro de stock no encontrado" }, 404);
    }

    let itemName = "";
    let itemSku: string | null = null;
    let itemClase = "producto";
    let itemUnidad = "unidad";
    let stockRestantePureo = 0;

    if (input.origen_tipo === "inventario_item") {
      // 2a. Descontar de inventario_items (Pureo)
      const { data: it, error: itErr } = await fromLoose(supabase, "inventario_items")
        .select("id, nombre, sku_code, clase, unidad, stock")
        .eq("id", input.origen_id)
        .single();

      if (itErr || !it) {
        return c.json({ code: "not_found", message: "Ítem de inventario general no encontrado" }, 404);
      }

      const itStock = Number(it.stock ?? 0);
      if (itStock < input.cantidad) {
        return c.json(
          {
            code: "insufficient_stock",
            message: `Stock insuficiente en Pureo (Disponible: ${itStock} ${it.unidad})`,
          },
          400,
        );
      }

      const nuevoStock = itStock - input.cantidad;
      stockRestantePureo = nuevoStock;
      itemName = it.nombre as string;
      itemSku = (it.sku_code as string) || null;
      itemClase = it.clase as string;
      itemUnidad = it.unidad as string;

      // Actualizar stock general en Pureo
      const { error: updErr } = await fromLoose(supabase, "inventario_items")
        .update({ stock: nuevoStock })
        .eq("id", it.id);

      if (updErr) {
        return c.json({ code: "update_failed", message: updErr.message }, 500);
      }

      // Registrar movimiento de salida con motivo trazable
      await fromLoose(supabase, "inventario_movimientos").insert({
        item_id: it.id,
        user_id: user.id,
        tipo: "salida",
        cantidad: input.cantidad,
        stock_antes: itStock,
        stock_despues: nuevoStock,
        motivo: input.motivo || `Derivación a centro: ${center.name}`,
        ref_tipo: "stock_center",
        ref_id: center.id,
      });
    } else {
      // 2b. Descontar de productos de catálogo (Pureo)
      const { data: prod, error: prodErr } = await supabase
        .from("productos")
        .select("id, nombre, stock, formato")
        .eq("id", input.origen_id)
        .single();

      if (prodErr || !prod) {
        return c.json({ code: "not_found", message: "Producto no encontrado en catálogo" }, 404);
      }

      const prodStock = Number(prod.stock ?? 0);
      if (prodStock < input.cantidad) {
        return c.json(
          {
            code: "insufficient_stock",
            message: `Stock insuficiente en catálogo de Pureo (Disponible: ${prodStock})`,
          },
          400,
        );
      }

      const nuevoStock = prodStock - input.cantidad;
      stockRestantePureo = nuevoStock;
      itemName = prod.nombre || "Producto";
      itemClase = "producto";

      itemUnidad = "unidad";

      const { error: updErr } = await supabase
        .from("productos")
        .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
        .eq("id", prod.id);

      if (updErr) {
        return c.json({ code: "update_failed", message: updErr.message }, 500);
      }

      // Mantener sincronía retrocompatible con contadores de formato si aplica
      const formatLow = `${prod.formato || ""} ${prod.nombre}`.toLowerCase();
      if (formatLow.includes("sachet")) {
        await supabase
          .from("stock_centers")
          .update({ sachets: Number(center.sachets ?? 0) + input.cantidad })
          .eq("id", center.id);
      } else if (formatLow.includes("cofre")) {
        await supabase
          .from("stock_centers")
          .update({ cofres: Number(center.cofres ?? 0) + input.cantidad })
          .eq("id", center.id);
      } else {
        await supabase
          .from("stock_centers")
          .update({ frascos: Number(center.frascos ?? 0) + input.cantidad })
          .eq("id", center.id);
      }
    }

    // 3. Buscar si ya existe este ítem asignado al centro
    let findQuery = fromLoose(supabase, "stock_center_items")
      .select("*")
      .eq("stock_center_id", center.id);

    if (input.origen_tipo === "inventario_item") {
      findQuery = findQuery.eq("inventario_item_id", input.origen_id);
    } else {
      findQuery = findQuery.eq("producto_id", input.origen_id);
    }

    const { data: existingItem } = await findQuery.maybeSingle();

    let targetItem: Record<string, unknown>;
    if (existingItem) {
      const nuevaCant = Number(existingItem.cantidad ?? 0) + input.cantidad;
      const { data: updItem, error: updItemErr } = await fromLoose(supabase, "stock_center_items")
        .update({ cantidad: nuevaCant, updated_at: new Date().toISOString() })
        .eq("id", existingItem.id)
        .select("*")
        .single();

      if (updItemErr) {
        return c.json({ code: "save_item_failed", message: updItemErr.message }, 500);
      }
      targetItem = updItem as Record<string, unknown>;
    } else {
      const { data: newItem, error: newErr } = await fromLoose(supabase, "stock_center_items")
        .insert({
          stock_center_id: center.id,
          user_id: user.id,
          empresa_id: empresaId,
          inventario_item_id: input.origen_tipo === "inventario_item" ? input.origen_id : null,
          producto_id: input.origen_tipo === "producto" ? input.origen_id : null,
          nombre: itemName,
          sku_code: itemSku,
          clase: itemClase,
          unidad: itemUnidad,
          cantidad: input.cantidad,
          stock_minimo: 0,
          origen: "pureo",
          notas: input.motivo || null,
        })
        .select("*")
        .single();

      if (newErr) {
        return c.json({ code: "save_item_failed", message: newErr.message }, 500);
      }
      targetItem = newItem as Record<string, unknown>;
    }

    return c.json(
      {
        data: {
          item: targetItem,
          center_id: center.id,
          stock_restante_pureo: stockRestantePureo,
        },
      },
      201,
    );
  },
);

/** GET /api/logistica/stock-centers/:id/items */
logisticaRoutes.get("/stock-centers/:id/items", async (c) => {
  const centerId = c.req.param("id");
  const supabase = c.get("supabase");

  const { data, error } = await fromLoose(supabase, "stock_center_items")
    .select("*")
    .eq("stock_center_id", centerId)
    .order("nombre", { ascending: true });

  if (error) {
    if (error.code === "42P01") return c.json({ data: [] });
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

/** POST /api/logistica/stock-centers/:id/items — Crear ítem local independiente (sin tocar Pureo) */
logisticaRoutes.post(
  "/stock-centers/:id/items",
  zValidator("json", CreateStockCenterItemSchema),
  async (c) => {
    const centerId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const empresaId = c.get("empresaId");

    const { data, error } = await fromLoose(supabase, "stock_center_items")
      .insert({
        stock_center_id: centerId,
        user_id: user.id,
        empresa_id: empresaId,
        nombre: input.nombre.trim(),
        sku_code: input.sku_code?.trim() || null,
        clase: input.clase,
        unidad: input.unidad,
        cantidad: input.cantidad,
        stock_minimo: input.stock_minimo,
        origen: "local",
        notas: input.notas?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "create_failed", message: error.message }, 400);
    }

    return c.json({ data }, 201);
  },
);

/** PATCH /api/logistica/stock-centers/:id/items/:itemId */
logisticaRoutes.patch(
  "/stock-centers/:id/items/:itemId",
  zValidator("json", UpdateStockCenterItemSchema),
  async (c) => {
    const centerId = c.req.param("id");
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data, error } = await fromLoose(supabase, "stock_center_items")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .eq("stock_center_id", centerId)
      .select("*")
      .single();

    if (error) {
      return c.json({ code: "update_failed", message: error.message }, 400);
    }

    return c.json({ data });
  },
);

/** DELETE /api/logistica/stock-centers/:id/items/:itemId */
logisticaRoutes.delete("/stock-centers/:id/items/:itemId", async (c) => {
  const centerId = c.req.param("id");
  const itemId = c.req.param("itemId");
  const supabase = c.get("supabase");

  const { error } = await fromLoose(supabase, "stock_center_items")
    .delete()
    .eq("id", itemId)
    .eq("stock_center_id", centerId);

  if (error) {
    return c.json({ code: "delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});



