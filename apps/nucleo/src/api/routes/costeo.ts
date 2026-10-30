import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";
import { parseIntegerCLP, parseNumberCLP } from "@/lib/costeo-utils";
import type { Database } from "@enjambre/database";

type RecipeLineUpdate = Database["public"]["Tables"]["recipe_lines"]["Update"];

const UNIDADES_BOM = ["g", "kg", "ml", "l", "unidad"] as const;
const ESTADOS_INSUMO = ["crudo", "procesado", "tostado", "molido", "fresco", "seco", "desecado"] as const;

const IngredientSchema = z.object({
  nombre: z.string().min(1),
  unidad: z.enum(UNIDADES_BOM),
  estado_default: z.enum(ESTADOS_INSUMO),
  categoria: z.string().optional(),
  precio_ref: z.preprocess((v) => (v === undefined || v === null || v === "" ? undefined : parseIntegerCLP(v, 0)), z.number().int().optional()),
  proveedor_ref: z.string().uuid().optional().nullable(),
}).strict();

const PriceObsSchema = z.object({
  ingredient_id: z.string().uuid(),
  proveedor_id: z.string().uuid().optional(),
  precio: z.preprocess((v) => parseIntegerCLP(v, 0), z.number().int().positive()),
  unidad_reportada: z.string().optional(),
  fecha: z.string().optional(),
  fuente: z.enum(["manual", "factura", "cotizacion", "feria", "online"]).default("manual"),
  notas: z.string().optional(),
}).strict();

const RecipeSchema = z.object({
  producto_id: z.string().uuid(),
  version: z.preprocess((v) => (v === undefined ? 1 : parseIntegerCLP(v, 1)), z.number().int().min(1).default(1)),
  rendimiento_frascos: z.preprocess((v) => parseIntegerCLP(v, 1), z.number().int().positive()),
  formato_frasco: z.string().min(1),
  merma_pct: z.preprocess((v) => parseNumberCLP(v, 0), z.number().min(0).max(100).default(0)),
  costo_empaque: z.preprocess((v) => parseIntegerCLP(v, 0), z.number().int().min(0).default(0)),
  notas: z.string().optional(),
}).strict();

const RecipeLineSchema = z.object({
  id: z.string().uuid().optional(),
  ingredient_id: z.string().uuid(),
  cantidad: z.preprocess((v) => parseNumberCLP(v, 0), z.number().positive()),
  unidad: z.enum(UNIDADES_BOM).optional(),
  estado: z.enum(ESTADOS_INSUMO),
  factor_conversion: z.preprocess((v) => (v === undefined ? 1.0 : parseNumberCLP(v, 1.0)), z.number().positive().default(1.0)),
  orden: z.preprocess((v) => (v === undefined ? 0 : parseIntegerCLP(v, 0)), z.number().int().min(0).default(0)),
}).strict();

const RecipeLinesBulkSchema = z.object({
  lines: z.array(RecipeLineSchema).min(1),
}).strict();

const RecipeFullUpdateSchema = RecipeSchema.partial().extend({
  lines: z.array(RecipeLineSchema).optional(),
});

const ProduccionLoteSchema = z.object({
  cantidad_lotes: z.preprocess((v) => (v === undefined ? 1 : parseIntegerCLP(v, 1)), z.number().int().positive().default(1)),
  deducir_inventario: z.boolean().default(true),
  notas: z.string().optional(),
}).strict();

export const costeoRoutes = new Hono<{ Variables: AppVariables }>();

costeoRoutes.use("*", authMiddleware, tenantMiddleware);

// ── INSUMOS DE INVENTARIO OPERATIVO Y NORMALIZACIÓN HISTÓRICA ──

function parseFormatoGramosOMl(formato: string | null | undefined): number {
  if (!formato) return 0;
  const match = formato.trim().toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|ml|l|lt)\b/);
  if (!match) return 0;
  const val = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(val) || val <= 0) return 0;
  const unit = match[2];
  if (unit === "kg" || unit === "l" || unit === "lt") return val * 1000;
  return val;
}

