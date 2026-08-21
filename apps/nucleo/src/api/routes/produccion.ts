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
import {
  appendCosechaId,
  mergeCosechaIds,
  removeCosechaId,
} from "@/lib/link-cosecha-lote";
import { co2TonFromArboles } from "@/lib/impacto-metodologia";
import { revalidateTiendaLayout } from "@/lib/revalidate-tienda";

export const produccionRoutes = new Hono<{ Variables: AppVariables }>();

type AdminClient = ReturnType<typeof createAdminClient>;

async function adjustLoteKg(
  admin: AdminClient,
  loteId: string,
  deltaKg: number,
): Promise<void> {
  if (!deltaKg || !Number.isFinite(deltaKg)) return;
  const { data: lote } = await admin
    .from("lotes")
    .select("id, kg_total")
    .eq("id", loteId)
    .maybeSingle();
  if (!lote) return;
  const next = Math.max(0, Number(lote.kg_total ?? 0) + deltaKg);
  await admin.from("lotes").update({ kg_total: next }).eq("id", loteId);
}

/**
 * Mantiene cosechas.lote_id ↔ lotes.cosecha_ids en sincronía (service role).
 * adjustKg: sumar/restar kg al mover vínculos (vincular sueltas). No usar al crear
 * lote+cosecha juntos (el kg_total del lote ya se setea en el formulario).
 */
async function attachCosechaToLote(
  admin: AdminClient,
  cosechaId: string,
  loteId: string,
  opts: { adjustKg?: boolean } = {},
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { adjustKg = false } = opts;
  const { data: cosecha, error: cErr } = await admin
    .from("cosechas")
    .select("id, lote_id, kg")
    .eq("id", cosechaId)
    .maybeSingle();
  if (cErr || !cosecha) {
    return { ok: false, message: cErr?.message ?? "Recolección no encontrada" };
  }

  const prevLoteId = cosecha.lote_id as string | null;
  const kg = typeof cosecha.kg === "number" && Number.isFinite(cosecha.kg) ? Number(cosecha.kg) : 0;

  if (prevLoteId === loteId) {
    // Ya vinculado: solo asegurar cosecha_ids
    const { data: lote } = await admin
      .from("lotes")
      .select("id, cosecha_ids")
      .eq("id", loteId)
      .maybeSingle();
    if (lote) {
      const nextIds = appendCosechaId((lote.cosecha_ids as string[] | null) ?? [], cosechaId);
      await admin.from("lotes").update({ cosecha_ids: nextIds }).eq("id", loteId);
    }
    return { ok: true };
  }

  const { error: upC } = await admin
    .from("cosechas")
    .update({ lote_id: loteId })
    .eq("id", cosechaId);
  if (upC) return { ok: false, message: upC.message };

  if (prevLoteId) {
    const { data: prevLote } = await admin
      .from("lotes")
      .select("id, cosecha_ids")
      .eq("id", prevLoteId)
      .maybeSingle();
    if (prevLote) {
      const nextIds = removeCosechaId(
        (prevLote.cosecha_ids as string[] | null) ?? [],
        cosechaId,
      );
      await admin.from("lotes").update({ cosecha_ids: nextIds }).eq("id", prevLoteId);
    }
    if (adjustKg && kg) await adjustLoteKg(admin, prevLoteId, -kg);
  }

  const { data: lote, error: lErr } = await admin
    .from("lotes")
    .select("id, cosecha_ids")
    .eq("id", loteId)
    .maybeSingle();
  if (lErr || !lote) {
    return { ok: false, message: lErr?.message ?? "Lote no encontrado" };
  }

  const nextIds = appendCosechaId((lote.cosecha_ids as string[] | null) ?? [], cosechaId);
  const { error: upL } = await admin
    .from("lotes")
    .update({ cosecha_ids: nextIds })
    .eq("id", loteId);
  if (upL) return { ok: false, message: upL.message };

  // Sueltas → lote: sumar kg. Creación lote+cosecha usa adjustKg false.
  if (adjustKg && kg && !prevLoteId) {
    await adjustLoteKg(admin, loteId, kg);
  } else if (adjustKg && kg && prevLoteId) {
    await adjustLoteKg(admin, loteId, kg);
  }

  return { ok: true };
}

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

  // `publico`/`relato_publico` se muestran en la página de producto de la
  // tienda: invalidar ISR (fail-open, nunca bloquea).
  if (body.publico !== undefined || body.relato_publico !== undefined) {
    await revalidateTiendaLayout();
  }

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

