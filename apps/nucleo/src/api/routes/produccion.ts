import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";
import { notifyStockCritico } from "@/lib/notifications/enqueue-transactional";
import { getBlockchainProvider, computeDataHash } from "@/api/lib/blockchain/provider";
import { createAdminClient } from "@enjambre/auth/browser";
import type { Json } from "@enjambre/database/database.types";

export const produccionRoutes = new Hono<{ Variables: AppVariables }>();

produccionRoutes.use("*", authMiddleware, tenantMiddleware);

const UpdateLoteComercialSchema = z.object({
  variedad_floral: z.string().max(100).optional().nullable(),
  metodo_extraccion: z.enum(["manual", "centrifugo", "prensado", "otro"]).optional().nullable(),
  analisis_humedad: z.number().min(0).max(100).optional().nullable(),
  analisis_hmf: z.number().min(0).max(500).optional().nullable(),
  lab_nombre: z.string().max(200).optional().nullable(),
  lab_fecha: z.string().date().optional().nullable(),
  canal_destino: z.enum(["individual", "colectivo", "acopio", "interno"]).optional().nullable(),
  relato_publico: z.string().max(5000).optional().nullable(),
  publico: z.boolean().optional(),
}).strict();

produccionRoutes.patch("/lotes/:id", zValidator("json", UpdateLoteComercialSchema), async (c) => {
  const supabase = c.get("supabase");
  const { id } = c.req.param();
  const body = c.req.valid("json");

  const payload = {
    ...(body.variedad_floral !== undefined && { variedad_floral: body.variedad_floral }),
    ...(body.metodo_extraccion !== undefined && { metodo_extraccion: body.metodo_extraccion }),
    ...(body.analisis_humedad !== undefined && { analisis_humedad: body.analisis_humedad }),
    ...(body.analisis_hmf !== undefined && { analisis_hmf: body.analisis_hmf }),
    ...(body.lab_nombre !== undefined && { lab_nombre: body.lab_nombre }),
    ...(body.lab_fecha !== undefined && { lab_fecha: body.lab_fecha }),
    ...(body.canal_destino !== undefined && { canal_destino: body.canal_destino }),
    ...(body.relato_publico !== undefined && { relato_publico: body.relato_publico }),
    ...(body.publico !== undefined && { publico: body.publico }),
  };

  const { data, error } = await supabase
    .from("lotes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

produccionRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [lotesRes, productosRes, ventasRes] = await Promise.all([
    supabase
      .from("lotes")
      .select("*, productos(id, nombre, stock, peso_neto_g), cosechas(kg, floracion, colmenas(name, apiarios(name)))")
      .order("created_at", { ascending: false }),
    supabase
      .from("productos")
      .select("*")
      .eq("visible", true),
    // typegen usa columna `productos` (Json) en ventas, no `items`
    supabase
      .from("ventas")
      .select("productos, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const lotes = lotesRes.data ?? [];
  const productos = productosRes.data ?? [];
  const ventas = ventasRes.data ?? [];

  const itemSchema = z.object({
    producto_id: z.string().optional(),
    id: z.string().optional(),
    cantidad: z.number().optional(),
  });

  // Calcular demanda (unidades vendidas últimos 30 días por producto)
  const demandaMap: Record<string, number> = {};
  ventas.forEach((v) => {
    const lineItems = v.productos;
    if (Array.isArray(lineItems)) {
      lineItems.forEach((rawItem: Json) => {
        const parsed = itemSchema.safeParse(rawItem);
        if (parsed.success) {
          const item = parsed.data;
          const id = item.producto_id || item.id;
          if (id) {
            demandaMap[id] = (demandaMap[id] || 0) + (item.cantidad || 0);
          }
        }
      });
    }
  });

  // Alertas de stock crítico → notificaciones centrales (campana + Voz de la Colmena).
  // Fire-and-forget con dedupe diario: 1 alerta por lote/producto por día.
  // Nunca bloquea la respuesta del dashboard: sin service key o ante error, solo log.
  const user = c.get("user");
  const criticalLotes = lotes.filter((l) => Number(l.kg_total ?? 0) < 50);
  const quiebreProductos = productos.filter((p) => Number(p.stock ?? 0) < 10);
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (user?.id && serviceUrl && serviceKey && (criticalLotes.length > 0 || quiebreProductos.length > 0)) {
    const admin = createClient(serviceUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    void notifyStockCritico(admin, {
      lotes: criticalLotes,
      productos: quiebreProductos,
      userId: user.id,
      email: user.email ?? null,
      empresaId: empresaId ?? undefined,
      today: new Date().toISOString().slice(0, 10),
    }).catch((err: unknown) => {
      console.error("[produccion] stock alert enqueue failed:", err);
    });
  }

  return c.json({
    data: {
      lotes,
      productos: productos.map(p => ({
        ...p,
        demanda_30d: demandaMap[p.id] || 0,
        dias_stock_estimado: demandaMap[p.id] > 0 ? Math.floor((p.stock || 0) / (demandaMap[p.id] / 30)) : 999
      })),
      stats: {
        total_kg_lotes: lotes.reduce((acc, l) => acc + Number(l.kg_total || 0), 0),
        lotes_criticos: lotes.filter(l => Number(l.kg_total) < 50).length,
        productos_quiebre: productos.filter(p => (p.stock || 0) < 10).length
      }
    }
  });
});

const CreateCosechaSchema = z.object({
  kg: z.number().positive(),
  fecha: z.string().date(),
  floracion: z.string().max(120).optional().nullable(),
  colmena_id: z.string().uuid().optional().nullable(),
  lote_id: z.string().uuid().optional().nullable(),
});

/** Cosechas de la temporada (con colmena/apiario anidados) para Inventario → Cosechas */
produccionRoutes.get("/cosechas", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("cosechas")
    .select("id, kg, fecha, floracion, created_at, colmena_id, colmenas(id, name, apiarios(name))")
    .order("fecha", { ascending: false })
    .limit(300);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

produccionRoutes.post("/cosechas", zValidator("json", CreateCosechaSchema), async (c) => {
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("cosechas")
    .insert({
      kg: input.kg,
      fecha: input.fecha,
      floracion: input.floracion?.trim() || null,
      colmena_id: input.colmena_id ?? null,
      lote_id: input.lote_id ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return c.json({ code: "cosecha_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

const ArbolStatusSchema = z.enum(["joven", "creciendo", "adulto"]);

const CreateArbolSchema = z.object({
  especie: z.string().min(1).max(80),
  cantidad: z.number().int().positive().max(100_000),
  sector: z.string().max(200).optional().nullable(),
  fecha: z.string().max(40).optional(),
  status: ArbolStatusSchema.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const UpdateArbolSchema = z.object({
  especie: z.string().min(1).max(80).optional(),
  cantidad: z.number().int().positive().max(100_000).optional(),
  sector: z.string().max(200).optional().nullable(),
  fecha: z.string().max(40).optional(),
  status: ArbolStatusSchema.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

produccionRoutes.get("/arboles/map", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("arboles_plantados")
    .select("id, especie, lat, lng")
    .eq("user_id", user.id)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(500);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

produccionRoutes.get("/arboles", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("arboles_plantados")
    .select("id, especie, cantidad, sector, fecha, status, co2_ton, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const rows = (data ?? []).map((r) => ({
    id: String(r.id),
    especie: String(r.especie ?? ""),
    cantidad: Number(r.cantidad) || 0,
    sector: String(r.sector ?? ""),
    fecha: r.fecha ? String(r.fecha) : "—",
    status: String(r.status ?? "joven"),
    co2_ton: Number(r.co2_ton) || 0,
    lotesMiel: ["Sin lote"],
  }));

  return c.json({ data: rows });
});

produccionRoutes.post("/arboles", zValidator("json", CreateArbolSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("arboles_plantados")
    .insert({
      especie: input.especie,
      cantidad: input.cantidad,
      sector: input.sector?.trim() || null,
      fecha: input.fecha ?? new Date().toISOString().split("T")[0],
      status: input.status ?? "creciendo",
      co2_ton: parseFloat((input.cantidad * 0.05).toFixed(2)),
      lat: input.lat ?? -42.6,
      lng: input.lng ?? -73.8,
      user_id: user.id,
    })
    .select("id, especie, cantidad, sector, fecha, status, co2_ton, created_at")
    .single();

  if (error) {
    return c.json({ code: "arbol_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

produccionRoutes.patch("/arboles/:id", zValidator("json", UpdateArbolSchema), async (c) => {
  const arbolId = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const patch = {
    ...(input.especie !== undefined ? { especie: input.especie } : {}),
    ...(input.cantidad !== undefined
      ? {
          cantidad: input.cantidad,
          co2_ton: parseFloat((input.cantidad * 0.05).toFixed(2)),
        }
      : {}),
    ...(input.sector !== undefined ? { sector: input.sector?.trim() || null } : {}),
    ...(input.fecha !== undefined ? { fecha: input.fecha } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.lat !== undefined ? { lat: input.lat } : {}),
    ...(input.lng !== undefined ? { lng: input.lng } : {}),
  };

  const { data, error } = await supabase
    .from("arboles_plantados")
    .update(patch)
    .eq("id", arbolId)
    .eq("user_id", user.id)
    .select("id, especie, cantidad, sector, fecha, status, co2_ton, created_at")
    .single();

  if (error) {
    return c.json({ code: "arbol_update_failed", message: error.message }, 400);
  }

  return c.json({ data });
});

produccionRoutes.delete("/arboles/:id", async (c) => {
  const arbolId = c.req.param("id");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { error } = await supabase
    .from("arboles_plantados")
    .delete()
    .eq("id", arbolId)
    .eq("user_id", user.id);

  if (error) {
    return c.json({ code: "arbol_delete_failed", message: error.message }, 400);
  }

  return c.json({ data: { deleted: true } });
});

produccionRoutes.post(
  "/add-stock",
  requireProfileRole("admin"),
  zValidator(
    "json",
    z.object({
      producto_id: z.string().uuid(),
      cantidad: z.number().int().positive()
    })
  ),
  async (c) => {
    // add_traceable_stock es service_role-only (CVE-N-002: el grant a
    // authenticated permitía inflar stock). El BFF autentica y exige admin;
    // la ejecución del RPC va con service role, no con el client del usuario.
    const supabase = createAdminClient();
    const { producto_id, cantidad } = c.req.valid("json");

    const { data, error } = await rpcLoose(supabase, "add_traceable_stock", {
      p_producto_id: producto_id,
      p_qty: cantidad,
    });

    if (error) {
      console.error("[Produccion] Error agregando stock:", error);
      return c.json({ error: error.message }, 400);
    }

    // Movimiento 6 — ancla on-chain por defecto (fail-open): si el ancla
    // falla (sin private key, RPC caído), la reposición NO se bloquea; el
    // lote queda con su hash identificador local y la página pública lo
    // etiqueta honestamente como "sin ancla on-chain".
    const rpcData = data as Record<string, unknown> | null;
    const loteId = typeof rpcData?.lote_id === "string" ? rpcData.lote_id : null;
    const onChainTx = loteId
      ? await anchorLoteOnChain(c.get("empresaId"), loteId, producto_id, cantidad, rpcData)
      : null;

    return c.json({ data: { ...rpcData, blockchain_tx: onChainTx } });
  }
);

const CreateLoteSchema = z.object({
  nombre_lote: z.string().min(1).max(200).optional(),
  kg_total: z.number().positive(),
  variedad_floral: z.string().max(100).optional().nullable(),
  fecha: z.string().date().optional(),
});

/** Crea un lote (pipeline recolección → lote). La recolección se vincula luego con lote_id. */
produccionRoutes.post(
  "/lotes",
  requireProfileRole("admin"),
  zValidator("json", CreateLoteSchema),
  async (c) => {
    const admin = createAdminClient();
    const input = c.req.valid("json");

    const { data, error } = await admin
      .from("lotes")
      .insert({
        nombre_lote: input.nombre_lote?.trim() || null,
        kg_total: input.kg_total,
        variedad_floral: input.variedad_floral?.trim() || null,
        estado: "activo",
        created_at: input.fecha ? `${input.fecha}T00:00:00.000Z` : new Date().toISOString(),
      })
      .select("id, nombre_lote, kg_total, variedad_floral, created_at")
      .single();

    if (error) {
      return c.json({ code: "lote_create_failed", message: error.message }, 400);
    }

    return c.json({ data }, 201);
  },
);

const EnvasarLoteSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().positive(),
});

/**
 * Envasado: frascos del lote → stock del producto destino.
 * Descuenta kg del lote (cantidad × peso_neto_g) y re-apunta productos.lote_id
 * al lote actual para que la trazabilidad del frasco siga la cadena.
 */
produccionRoutes.post(
  "/lotes/:id/envasar",
  requireProfileRole("admin"),
  zValidator("json", EnvasarLoteSchema),
  async (c) => {
    const { id } = c.req.param();
    const { producto_id, cantidad } = c.req.valid("json");
    const admin = createAdminClient();

    const { data: lote, error: loteError } = await admin
      .from("lotes")
      .select("id, kg_total")
      .eq("id", id)
      .single();
    if (loteError || !lote) {
      return c.json({ code: "lote_not_found", message: "Lote no encontrado" }, 404);
    }

    const { data: producto, error: productoError } = await admin
      .from("productos")
      .select("id, stock, peso_neto_g")
      .eq("id", producto_id)
      .single();
    if (productoError || !producto) {
      return c.json({ code: "producto_not_found", message: "Producto no encontrado" }, 404);
    }

    const pesoKg = Number(producto.peso_neto_g) > 0 ? Number(producto.peso_neto_g) / 1000 : null;
    if (!pesoKg) {
      return c.json(
        { code: "producto_sin_peso", message: "El producto no tiene peso_neto_g configurado" },
        400,
      );
    }

    const kgEnvasar = cantidad * pesoKg;
    const kgRestante = Math.max(0, Number(lote.kg_total ?? 0) - kgEnvasar);

    if (Number(lote.kg_total ?? 0) < kgEnvasar) {
      return c.json(
        { code: "kg_insuficientes", message: `El lote tiene ${Number(lote.kg_total ?? 0)} kg, no alcanza para ${kgEnvasar.toFixed(1)} kg de envasado` },
        400,
      );
    }

    const { error: stockError } = await admin
      .from("productos")
      .update({ stock: Number(producto.stock ?? 0) + cantidad, lote_id: id })
      .eq("id", producto_id);
    if (stockError) {
      return c.json({ code: "stock_update_failed", message: stockError.message }, 400);
    }

    const { error: loteUpdateError } = await admin
      .from("lotes")
      .update({ kg_total: kgRestante })
      .eq("id", id);
    if (loteUpdateError) {
      return c.json({ code: "lote_update_failed", message: loteUpdateError.message }, 400);
    }

    return c.json({
      data: {
        producto_id,
        frascos_agregados: cantidad,
        kg_descontados: Number(kgEnvasar.toFixed(2)),
        kg_restante_lote: Number(kgRestante.toFixed(2)),
      },
    }, 201);
  },
);

/**
 * Movimiento 6 — intento de ancla on-chain para un lote recién creado.
 * Fail-open: cualquier fallo (env sin private key, tx rechazada, RPC caído)
 * solo loguea; nunca bloquea la reposición de stock. El payload firmado se
 * guarda en data_payload para que la página pública lo muestre y verifique.
 */
async function anchorLoteOnChain(
  empresaId: string | undefined,
  loteId: string,
  productoId: string,
  cantidad: number,
  rpcData: Record<string, unknown> | null
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    if (!admin) return null;

    const { data: producto } = await admin
      .from("productos")
      .select("nombre, peso_neto_g")
      .eq("id", productoId)
      .maybeSingle();
    if (!producto) return null;

    const kgAgregado =
      typeof producto.peso_neto_g === "number" && producto.peso_neto_g > 0
        ? (cantidad * producto.peso_neto_g) / 1000
        : null;

    const payload = {
      producto_id: productoId,
      producto_nombre: producto.nombre ?? null,
      cantidad,
      kg_agregado: kgAgregado,
      lote_id: loteId,
      hash_identificador: typeof rpcData?.traceability_hash === "string" ? rpcData.traceability_hash : null,
      fecha_recepcion: new Date().toISOString(),
    };

    const dataHash = computeDataHash("lote", loteId, payload);
    const provider = getBlockchainProvider();
    const anchorResult = await provider.anchor(dataHash);

    if (!anchorResult.success || !anchorResult.txHash) {
      console.warn("[Produccion] Ancla on-chain omitida (fail-open):", anchorResult.error);
      return null;
    }

    // empresaId llega por parámetro de la función (redeclaración previa con `c` rota)
    // fromLoose: data_payload aún no está en typegen (migración 20260802_real_traceability)
    const { error: anchorInsertError } = await fromLoose(admin, "blockchain_anchors")
      .insert({
        empresa_id: empresaId,
        entity_type: "lote",
        entity_id: loteId,
        tx_hash: anchorResult.txHash,
        chain: "polygon-amoy",
        block_number: anchorResult.blockNumber,
        block_timestamp: anchorResult.blockTimestamp?.toISOString() ?? new Date().toISOString(),
        data_hash: dataHash,
        data_payload: payload,
        merkle_proof: null,
      });

    if (anchorInsertError) {
      console.error("[Produccion] Ancla registrada en cadena pero falló persistencia:", anchorInsertError.message);
      return anchorResult.txHash;
    }

    await admin.from("lotes").update({ blockchain_hash: anchorResult.txHash }).eq("id", loteId);
    return anchorResult.txHash;
  } catch (err) {
    console.warn("[Produccion] Ancla on-chain falló (fail-open):", err instanceof Error ? err.message : err);
    return null;
  }
}