async function normalizeLegacyCosteoData(supabase: AppVariables["supabase"], empresaId: string): Promise<void> {
  try {
    // 1. Corregir costos truncados por antiguo parseInt("4.500") -> 4 en insumos por kg o litro
    const { data: invTruncated } = await fromLoose(supabase, "inventario_items")
      .select("id, unidad, costo_unitario")
      .in("unidad", ["kg", "l"])
      .gte("costo_unitario", 1)
      .lt("costo_unitario", 50);

    for (const item of (invTruncated as Array<{ id: string; unidad: string; costo_unitario: number }>) ?? []) {
      const normalizedCost = Math.round(Number(item.costo_unitario) * 1000);
      await fromLoose(supabase, "inventario_items")
        .update({ costo_unitario: normalizedCost })
        .eq("id", item.id);
    }

    const { data: ingTruncated } = await supabase
      .from("ingredients")
      .select("id, unidad, precio_ref")
      .eq("empresa_id", empresaId)
      .in("unidad", ["kg", "l"])
      .gte("precio_ref", 1)
      .lt("precio_ref", 50);

    for (const ing of ingTruncated ?? []) {
      if (ing.precio_ref !== null) {
        const normalizedPrice = Math.round(Number(ing.precio_ref) * 1000);
        await supabase
          .from("ingredients")
          .update({ precio_ref: normalizedPrice, updated_at: new Date().toISOString() })
          .eq("id", ing.id)
          .eq("empresa_id", empresaId);
      }
    }

    // 2. Normalizar recetas históricas formuladas por 1 unidad que quedaron con rendimiento de lote (ej. 661 o 4356)
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, rendimiento_frascos, formato_frasco")
      .eq("empresa_id", empresaId)
      .eq("activa", true)
      .gt("rendimiento_frascos", 1);

    if (!recipes || recipes.length === 0) return;

    for (const rec of recipes) {
      const { data: rawLines } = await fromLoose(supabase, "recipe_lines")
        .select("cantidad, unidad, ingredients(unidad)")
        .eq("recipe_id", rec.id);

      const lines = (rawLines as Array<{
        cantidad: number;
        unidad?: string | null;
        ingredients?: { unidad?: string | null } | null;
      }>) ?? [];

      if (lines.length === 0) continue;

      let totalGramosOMl = 0;
      for (const l of lines) {
        const u = (l.unidad || l.ingredients?.unidad || "").toLowerCase().trim();
        const qty = Number(l.cantidad) || 0;
        if (u === "kg" || u === "l") totalGramosOMl += qty * 1000;
        else if (u === "g" || u === "ml") totalGramosOMl += qty;
      }

      if (totalGramosOMl <= 0) continue;

      const formatoBase = parseFormatoGramosOMl(rec.formato_frasco);
      const isSingleUnitBySmallMass = totalGramosOMl <= 100 && rec.rendimiento_frascos > 10;
      const isSingleUnitByFormat =
        formatoBase > 0 && totalGramosOMl <= formatoBase * 2.5 && rec.rendimiento_frascos > 5;

      if (isSingleUnitBySmallMass || isSingleUnitByFormat) {
        await supabase
          .from("recipes")
          .update({ rendimiento_frascos: 1, updated_at: new Date().toISOString() })
          .eq("id", rec.id)
          .eq("empresa_id", empresaId);
      }
    }
  } catch (e) {
    console.error("Error al normalizar datos históricos de costeo:", e);
  }
}