/** Cosechas de la temporada (con colmena/apiario anidados) + vínculo a lote */
produccionRoutes.get("/cosechas", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("cosechas")
    .select(
      "id, kg, fecha, floracion, created_at, colmena_id, lote_id, colmenas(id, name, apiarios(name))",
    )
    .order("fecha", { ascending: false })
    .limit(300);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  // Nombres de lote para la lista (sin join tipado en typegen)
  const loteIds = [
    ...new Set(
      (data ?? [])
        .map((r) => r.lote_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  let loteNameById = new Map<string, string | null>();
  if (loteIds.length > 0) {
    const { data: lotesLite } = await supabase
      .from("lotes")
      .select("id, nombre_lote")
      .in("id", loteIds);
    loteNameById = new Map(
      (lotesLite ?? []).map((l) => [l.id, l.nombre_lote ?? null]),
    );
  }

  const enriched = (data ?? []).map((row) => ({
    ...row,
    lote_nombre: row.lote_id ? (loteNameById.get(row.lote_id) ?? null) : null,
  }));

  return c.json({ data: enriched });
});

produccionRoutes.post("/cosechas", zValidator("json", CreateCosechaSchema), async (c) => {
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  // Validar lote destino antes de insertar
  if (input.lote_id) {
    const { data: loteExists, error: loteErr } = await supabase
      .from("lotes")
      .select("id")
      .eq("id", input.lote_id)
      .maybeSingle();
    if (loteErr || !loteExists) {
      return c.json(
        { code: "lote_not_found", message: "El lote indicado no existe" },
        400,
      );
    }
  }

  const { data, error } = await supabase
    .from("cosechas")
    .insert({
      kg: input.kg,
      fecha: input.fecha,
      floracion: input.floracion?.trim() || null,
      colmena_id: input.colmena_id ?? null,
      lote_id: input.lote_id ?? null,
    })
    .select("id, lote_id")
    .single();

  if (error) {
    return c.json({ code: "cosecha_create_failed", message: error.message }, 400);
  }

  // Sincronizar lotes.cosecha_ids (service role; no bloquea si falla el array)
  if (data?.id && data.lote_id) {
    try {
      const admin = createAdminClient();
      const link = await attachCosechaToLote(admin, data.id, data.lote_id);
      if (!link.ok) {
        console.warn("[Produccion] attachCosechaToLote:", link.message);
      }
    } catch (err) {
      console.warn("[Produccion] attachCosechaToLote skipped:", err);
    }
  }

  return c.json({ data }, 201);
});

/** Lista liviana de lotes para selectores (vincular recolección). */
produccionRoutes.get("/lotes", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("lotes")
    .select("id, nombre_lote, kg_total, variedad_floral, publico, estado, created_at, cosecha_ids")
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({
    data: (data ?? []).map((l) => ({
      ...l,
      n_cosechas: Array.isArray(l.cosecha_ids) ? l.cosecha_ids.length : 0,
    })),
  });
});

const VincularCosechasSchema = z.object({
  cosecha_ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * Vincula recolecciones existentes a un lote (bidireccional).
 * Uso: recolecciones sueltas → un lote de bodega / pasaporte.
 */
produccionRoutes.post(
  "/lotes/:id/vincular-cosechas",
  requireProfileRole("admin"),
  zValidator("json", VincularCosechasSchema),
  async (c) => {
    const { id: loteId } = c.req.param();
    const { cosecha_ids } = c.req.valid("json");
    const admin = createAdminClient();

    const { data: lote, error: loteErr } = await admin
      .from("lotes")
      .select("id, cosecha_ids")
      .eq("id", loteId)
      .maybeSingle();
    if (loteErr || !lote) {
      return c.json({ code: "lote_not_found", message: "Lote no encontrado" }, 404);
    }

    const linked: string[] = [];
    const failed: Array<{ id: string; message: string }> = [];

    for (const cosechaId of cosecha_ids) {
      // Sueltas históricas: sí ajustar kg del lote destino
      const result = await attachCosechaToLote(admin, cosechaId, loteId, { adjustKg: true });
      if (result.ok) linked.push(cosechaId);
      else failed.push({ id: cosechaId, message: result.message });
    }

    // Releer array final
    const { data: refreshed } = await admin
      .from("lotes")
      .select("id, cosecha_ids")
      .eq("id", loteId)
      .maybeSingle();

    return c.json({
      data: {
        lote_id: loteId,
        linked,
        failed,
        cosecha_ids: (refreshed?.cosecha_ids as string[] | null) ?? mergeCosechaIds(
          (lote.cosecha_ids as string[] | null) ?? [],
          linked,
        ),
      },
    });
  },
);

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
      co2_ton: co2TonFromArboles(input.cantidad),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
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
          co2_ton: co2TonFromArboles(input.cantidad),
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
      cantidad: z.number().int().positive().max(100_000),
    }),
  ),
  async (c) => {
    // add_traceable_stock es service_role-only (CVE-N-002). El BFF exige admin
    // y ejecuta el RPC con service role. Si falta la key o el RPC falla, se
    // degrada a UPDATE directo con el client del usuario (sin lote/hash).
    const { producto_id, cantidad } = c.req.valid("json");

    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
    } catch (err) {
      console.error("[Produccion] createAdminClient:", err);
      // Fallback: el admin autenticado puede actualizar stock vía RLS si aplica
      return await addStockDirect(c, producto_id, cantidad, "service_role_missing");
    }

    try {
      const { data, error } = await rpcLoose(admin, "add_traceable_stock", {
        p_producto_id: producto_id,
        p_qty: cantidad,
      });

      if (error) {
        console.error("[Produccion] add_traceable_stock RPC:", error);
        // Fallback sin traza de lote si el RPC no está migrado / falla
        return await addStockDirect(c, producto_id, cantidad, error.message);
      }

      // Ancla on-chain fail-open: no bloquea la reposición
      const rpcData = data as Record<string, unknown> | null;
      const loteId = typeof rpcData?.lote_id === "string" ? rpcData.lote_id : null;
      let onChainTx: string | null = null;
      try {
        onChainTx = loteId
          ? await anchorLoteOnChain(c.get("empresaId"), loteId, producto_id, cantidad, rpcData)
          : null;
      } catch (anchorErr) {
        console.error("[Produccion] anchorLoteOnChain:", anchorErr);
      }

      // El stock cambió en la tienda: invalidar ISR (fail-open, nunca bloquea).
      await revalidateTiendaLayout();

      return c.json({ data: { ...rpcData, blockchain_tx: onChainTx, mode: "traceable" } });
    } catch (err) {
      console.error("[Produccion] add-stock unhandled:", err);
      const message = err instanceof Error ? err.message : "Error interno al cargar stock";
      return c.json({ code: "add_stock_failed", message, error: message }, 500);
    }
  },
);

