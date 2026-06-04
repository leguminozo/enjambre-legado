import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

const IngredientSchema = z.object({
  nombre: z.string().min(1),
  unidad: z.enum(["g", "kg", "ml", "l", "unidad"]),
  estado_default: z.enum(["crudo", "procesado", "tostado", "molido", "fresco", "seco", "desecado"]),
  categoria: z.string().optional(),
  precio_ref: z.number().int().optional(),
  proveedor_ref: z.string().uuid().optional(),
});

const PriceObsSchema = z.object({
  ingredient_id: z.string().uuid(),
  proveedor_id: z.string().uuid().optional(),
  precio: z.number().int().positive(),
  unidad_reportada: z.string().optional(),
  fecha: z.string().optional(),
  fuente: z.enum(["manual", "factura", "cotizacion", "feria", "online"]).default("manual"),
  notas: z.string().optional(),
});

const RecipeSchema = z.object({
  producto_id: z.string().uuid(),
  version: z.number().int().min(1).default(1),
  rendimiento_frascos: z.number().int().positive(),
  formato_frasco: z.string().min(1),
  merma_pct: z.number().min(0).max(100).default(0),
  costo_empaque: z.number().int().min(0).default(0),
  notas: z.string().optional(),
});

const RecipeLineSchema = z.object({
  ingredient_id: z.string().uuid(),
  cantidad: z.number().positive(),
  estado: z.enum(["crudo", "procesado", "tostado", "molido", "fresco", "seco", "desecado"]),
  factor_conversion: z.number().positive().default(1.0),
  orden: z.number().int().min(0).default(0),
});

const RecipeLinesBulkSchema = z.object({
  lines: z.array(RecipeLineSchema).min(1),
});

export const costeoRoutes = new Hono<{ Variables: AppVariables }>();

costeoRoutes.use("*", authMiddleware, tenantMiddleware);

// ── INGREDIENTES ──

costeoRoutes.get("/ingredientes", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const search = c.req.query("search");

  let query = supabase
    .from("ingredients")
    .select("*, proveedor_ref_terceros:terceros(id, nombre)")
    .eq("empresa_id", empresaId)
    .order("nombre");

  if (search && search.length >= 2) {
    query = query.ilike("nombre", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

costeoRoutes.post("/ingredientes", zValidator("json", IngredientSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("ingredients")
    .insert({ empresa_id: empresaId, ...input })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return c.json({ code: "duplicate", message: "Ya existe un ingrediente con ese nombre" }, 409);
    }
    return c.json({ code: "insert_failed", message: error.message }, 400);
  }

  return c.json({ data }, 201);
});

costeoRoutes.patch("/ingredientes/:id", zValidator("json", IngredientSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("ingredients")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  if (!data) return c.json({ code: "not_found", message: "Ingrediente no encontrado" }, 404);
  return c.json({ data });
});

costeoRoutes.delete("/ingredientes/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");

  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { id } });
});

// ── OBSERVACIONES DE PRECIO ──

costeoRoutes.get("/precios", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const ingredientId = c.req.query("ingredient_id");

  let query = supabase
    .from("price_observations")
    .select("*, ingredients(nombre, unidad), terceros:proveedor_id(nombre)")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false })
    .limit(100);

  if (ingredientId) {
    query = query.eq("ingredient_id", ingredientId);
  }

  const { data, error } = await query;

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

costeoRoutes.post("/precios", zValidator("json", PriceObsSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("price_observations")
    .insert({
      empresa_id: empresaId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

// ── RECETAS ──

costeoRoutes.get("/recetas", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("recipes")
    .select("*, productos(nombre, precio, formato)")
    .eq("empresa_id", empresaId)
    .eq("activa", true)
    .order("created_at", { ascending: false });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

costeoRoutes.post("/recetas", zValidator("json", RecipeSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase
    .from("recipes")
    .insert({ empresa_id: empresaId, ...input })
    .select("*, productos(nombre, precio, formato)")
    .single();

  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

costeoRoutes.get("/recetas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");

  const { data: recipe, error: rErr } = await supabase
    .from("recipes")
    .select("*, productos(nombre, precio, formato)")
    .eq("id", id)
    .single();

  if (rErr || !recipe) return c.json({ code: "not_found", message: "Receta no encontrada" }, 404);

  const { data: lines } = await supabase
    .from("recipe_lines")
    .select("*, ingredients(id, nombre, unidad, precio_ref)")
    .eq("recipe_id", id)
    .order("orden");

  return c.json({ data: { ...recipe, lines: lines ?? [] } });
});

costeoRoutes.patch("/recetas/:id", zValidator("json", RecipeSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("recipes")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, productos(nombre, precio, formato)")
    .single();

  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  if (!data) return c.json({ code: "not_found" }, 404);
  return c.json({ data });
});

costeoRoutes.delete("/recetas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("recipes")
    .update({ activa: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { id, activa: false } });
});

// ── LÍNEAS DE RECETA ──

costeoRoutes.get("/recetas/:id/lineas", async (c) => {
  const recipeId = c.req.param("id");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("recipe_lines")
    .select("*, ingredients(id, nombre, unidad, precio_ref)")
    .eq("recipe_id", recipeId)
    .order("orden");

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

costeoRoutes.post("/recetas/:id/lineas", zValidator("json", RecipeLinesBulkSchema), async (c) => {
  const recipeId = c.req.param("id");
  const { lines } = c.req.valid("json");
  const supabase = c.get("supabase");

  const rows = lines.map((l) => ({ recipe_id: recipeId, ...l }));

  const { data, error } = await supabase
    .from("recipe_lines")
    .insert(rows)
    .select("*, ingredients(id, nombre, unidad, precio_ref)");

  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

costeoRoutes.patch("/recetas/:recipeId/lineas/:lineId", zValidator("json", RecipeLineSchema.partial()), async (c) => {
  const lineId = c.req.param("lineId");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("recipe_lines")
    .update(input)
    .eq("id", lineId)
    .select("*, ingredients(id, nombre, unidad, precio_ref)")
    .single();

  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

costeoRoutes.delete("/recetas/:recipeId/lineas/:lineId", async (c) => {
  const lineId = c.req.param("lineId");
  const supabase = c.get("supabase");

  const { error } = await supabase.from("recipe_lines").delete().eq("id", lineId);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { id: lineId } });
});

// ── COSTEO AUTOMÁTICO ──

costeoRoutes.get("/recetas/:id/costo", async (c) => {
  const recipeId = c.req.param("id");
  const supabase = c.get("supabase");

  const { data, error } = await supabase.rpc("calcular_costo_receta", {
    p_recipe_id: recipeId,
  });

  if (error) return c.json({ code: "costeo_failed", message: error.message }, 500);
  return c.json({ data });
});

// ── VISTA DE MÁRGENES ──

costeoRoutes.get("/margenes", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("recipe_costing_view")
    .select("*");

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});