async function syncInventarioToIngredients(supabase: AppVariables["supabase"], empresaId: string): Promise<number> {
  try {
    await normalizeLegacyCosteoData(supabase, empresaId);

    // 1. Sincronizar insumos, envases y destilación registrados en inventario_items
    const { data: invItems, error: invErr } = await fromLoose(supabase, "inventario_items")
      .select("id, nombre, unidad, costo_unitario, clase, ingredient_id")
      .eq("activo", true)
      .in("clase", ["insumo", "destilacion", "apicola"]);

    const activeInsumos = (invItems as Array<{
      id: string;
      nombre: string;
      unidad: string;
      costo_unitario: number;
      clase: string;
      ingredient_id?: string | null;
    }>) ?? [];

    const validUnits = ["g", "kg", "ml", "l", "unidad"];
    let count = 0;
    const activeIngredientIds = new Set<string>();

    for (const inv of activeInsumos) {
      if (!inv.nombre) continue;
      const cleanName = inv.nombre.trim();
      let ingId = inv.ingredient_id;

      if (!ingId) {
        const { data: match } = await supabase
          .from("ingredients")
          .select("id, precio_ref")
          .eq("empresa_id", empresaId)
          .ilike("nombre", cleanName)
          .maybeSingle();

        if (match?.id) {
          ingId = match.id;
          await fromLoose(supabase, "inventario_items")
            .update({ ingredient_id: ingId })
            .eq("id", inv.id);

          if (inv.costo_unitario > 0 && Number(match.precio_ref) !== Number(inv.costo_unitario)) {
            await supabase
              .from("ingredients")
              .update({ precio_ref: inv.costo_unitario, updated_at: new Date().toISOString() })
              .eq("id", ingId);
          }
          count += 1;
        }
      } else {
        if (inv.costo_unitario > 0) {
          await supabase
            .from("ingredients")
            .update({ precio_ref: inv.costo_unitario, updated_at: new Date().toISOString() })
            .eq("id", ingId)
            .eq("empresa_id", empresaId);
          count += 1;
        }
      }

      if (!ingId) {
        const rawUnit = (inv.unidad || "").toLowerCase().trim();
        const unit = validUnits.includes(rawUnit) ? rawUnit : "unidad";
        const { data: newIng, error: insErr } = await supabase
          .from("ingredients")
          .insert({
            empresa_id: empresaId,
            nombre: cleanName,
            unidad: unit,
            estado_default: "crudo",
            categoria: inv.clase || "insumo",
            precio_ref: Number(inv.costo_unitario || 0),
          })
          .select("id")
          .single();

        if (!insErr && newIng?.id) {
          ingId = newIng.id;
          await fromLoose(supabase, "inventario_items")
            .update({ ingredient_id: newIng.id })
            .eq("id", inv.id);
          count += 1;
        }
      }

      if (ingId) {
        activeIngredientIds.add(ingId);
      }
    }

    // 2. Sincronizar miel a granel desde lotes de recolección apícola activos
    try {
      const { data: lotesMiel } = await fromLoose(supabase, "lotes")
        .select("id, nombre_lote, variedad_floral, kg_total, estado")
        .or("estado.eq.disponible,estado.is.null")
        .gt("kg_total", 0);

      for (const lote of lotesMiel ?? []) {
        const loteLabel = lote.nombre_lote
          ? `Miel ${lote.variedad_floral || 'Nativa'} (${lote.nombre_lote})`
          : `Miel ${lote.variedad_floral || 'Nativa'} (Lote ${String(lote.id).slice(0, 8)})`;

        const { data: match } = await supabase
          .from("ingredients")
          .select("id, precio_ref")
          .eq("empresa_id", empresaId)
          .ilike("nombre", loteLabel)
          .maybeSingle();

        let loteIngId = match?.id;
        if (!loteIngId) {
          const { data: newIng, error: newIngErr } = await supabase
            .from("ingredients")
            .insert({
              empresa_id: empresaId,
              nombre: loteLabel,
              unidad: "kg",
              estado_default: "crudo",
              categoria: "miel",
              precio_ref: 5000,
            })
            .select("id")
            .single();

          if (!newIngErr && newIng?.id) {
            loteIngId = newIng.id;
            count += 1;
          }
        }

        if (loteIngId) {
          activeIngredientIds.add(loteIngId);
        }
      }
    } catch (e) {
      console.error("Error sincronizando lotes de miel a ingredientes:", e);
    }

    // 3. Sincronizar hierbas e infusiones deshidratadas de recolección silvestre
    try {
      const { data: infusionMPs } = await fromLoose(supabase, "infusion_materias_primas")
        .select("id, nombre, tipo, unidad_medida, ingredient_id")
        .eq("activa", true);

      const { data: costosInfusiones } = await fromLoose(supabase, "v_infusion_costos")
        .select("materia_prima_id, costo_seco_kg_clp");

      const costoMap = new Map<string, number>();
      for (const ci of costosInfusiones ?? []) {
        if (ci.materia_prima_id && ci.costo_seco_kg_clp) {
          costoMap.set(ci.materia_prima_id, Number(ci.costo_seco_kg_clp));
        }
      }

      for (const mp of infusionMPs ?? []) {
        if (!mp.nombre) continue;
        const mpName = `${mp.nombre.trim()} (Hierba Seca)`;
        let ingId = mp.ingredient_id;
        const refPrice = costoMap.get(mp.id) || 12000;

        if (!ingId) {
          const { data: match } = await supabase
            .from("ingredients")
            .select("id")
            .eq("empresa_id", empresaId)
            .ilike("nombre", mpName)
            .maybeSingle();

          if (match?.id) {
            ingId = match.id;
            await fromLoose(supabase, "infusion_materias_primas")
              .update({ ingredient_id: ingId })
              .eq("id", mp.id);
          } else {
            const { data: newIng, error: newErr } = await supabase
              .from("ingredients")
              .insert({
                empresa_id: empresaId,
                nombre: mpName,
                unidad: "kg",
                estado_default: "seco",
                categoria: "infusion",
                precio_ref: refPrice,
              })
              .select("id")
              .single();

            if (!newErr && newIng?.id) {
              ingId = newIng.id;
              await fromLoose(supabase, "infusion_materias_primas")
                .update({ ingredient_id: ingId })
                .eq("id", mp.id);
              count += 1;
            }
          }
        }

        if (ingId) {
          activeIngredientIds.add(ingId);
        }
      }
    } catch (e) {
      console.error("Error sincronizando infusiones a ingredientes:", e);
    }

    // 4. Sincronizar hidrolatos y destilaciones territoriales
    try {
      const { data: prodsDestilacion } = await fromLoose(supabase, "productos_destilacion")
        .select("id, tipo, volumen_ml, precio_sugerido_clp, destilaciones(codigo, plantas_destilacion(nombre_comun))");

      for (const pd of prodsDestilacion ?? []) {
        const dest = (Array.isArray(pd.destilaciones) ? pd.destilaciones[0] : pd.destilaciones) as unknown as Record<string, unknown> | null;
        const planta = (Array.isArray(dest?.plantas_destilacion) ? dest.plantas_destilacion[0] : dest?.plantas_destilacion) as unknown as Record<string, unknown> | null;
        const nombreComun = String(planta?.nombre_comun ?? pd.tipo ?? "Hidrolato");
        const destName = `Hidrolato de ${nombreComun}`;

        const { data: match } = await supabase
          .from("ingredients")
          .select("id")
          .eq("empresa_id", empresaId)
          .ilike("nombre", destName)
          .maybeSingle();

        let destIngId = match?.id;
        if (!destIngId) {
          const { data: newIng, error: newErr } = await supabase
            .from("ingredients")
            .insert({
              empresa_id: empresaId,
              nombre: destName,
              unidad: "ml",
              estado_default: "procesado",
              categoria: "destilacion",
              precio_ref: pd.precio_sugerido_clp
                ? Math.round(Number(pd.precio_sugerido_clp) / Math.max(1, Number(pd.volumen_ml || 100)))
                : 35,
            })
            .select("id")
            .single();

          if (!newErr && newIng?.id) {
            destIngId = newIng.id;
            count += 1;
          }
        }

        if (destIngId) {
          activeIngredientIds.add(destIngId);
        }
      }
    } catch (e) {
      console.error("Error sincronizando alambique a ingredientes:", e);
    }

    // Limpiar ingredientes huérfanos que no corresponden a ninguna fuente activa
    // (siempre que no estén siendo usados por alguna línea de receta activa)
    if (!invErr) {
      const { data: allIngs } = await supabase
        .from("ingredients")
        .select("id")
        .eq("empresa_id", empresaId);

      const { data: usedLines } = await fromLoose(supabase, "recipe_lines")
        .select("ingredient_id");

      const usedIds = new Set(
        ((usedLines as Array<{ ingredient_id?: string | null }>) ?? [])
          .map((l) => l.ingredient_id)
          .filter((id): id is string => Boolean(id)),
      );

      for (const ing of allIngs ?? []) {
        if (!activeIngredientIds.has(ing.id) && !usedIds.has(ing.id)) {
          await supabase
            .from("ingredients")
            .delete()
            .eq("id", ing.id)
            .eq("empresa_id", empresaId);
        }
      }
    }

    return count;
  } catch (e) {
    console.error("Error al sincronizar inventario y recolecciones a ingredientes:", e);
    return 0;
  }
}