/** POST /api/produccion/set-stock — ajuste absoluto de stock (reformular). */
produccionRoutes.post(
  "/set-stock",
  requireProfileRole("admin"),
  zValidator(
    "json",
    z.object({
      producto_id: z.string().uuid(),
      stock: z.number().int().min(0).max(100_000),
    }),
  ),
  async (c) => {
    const { producto_id, stock } = c.req.valid("json");

    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
    } catch (err) {
      console.error("[Produccion] createAdminClient:", err);
      // Fallback: el admin autenticado puede actualizar stock vía RLS (is_admin)
    }

    const client = admin ?? c.get("supabase");
    const { data: producto, error: readErr } = await client
      .from("productos")
      .select("id, stock")
      .eq("id", producto_id)
      .single();

    if (readErr || !producto) {
      return c.json(
        { code: "producto_not_found", message: readErr?.message ?? "Producto no encontrado" },
        404,
      );
    }

    const stockAnterior = Number(producto.stock ?? 0);
    const { error: updErr } = await client
      .from("productos")
      .update({ stock, updated_at: new Date().toISOString() })
      .eq("id", producto_id);

    if (updErr) {
      return c.json({ code: "stock_update_failed", message: updErr.message }, 400);
    }

    // El stock cambió en la tienda: invalidar ISR (fail-open, nunca bloquea).
    await revalidateTiendaLayout();

    return c.json({
      data: {
        producto_id,
        stock_anterior: stockAnterior,
        stock_nuevo: stock,
        mode: admin ? "service" : "direct",
      },
    });
  },
);

