import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { rpcLoose } from "@/api/lib/supabase-loose";
import type { Json } from "@enjambre/database/database.types";

export const produccionRoutes = new Hono<{ Variables: AppVariables }>();

produccionRoutes.use("*", authMiddleware, tenantMiddleware);

produccionRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [lotesRes, productosRes, ventasRes] = await Promise.all([
    supabase
      .from("lotes")
      .select("*, productos(id, nombre, stock, peso_neto_g)")
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

const CreateReflexionSchema = z.object({
  colmena: z.string().max(200).optional(),
  texto: z.string().min(1).max(8000),
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

produccionRoutes.get("/reflexiones", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("reflexiones")
    .select("id, texto, fecha, foto_url, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const rows = (data ?? []).map((r) => ({
    id: String(r.id),
    fecha: r.created_at
      ? new Date(String(r.created_at)).toLocaleDateString("es-CL")
      : new Date().toLocaleDateString("es-CL"),
    colmena: r.foto_url?.trim() || "General",
    texto: String(r.texto ?? ""),
  }));

  return c.json({ data: rows });
});

produccionRoutes.post("/reflexiones", zValidator("json", CreateReflexionSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("reflexiones")
    .insert({
      user_id: user.id,
      texto: input.texto,
      fecha: new Date().toISOString().split("T")[0],
      foto_url: input.colmena?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return c.json({ code: "reflexion_create_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

produccionRoutes.post(
  "/add-stock",
  zValidator(
    "json",
    z.object({
      producto_id: z.string().uuid(),
      cantidad: z.number().int().positive()
    })
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const { producto_id, cantidad } = c.req.valid("json");

    const { data, error } = await rpcLoose(supabase, "add_traceable_stock", {
      p_producto_id: producto_id,
      p_qty: cantidad,
    });

    if (error) {
      console.error("[Produccion] Error agregando stock:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ data });
  }
);