costeoRoutes.get("/inventario-insumos", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  if (empresaId) {
    await syncInventarioToIngredients(supabase, empresaId);
  }

  // 1. Insumos y destilación en inventario operativo
  const { data: invData, error } = await fromLoose(supabase, "inventario_items")
    .select("id, nombre, clase, unidad, stock, stock_minimo, costo_unitario, proveedor_nota, ingredient_id")
    .eq("activo", true)
    .in("clase", ["insumo", "destilacion", "apicola"])
    .order("nombre");

  if (error && error.code !== "42P01") {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  const items: Array<{
    id: string;
    ingredient_id: string;
    nombre: string;
    clase: string;
    unidad: string;
    stock: number;
    stock_minimo?: number;
    costo_unitario: number;
    proveedor_nota?: string;
    origen: string;
    lote_id?: string;
    materia_prima_id?: string;
  }> = [];

  for (const inv of invData ?? []) {
    items.push({
      id: inv.id,
      ingredient_id: inv.ingredient_id || inv.id,
      nombre: inv.nombre,
      clase: inv.clase || "insumo",
      unidad: inv.unidad || "unidad",
      stock: Number(inv.stock ?? 0),
      stock_minimo: Number(inv.stock_minimo ?? 0),
      costo_unitario: Number(inv.costo_unitario ?? 0),
      proveedor_nota: inv.proveedor_nota ?? "Bodega Operativa",
      origen: "inventario",
    });
  }

  // 2. Miel a granel (lotes de recolección apícola activos con stock)
  try {
    const { data: lotesMiel } = await fromLoose(supabase, "lotes")
      .select("id, nombre_lote, variedad_floral, kg_total, estado")
      .or("estado.eq.disponible,estado.is.null")
      .gt("kg_total", 0);

    if (lotesMiel && lotesMiel.length > 0) {
      const { data: ings } = await supabase
        .from("ingredients")
        .select("id, nombre, precio_ref")
        .eq("empresa_id", empresaId)
        .eq("categoria", "miel");

      const ingMap = new Map((ings ?? []).map((i) => [i.nombre.toLowerCase(), i]));

      for (const lote of lotesMiel) {
        const loteLabel = lote.nombre_lote
          ? `Miel ${lote.variedad_floral || 'Nativa'} (${lote.nombre_lote})`
          : `Miel ${lote.variedad_floral || 'Nativa'} (Lote ${String(lote.id).slice(0, 8)})`;
        const matchedIng = ingMap.get(loteLabel.toLowerCase());

        items.push({
          id: `lote_${lote.id}`,
          ingredient_id: matchedIng?.id || lote.id,
          nombre: loteLabel,
          clase: "miel",
          unidad: "kg",
          stock: Number(lote.kg_total ?? 0),
          costo_unitario: Number(matchedIng?.precio_ref ?? 5000),
          proveedor_nota: `Predio Pureo · Lote ${lote.nombre_lote || 'Activo'}`,
          origen: "lote_miel",
          lote_id: lote.id,
        });
      }
    }
  } catch (e) {
    console.error("Error obteniendo lotes de miel para recetas:", e);
  }

  // 3. Hierbas secas de recolección de infusiones
  try {
    const { data: stockSeco } = await fromLoose(supabase, "v_infusion_stock_seco")
      .select("materia_prima_id, materia_prima, stock_disponible_kg");

    if (stockSeco && stockSeco.length > 0) {
      const { data: ings } = await supabase
        .from("ingredients")
        .select("id, nombre, precio_ref")
        .eq("empresa_id", empresaId)
        .eq("categoria", "infusion");

      const ingMap = new Map((ings ?? []).map((i) => [i.nombre.toLowerCase(), i]));

      for (const sec of stockSeco) {
        const secLabel = `${sec.materia_prima} (Hierba Seca)`;
        const matchedIng = ingMap.get(secLabel.toLowerCase());

        items.push({
          id: `infusion_${sec.materia_prima_id}`,
          ingredient_id: matchedIng?.id || sec.materia_prima_id,
          nombre: secLabel,
          clase: "infusion",
          unidad: "kg",
          stock: Number(sec.stock_disponible_kg ?? 0),
          costo_unitario: Number(matchedIng?.precio_ref ?? 12000),
          proveedor_nota: "Bosque Nativo · Recolección Silvestre",
          origen: "recoleccion_infusion",
          materia_prima_id: sec.materia_prima_id,
        });
      }
    }
  } catch (e) {
    console.error("Error obteniendo stock seco de infusiones para recetas:", e);
  }

  // 4. Hidrolatos del alambique
  try {
    const { data: hidrolatos } = await fromLoose(supabase, "productos_destilacion")
      .select("id, tipo, volumen_ml, unidades, precio_sugerido_clp, destilaciones(codigo, plantas_destilacion(nombre_comun))");

    if (hidrolatos && hidrolatos.length > 0) {
      const { data: ings } = await supabase
        .from("ingredients")
        .select("id, nombre, precio_ref")
        .eq("empresa_id", empresaId)
        .eq("categoria", "destilacion");

      const ingMap = new Map((ings ?? []).map((i) => [i.nombre.toLowerCase(), i]));

      for (const h of hidrolatos) {
        const dest = (Array.isArray(h.destilaciones) ? h.destilaciones[0] : h.destilaciones) as unknown as Record<string, unknown> | null;
        const planta = (Array.isArray(dest?.plantas_destilacion) ? dest.plantas_destilacion[0] : dest?.plantas_destilacion) as unknown as Record<string, unknown> | null;
        const nombreComun = String(planta?.nombre_comun ?? h.tipo ?? "Hidrolato");
        const destLabel = `Hidrolato de ${nombreComun}`;
        const matchedIng = ingMap.get(destLabel.toLowerCase());

        items.push({
          id: `hidrolato_${h.id}`,
          ingredient_id: matchedIng?.id || h.id,
          nombre: destLabel,
          clase: "destilacion",
          unidad: "ml",
          stock: Number((h.unidades ?? 1) * (h.volumen_ml ?? 100)),
          costo_unitario: Number(matchedIng?.precio_ref ?? 35),
          proveedor_nota: `Alambique · Destilación ${dest?.codigo || ''}`,
          origen: "alambique",
        });
      }
    }
  } catch (e) {
    console.error("Error obteniendo hidrolatos para recetas:", e);
  }

  return c.json({ data: items });
});