/** UPDATE directo de stock (sin RPC/lote). Fallback de add-stock. */
async function addStockDirect(
  // Context Hono mínimo
  c: {
    get: (key: "supabase") => AppVariables["supabase"];
    json: (body: unknown, status?: number) => Response;
  },
  productoId: string,
  cantidad: number,
  reason: string,
) {
  const userClient = c.get("supabase");
  const { data: producto, error: readErr } = await userClient
    .from("productos")
    .select("id, stock")
    .eq("id", productoId)
    .single();

  if (readErr || !producto) {
    return c.json(
      {
        code: "producto_not_found",
        message: readErr?.message ?? "Producto no encontrado",
        error: reason,
      },
      404,
    );
  }

  const stockAnterior = Number(producto.stock ?? 0);
  const stockNuevo = stockAnterior + cantidad;
  const { error: updErr } = await userClient
    .from("productos")
    .update({ stock: stockNuevo, updated_at: new Date().toISOString() })
    .eq("id", productoId);

  if (updErr) {
    return c.json(
      { code: "stock_update_failed", message: updErr.message, error: updErr.message },
      400,
    );
  }

  // El stock cambió en la tienda: invalidar ISR (fail-open, nunca bloquea).
  await revalidateTiendaLayout();

  return c.json({
    data: {
      producto_id: productoId,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      lote_id: null,
      mode: "direct",
      fallback_reason: reason,
    },
  });
}

const CreateLoteSchema = z.object({
  nombre_lote: z.string().min(1).max(200).optional(),
  kg_total: z.number().positive(),
  variedad_floral: z.string().max(100).optional().nullable(),
  fecha: z.string().date().optional(),
  /** Opcional: vincular recolecciones ya existentes al crear el lote. */
  cosecha_ids: z.array(z.string().uuid()).max(50).optional(),
});

/** Crea un lote (pipeline recolección → lote). Acepta cosecha_ids para vínculo inmediato. */
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
        cosecha_ids: input.cosecha_ids?.length ? input.cosecha_ids : [],
        created_at: input.fecha ? `${input.fecha}T00:00:00.000Z` : new Date().toISOString(),
      })
      .select("id, nombre_lote, kg_total, variedad_floral, created_at, cosecha_ids")
      .single();

    if (error) {
      return c.json({ code: "lote_create_failed", message: error.message }, 400);
    }

    // Bidireccional: cada cosecha apunta al lote nuevo
    if (data?.id && input.cosecha_ids?.length) {
      for (const cosechaId of input.cosecha_ids) {
        const link = await attachCosechaToLote(admin, cosechaId, data.id);
        if (!link.ok) {
          console.warn("[Produccion] create lote attach:", cosechaId, link.message);
        }
      }
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