// ── INGREDIENTES DE FÓRMULA (Sincronizados con Inventario y Recolecciones) ──

costeoRoutes.get("/ingredientes", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const search = c.req.query("search");

  if (empresaId) {
    await syncInventarioToIngredients(supabase, empresaId);
  }

  let query = supabase
    .from("ingredients")
    .select("*, proveedor_ref_terceros:terceros(id, nombre, rut)")
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
    .select("*, proveedor_ref_terceros:terceros(id, nombre, rut)")
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
    .select("*, proveedor_ref_terceros:terceros(id, nombre, rut)")
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
    .select("*, ingredients(nombre, unidad), terceros:proveedor_id(nombre, rut)")
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

  if (empresaId) {
    await normalizeLegacyCosteoData(supabase, empresaId);
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*, productos(id, nombre, precio, formato, stock)")
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
    .select("*, productos(id, nombre, precio, formato, stock)")
    .single();

  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

costeoRoutes.get("/recetas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  if (empresaId) {
    await normalizeLegacyCosteoData(supabase, empresaId);
  }

  const { data: recipe, error: rErr } = await supabase
    .from("recipes")
    .select("*, productos(id, nombre, precio, formato, stock)")
    .eq("id", id)
    .single();

  if (rErr || !recipe) return c.json({ code: "not_found", message: "Receta no encontrada" }, 404);

  const { data: rawLines } = await fromLoose(supabase, "recipe_lines")
    .select("*, ingredients(id, nombre, unidad, precio_ref, categoria, proveedor_ref, terceros:proveedor_ref(id, nombre, rut, telefono, email))")
    .eq("recipe_id", id)
    .order("orden");

  // Enriquecer con stock actual en inventario_items y orígenes de recolección
  const { data: invItems } = await fromLoose(supabase, "inventario_items")
    .select("id, nombre, clase, unidad, stock, stock_minimo, costo_unitario, proveedor_nota, ingredient_id")
    .eq("activo", true);

  const invList = (invItems as Array<{
    id: string;
    nombre: string;
    clase: string;
    unidad: string;
    stock: number;
    stock_minimo: number;
    costo_unitario: number;
    proveedor_nota?: string | null;
    ingredient_id?: string | null;
  }>) ?? [];

  // Obtener lotes de miel disponibles para enriquecer
  const { data: lotesMiel } = await fromLoose(supabase, "lotes")
    .select("id, nombre_lote, variedad_floral, kg_total")
    .gt("kg_total", 0);

  // Obtener stock seco de infusiones
  const { data: stockSecoInfusiones } = await fromLoose(supabase, "v_infusion_stock_seco")
    .select("materia_prima_id, materia_prima, stock_disponible_kg");

  const lines = ((rawLines as Array<Record<string, unknown>>) ?? []).map((l) => {
    const ing = l.ingredients as { id?: string; nombre?: string; categoria?: string; precio_ref?: number; unidad?: string } | undefined;
    let inv = invList.find(
      (item) => item.ingredient_id === l.ingredient_id || (ing?.nombre && item.nombre.toLowerCase() === ing.nombre.toLowerCase())
    );

    // Fallback: si es un lote de miel
    if (!inv && ing?.nombre && (ing.categoria === "miel" || ing.nombre.toLowerCase().includes("miel"))) {
      const ingLower = ing.nombre.toLowerCase();
      const matchedLote = (lotesMiel as Array<{ id: string; nombre_lote?: string; variedad_floral?: string; kg_total?: number }> ?? []).find(
        (lm) => (lm.nombre_lote && ingLower.includes(lm.nombre_lote.toLowerCase())) ||
               (lm.variedad_floral && ingLower.includes(lm.variedad_floral.toLowerCase()))
      ) || lotesMiel?.[0];

      if (matchedLote) {
        inv = {
          id: `lote_${matchedLote.id}`,
          nombre: matchedLote.nombre_lote ? `Miel ${matchedLote.nombre_lote}` : `Miel ${matchedLote.variedad_floral || 'Nativa'}`,
          clase: "miel",
          unidad: "kg",
          stock: Number(matchedLote.kg_total ?? 0),
          stock_minimo: 10,
          costo_unitario: Number(ing.precio_ref ?? 5000),
          proveedor_nota: "Predio Pureo · Recolección Apícola",
        };
      }
    }

    // Fallback: si es infusión seca
    if (!inv && ing?.nombre && (ing.categoria === "infusion" || ing.nombre.toLowerCase().includes("hierba"))) {
      const ingLower = ing.nombre.toLowerCase();
      const matchedSeco = (stockSecoInfusiones as Array<{ materia_prima_id?: string; materia_prima?: string; stock_disponible_kg?: number }> ?? []).find(
        (s) => s.materia_prima && ingLower.includes(s.materia_prima.toLowerCase())
      );

      if (matchedSeco) {
        inv = {
          id: `infusion_${matchedSeco.materia_prima_id}`,
          nombre: `${matchedSeco.materia_prima} (Hierba Seca)`,
          clase: "infusion",
          unidad: "kg",
          stock: Number(matchedSeco.stock_disponible_kg ?? 0),
          stock_minimo: 2,
          costo_unitario: Number(ing.precio_ref ?? 12000),
          proveedor_nota: "Bosque Nativo · Recolección Silvestre",
        };
      }
    }

    return {
      ...l,
      inventario_item: inv ?? null,
    };
  });

  // Cálculo en vivo
  const { data: costoCalculado } = await supabase.rpc("calcular_costo_receta", {
    p_recipe_id: id,
  });

  return c.json({
    data: {
      ...recipe,
      lines,
      costo_calculado: costoCalculado ?? null,
    },
  });
});

costeoRoutes.put("/recetas/:id", zValidator("json", RecipeFullUpdateSchema), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { lines, ...recipeFields } = input;

  if (Object.keys(recipeFields).length > 0) {
    const { error: updErr } = await supabase
      .from("recipes")
      .update({ ...recipeFields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) return c.json({ code: "update_failed", message: updErr.message }, 400);
  }

  if (lines && Array.isArray(lines)) {
    // Sincronización atómica de líneas
    // Eliminar líneas no presentes
    const existingIds = lines.filter((l) => Boolean(l.id)).map((l) => l.id as string);
    if (existingIds.length > 0) {
      await fromLoose(supabase, "recipe_lines")
        .delete()
        .eq("recipe_id", id)
        .not("id", "in", `(${existingIds.join(",")})`);
    } else {
      await fromLoose(supabase, "recipe_lines").delete().eq("recipe_id", id);
    }

    // Actualizar existentes o insertar nuevas
    for (const l of lines) {
      if (l.id) {
        await fromLoose(supabase, "recipe_lines")
          .update({
            ingredient_id: l.ingredient_id,
            cantidad: l.cantidad,
            unidad: l.unidad ?? null,
            estado: l.estado,
            factor_conversion: l.factor_conversion,
            orden: l.orden,
          })
          .eq("id", l.id);
      } else {
        await fromLoose(supabase, "recipe_lines").insert({
          recipe_id: id,
          ingredient_id: l.ingredient_id,
          cantidad: l.cantidad,
          unidad: l.unidad ?? null,
          estado: l.estado,
          factor_conversion: l.factor_conversion,
          orden: l.orden,
        });
      }
    }
  }

  // Retornar receta actualizada
  const { data: updatedRecipe } = await supabase
    .from("recipes")
    .select("*, productos(id, nombre, precio, formato, stock)")
    .eq("id", id)
    .single();

  return c.json({ data: updatedRecipe });
});

costeoRoutes.patch("/recetas/:id", zValidator("json", RecipeSchema.partial()), async (c) => {
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("recipes")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, productos(id, nombre, precio, formato, stock)")
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

// ── REGISTRAR PRODUCCIÓN DE LOTE (Deducción bidireccional de inventario) ──

costeoRoutes.post("/recetas/:id/producir", zValidator("json", ProduccionLoteSchema), async (c) => {
  const recipeId = c.req.param("id");
  const { cantidad_lotes, deducir_inventario, notas } = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  // 1. Obtener receta y producto
  const { data: recipe, error: rErr } = await supabase
    .from("recipes")
    .select("*, productos(id, nombre, stock, lote_id)")
    .eq("id", recipeId)
    .single();

  if (rErr || !recipe) return c.json({ code: "not_found", message: "Receta no encontrada" }, 404);

  const producto = recipe.productos as unknown as { id: string; nombre: string; stock: number | null; lote_id?: string | null } | null;
  if (!producto) return c.json({ code: "no_product", message: "La receta no tiene producto vinculado" }, 400);

  const frascosAProducir = recipe.rendimiento_frascos * cantidad_lotes;

  // 2. Si se solicita deducir de inventario, procesar líneas BOM
  const movimientosRealizados: Array<{ item_id: string; cantidad: number; nombre: string }> = [];

  if (deducir_inventario) {
    const { data: rawLines } = await fromLoose(supabase, "recipe_lines")
      .select("*, ingredients(id, nombre, unidad)")
      .eq("recipe_id", recipeId);

    const lines = (rawLines as Array<{
      cantidad: number;
      unidad?: string | null;
      factor_conversion: number;
      ingredient_id: string;
      ingredients?: { id: string; nombre: string; unidad: string } | null;
    }>) ?? [];

    const { data: invItems } = await fromLoose(supabase, "inventario_items")
      .select("id, nombre, stock, unidad, ingredient_id, clase, producto_id")
      .eq("activo", true);

    const invList = (invItems as Array<{
      id: string;
      nombre: string;
      stock: number;
      unidad: string;
      ingredient_id?: string | null;
      clase?: string | null;
      producto_id?: string | null;
    }>) ?? [];

    for (const line of lines) {
      const ing = line.ingredients;
      const invItem = invList.find(
        (it) => it.ingredient_id === line.ingredient_id || (ing?.nombre && it.nombre.toLowerCase() === ing.nombre.toLowerCase())
      );

      if (invItem) {
        const lineUnit = line.unidad || ing?.unidad || invItem.unidad;
        const invUnit = invItem.unidad;
        let ratio = 1.0;
        if (invUnit === "kg" && lineUnit === "g") ratio = 0.001;
        else if (invUnit === "g" && lineUnit === "kg") ratio = 1000.0;
        else if (invUnit === "l" && lineUnit === "ml") ratio = 0.001;
        else if (invUnit === "ml" && lineUnit === "l") ratio = 1000.0;

        const factor = line.factor_conversion > 0 ? line.factor_conversion : 1.0;
        const cantidadTotalRequerida = Number(
          ((line.cantidad * ratio / factor) * cantidad_lotes).toFixed(3)
        );

        if (cantidadTotalRequerida > 0) {
          // Descontar inventario vía rpc o actualización directa
          try {
            await supabase.rpc("inventario_aplicar_movimiento", {
              p_item_id: invItem.id,
              p_tipo: "salida",
              p_cantidad: cantidadTotalRequerida,
              p_motivo: `Producción lote fórmula: ${producto.nombre} (${cantidad_lotes} lote(s))`,
              p_ref_tipo: "receta",
              p_ref_id: recipeId,
            });
          } catch {
            // Fallback si la RPC falla
            const stockNuevo = Math.max(0, Number(invItem.stock) - cantidadTotalRequerida);
            await fromLoose(supabase, "inventario_items")
              .update({ stock: stockNuevo })
              .eq("id", invItem.id);

            await fromLoose(supabase, "inventario_movimientos").insert({
              item_id: invItem.id,
              user_id: user?.id ?? null,
              tipo: "salida",
              cantidad: cantidadTotalRequerida,
              stock_antes: invItem.stock,
              stock_despues: stockNuevo,
              motivo: `Producción lote fórmula: ${producto.nombre}`,
              ref_tipo: "receta",
              ref_id: recipeId,
            });
          }

          movimientosRealizados.push({
            item_id: invItem.id,
            cantidad: cantidadTotalRequerida,
            nombre: invItem.nombre,
          });
        }
      } else if (ing?.nombre) {
        // Deducir de lotes de miel si la línea corresponde a recolección apícola
        const ingNameLower = ing.nombre.toLowerCase();
        if (ingNameLower.includes("miel") || ingNameLower.includes("lote")) {
          const { data: lotes } = await fromLoose(supabase, "lotes")
            .select("id, nombre_lote, variedad_floral, kg_total")
            .gt("kg_total", 0);

          const matchedLote = (lotes as Array<{ id: string; nombre_lote?: string; variedad_floral?: string; kg_total?: number }> ?? []).find(
            (l) => (l.nombre_lote && ingNameLower.includes(l.nombre_lote.toLowerCase())) ||
                   (l.variedad_floral && ingNameLower.includes(l.variedad_floral.toLowerCase()))
          ) || lotes?.[0];

          if (matchedLote) {
            const lineUnit = line.unidad || ing.unidad || "g";
            let ratio = 1.0;
            if (lineUnit === "g") ratio = 0.001; // g a kg
            const factor = line.factor_conversion > 0 ? line.factor_conversion : 1.0;
            const kgRequeridos = Number(((line.cantidad * ratio / factor) * cantidad_lotes).toFixed(3));

            if (kgRequeridos > 0) {
              const nuevoKg = Math.max(0, Number(matchedLote.kg_total ?? 0) - kgRequeridos);
              await fromLoose(supabase, "lotes")
                .update({ kg_total: nuevoKg })
                .eq("id", matchedLote.id);

              if (!producto.lote_id) {
                await supabase
                  .from("productos")
                  .update({ lote_id: matchedLote.id })
                  .eq("id", producto.id);
              }

              movimientosRealizados.push({
                item_id: matchedLote.id,
                cantidad: kgRequeridos,
                nombre: `${ing.nombre} (${kgRequeridos} kg del Lote ${matchedLote.nombre_lote || 'Pureo'})`,
              });
            }
          }
        }
      }
    }

    // Deducir empaque (frascos, tapas, etiquetas) si están en inventario_items
    const formatoClean = (recipe.formato_frasco || "").trim().toLowerCase();
    const empaqueItems = invList.filter(
      (it) =>
        (it.clase === "envase" || it.clase === "etiqueta") &&
        (it.producto_id === producto.id ||
          (formatoClean && it.nombre.toLowerCase().includes(formatoClean)))
    );

    for (const empItem of empaqueItems) {
      if (Number(empItem.stock) >= frascosAProducir) {
        try {
          await supabase.rpc("inventario_aplicar_movimiento", {
            p_item_id: empItem.id,
            p_tipo: "salida",
            p_cantidad: frascosAProducir,
            p_motivo: `Envasado lote fórmula: ${producto.nombre} (${frascosAProducir} un.)`,
            p_ref_tipo: "receta",
            p_ref_id: recipeId,
          });
          movimientosRealizados.push({
            item_id: empItem.id,
            cantidad: frascosAProducir,
            nombre: empItem.nombre,
          });
        } catch {
          /* ignore */
        }
      }
    }
  }

  // 3. Incrementar stock del producto terminado en catálogo
  const stockPrevio = Number(producto.stock ?? 0);
  const stockNuevo = stockPrevio + frascosAProducir;

  await supabase
    .from("productos")
    .update({ stock: stockNuevo, updated_at: new Date().toISOString() })
    .eq("id", producto.id);

  return c.json({
    data: {
      success: true,
      receta_id: recipeId,
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      frascos_producidos: frascosAProducir,
      stock_previo: stockPrevio,
      stock_nuevo: stockNuevo,
      insumos_deducidos: movimientosRealizados,
      notas: notas ?? null,
    },
  });
});

// ── SINCRONIZAR COSTOS DESDE INVENTARIO ──

costeoRoutes.post("/sync-inventario", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const syncedCount = empresaId ? await syncInventarioToIngredients(supabase, empresaId) : 0;

  return c.json({ data: { synced: syncedCount } });
});

// ── LÍNEAS DE RECETA (CRUD granular) ──

costeoRoutes.get("/recetas/:id/lineas", async (c) => {
  const recipeId = c.req.param("id");
  const supabase = c.get("supabase");

  const { data, error } = await fromLoose(supabase, "recipe_lines")
    .select("*, ingredients(id, nombre, unidad, precio_ref, categoria, proveedor_ref, terceros:proveedor_ref(id, nombre, rut))")
    .eq("recipe_id", recipeId)
    .order("orden");

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

costeoRoutes.post("/recetas/:id/lineas", zValidator("json", RecipeLinesBulkSchema), async (c) => {
  const recipeId = c.req.param("id");
  const { lines } = c.req.valid("json");
  const supabase = c.get("supabase");

  const rows = lines.map((l) => ({
    recipe_id: recipeId,
    ingredient_id: l.ingredient_id,
    cantidad: l.cantidad,
    unidad: l.unidad ?? null,
    estado: l.estado,
    factor_conversion: l.factor_conversion,
    orden: l.orden,
  }));

  const { data, error } = await fromLoose(supabase, "recipe_lines")
    .insert(rows)
    .select("*, ingredients(id, nombre, unidad, precio_ref)");

  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

costeoRoutes.patch("/recetas/:recipeId/lineas/:lineId", zValidator("json", RecipeLineSchema.partial()), async (c) => {
  const lineId = c.req.param("lineId");
  const input = c.req.valid("json");
  const supabase = c.get("supabase");

  const payload: Record<string, unknown> = {};
  if (input.ingredient_id !== undefined) payload.ingredient_id = input.ingredient_id;
  if (input.cantidad !== undefined) payload.cantidad = input.cantidad;
  if (input.unidad !== undefined) payload.unidad = input.unidad;
  if (input.estado !== undefined) payload.estado = input.estado;
  if (input.factor_conversion !== undefined) payload.factor_conversion = input.factor_conversion;
  if (input.orden !== undefined) payload.orden = input.orden;

  const { data, error } = await fromLoose(supabase, "recipe_lines")
    .update(payload)
    .eq("id", lineId)
    .select("*, ingredients(id, nombre, unidad, precio_ref)")
    .single();

  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

costeoRoutes.delete("/recetas/:recipeId/lineas/:lineId", async (c) => {
  const lineId = c.req.param("lineId");
  const supabase = c.get("supabase");

  const { error } = await fromLoose(supabase, "recipe_lines").delete().eq("id", lineId);
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
  const empresaId = c.get("empresaId");

  if (empresaId) {
    await normalizeLegacyCosteoData(supabase, empresaId);
  }

  const { data, error } = await supabase
    .from("recipe_costing_view")
    .select("*");

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

// ── MARGEN REALIZADO POR TEMPORADA AUSTRAL (12 meses) ──

costeoRoutes.get("/temporada", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await rpcLoose(supabase, "admin_costeo_temporada");

  if (error) return c.json({ code: "query_failed", message: (error as { message?: string }).message ?? "RPC falló" }, 500);
  return c.json({ data: (data as Record<string, unknown>) ?? {} });
});
