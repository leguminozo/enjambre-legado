import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import {
  materiaPrimaFormSchema,
  proveedorFormSchema,
  loteEntradaFormSchema,
  loteDeshidratadoFormSchema,
  formulaFormSchema,
  ingredienteFormSchema,
  loteProduccionFormSchema,
  materialFormSchema,
} from "@/lib/infusiones-types";

/**
 * Módulo Infusiones — trazabilidad de producción de hierbas.
 *
 * Flujo: entrada (recolección/compra) → deshidratado → stock seco → fórmula → lote de producción.
 * RLS delega: cualquier usuario autenticado crea/edita sus filas; admin ve todo.
 * Los valores NUMERIC llegan como string desde PostgREST: convertir con Number() al calcular.
 */
export const infusionesRoutes = new Hono<{ Variables: AppVariables }>();

infusionesRoutes.use("*", authMiddleware, tenantMiddleware);

const toNum = (v: unknown): number => Number(v ?? 0);

/** Genera el código legible del lote: MENTA-2026-001 (slug + año + secuencia). */
async function generarCodigoLote(
  supabase: AppVariables["supabase"],
  materiaPrimaId: string,
  fecha: string,
): Promise<string> {
  const { data: mp } = await supabase
    .from("infusion_materias_primas")
    .select("nombre")
    .eq("id", materiaPrimaId)
    .single();
  const slug = (mp?.nombre ?? "LOTE")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  const anio = new Date(fecha).getFullYear();
  const { count } = await supabase
    .from("infusion_lotes_entrada")
    .select("id", { count: "exact", head: true })
    .eq("materia_prima_id", materiaPrimaId)
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);
  return `${slug}-${anio}-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

/* ── Dashboard ─────────────────────────────────────────────────────────────── */

/** GET /api/infusiones/responsables — nombres ya usados para sugerir al delegar */
infusionesRoutes.get("/responsables", async (c) => {
  const supabase = c.get("supabase");
  const [recolectores, desh, prod] = await Promise.all([
    supabase.from("infusion_lotes_entrada").select("recolector").not("recolector", "is", null),
    supabase.from("infusion_lotes_deshidratado").select("responsable").not("responsable", "is", null),
    supabase.from("infusion_lotes_produccion").select("responsable").not("responsable", "is", null),
  ]);
  const names = new Set<string>();
  for (const r of recolectores.data ?? []) if (r.recolector) names.add(r.recolector);
  for (const r of desh.data ?? []) if (r.responsable) names.add(r.responsable);
  for (const r of prod.data ?? []) if (r.responsable) names.add(r.responsable);
  return c.json({ data: [...names].sort((a, b) => a.localeCompare(b, "es")) });
});

/** GET /api/infusiones/dashboard */
infusionesRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");

  const [entrada, desh, prod, view, pendientesQuery, ultimas, recolectores, responsablesDesh, responsablesProd] =
    await Promise.all([
      supabase.from("infusion_lotes_entrada").select("peso_fresco_kg"),
      supabase.from("infusion_lotes_deshidratado").select("peso_salida_kg, rendimiento_pct"),
      supabase.from("infusion_lotes_produccion").select("cantidad_sachets"),
      supabase.from("v_infusion_stock_seco").select("*").order("materia_prima"),
      supabase
        .from("infusion_lotes_entrada")
        .select("id, infusion_lotes_deshidratado(id)"),
      supabase
        .from("infusion_lotes_entrada")
        .select(
          "id, codigo_lote, fecha, peso_fresco_kg, origen, infusion_materias_primas(nombre), infusion_lotes_deshidratado(id)",
        )
        .order("fecha", { ascending: false })
        .limit(5),
      supabase.from("infusion_lotes_entrada").select("recolector").not("recolector", "is", null),
      supabase
        .from("infusion_lotes_deshidratado")
        .select("responsable")
        .not("responsable", "is", null),
      supabase.from("infusion_lotes_produccion").select("responsable").not("responsable", "is", null),
    ]);

  const totalFresco = (entrada.data ?? []).reduce((a, r) => a + toNum(r.peso_fresco_kg), 0);
  const totalSeco = (desh.data ?? []).reduce((a, r) => a + toNum(r.peso_salida_kg), 0);
  const rendimientos = (desh.data ?? []).filter((r) => r.rendimiento_pct != null);
  const rendProm = rendimientos.length
    ? rendimientos.reduce((a, r) => a + toNum(r.rendimiento_pct), 0) / rendimientos.length
    : null;
  const sachets = (prod.data ?? []).reduce((a, r) => a + toNum(r.cantidad_sachets), 0);
  const pendientes = (pendientesQuery.data ?? []).filter((r) => !r.infusion_lotes_deshidratado).length;

  const responsables = new Set<string>();
  for (const r of recolectores.data ?? []) if (r.recolector) responsables.add(r.recolector);
  for (const r of responsablesDesh.data ?? []) if (r.responsable) responsables.add(r.responsable);
  for (const r of responsablesProd.data ?? []) if (r.responsable) responsables.add(r.responsable);

  return c.json({
    data: {
      kpis: {
        total_fresco_kg: Math.round(totalFresco * 1000) / 1000,
        total_seco_kg: Math.round(totalSeco * 1000) / 1000,
        rendimiento_promedio_pct: rendProm != null ? Math.round(rendProm * 100) / 100 : null,
        sachets_producidos: sachets,
        lotes_pendientes_deshidratar: pendientes,
      },
      stock_seco: view.data ?? [],
      ultimas_entradas: (ultimas.data ?? []).map((r) => ({
        id: r.id,
        codigo_lote: r.codigo_lote,
        materia_prima: r.infusion_materias_primas?.nombre ?? "—",
        fecha: r.fecha,
        peso_fresco_kg: r.peso_fresco_kg,
        origen: r.origen,
        deshidratado: Boolean(r.infusion_lotes_deshidratado),
      })),
      responsables: [...responsables].sort((a, b) => a.localeCompare(b, "es")),
    },
  });
});

/* ── Materias primas ───────────────────────────────────────────────────────── */

/** GET /api/infusiones/materias-primas */
infusionesRoutes.get("/materias-primas", async (c) => {
  const supabase = c.get("supabase");
  const incluirInactivas = c.req.query("incluir_inactivas") === "1";
  let q = supabase.from("infusion_materias_primas").select("*").order("nombre");
  if (!incluirInactivas) q = q.eq("activa", true);
  const { data, error } = await q;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/infusiones/materias-primas */
infusionesRoutes.post(
  "/materias-primas",
  zValidator("json", materiaPrimaFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { data, error } = await supabase
      .from("infusion_materias_primas")
      .insert({ ...input, notas: input.notas ?? null, user_id: user.id })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/infusiones/materias-primas/:id */
infusionesRoutes.patch(
  "/materias-primas/:id",
  zValidator("json", materiaPrimaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_materias_primas")
      .update({ ...input, notas: input.notas === undefined ? undefined : input.notas ?? null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/materias-primas/:id — soft delete */
infusionesRoutes.delete("/materias-primas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase
    .from("infusion_materias_primas")
    .update({ activa: false })
    .eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Proveedores ───────────────────────────────────────────────────────────── */

/** GET /api/infusiones/proveedores */
infusionesRoutes.get("/proveedores", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("infusion_proveedores")
    .select("*")
    .eq("activa", true)
    .order("nombre");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/infusiones/proveedores */
infusionesRoutes.post("/proveedores", zValidator("json", proveedorFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { data, error } = await supabase
    .from("infusion_proveedores")
    .insert({
      ...input,
      contacto: input.contacto ?? null,
      ubicacion: input.ubicacion ?? null,
      notas: input.notas ?? null,
      user_id: user.id,
    })
    .select("*")
    .single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/infusiones/proveedores/:id */
infusionesRoutes.patch(
  "/proveedores/:id",
  zValidator("json", proveedorFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_proveedores")
      .update({
        ...input,
        contacto: input.contacto === undefined ? undefined : input.contacto ?? null,
        ubicacion: input.ubicacion === undefined ? undefined : input.ubicacion ?? null,
        notas: input.notas === undefined ? undefined : input.notas ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/proveedores/:id — soft delete */
infusionesRoutes.delete("/proveedores/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase
    .from("infusion_proveedores")
    .update({ activa: false })
    .eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Lotes de entrada ──────────────────────────────────────────────────────── */

/** GET /api/infusiones/lotes-entrada */
infusionesRoutes.get("/lotes-entrada", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("infusion_lotes_entrada")
    .select(
      "*, infusion_materias_primas(id, nombre), infusion_proveedores(id, nombre), infusion_lotes_deshidratado(id)",
    )
    .order("fecha", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? []).map((r) => ({
    ...r,
    deshidratado: r.infusion_lotes_deshidratado ? { id: r.infusion_lotes_deshidratado.id } : null,
  }));
  return c.json({ data: rows });
});

/** POST /api/infusiones/lotes-entrada */
infusionesRoutes.post("/lotes-entrada", zValidator("json", loteEntradaFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const codigo_lote = await generarCodigoLote(supabase, input.materia_prima_id, input.fecha);
  const { data, error } = await supabase
    .from("infusion_lotes_entrada")
    .insert({
      ...input,
      codigo_lote,
      peso_fresco_kg: input.peso_fresco_kg ?? null,
      precio_compra_clp: input.precio_compra_clp ?? null,
      proveedor_id: input.proveedor_id ?? null,
      recolector: input.recolector ?? null,
      ubicacion_recoleccion: input.ubicacion_recoleccion ?? null,
      notas: input.notas ?? null,
      user_id: user.id,
    })
    .select("*")
    .single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/infusiones/lotes-entrada/:id */
infusionesRoutes.patch(
  "/lotes-entrada/:id",
  zValidator("json", loteEntradaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_lotes_entrada")
      .update({
        ...input,
        peso_fresco_kg: input.peso_fresco_kg === undefined ? undefined : input.peso_fresco_kg ?? null,
        precio_compra_clp:
          input.precio_compra_clp === undefined ? undefined : input.precio_compra_clp ?? null,
        proveedor_id: input.proveedor_id === undefined ? undefined : input.proveedor_id ?? null,
        recolector: input.recolector === undefined ? undefined : input.recolector ?? null,
        ubicacion_recoleccion:
          input.ubicacion_recoleccion === undefined ? undefined : input.ubicacion_recoleccion ?? null,
        notas: input.notas === undefined ? undefined : input.notas ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/lotes-entrada/:id — bloqueado si ya fue deshidratado */
infusionesRoutes.delete("/lotes-entrada/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data: desh } = await supabase
    .from("infusion_lotes_deshidratado")
    .select("id")
    .eq("lote_entrada_id", id)
    .maybeSingle();
  if (desh) {
    return c.json(
      { code: "lote_ya_deshidratado", message: "Este lote ya fue deshidratado: no se puede eliminar." },
      409,
    );
  }
  const { error } = await supabase.from("infusion_lotes_entrada").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Lotes deshidratados ───────────────────────────────────────────────────── */

/** GET /api/infusiones/lotes-deshidratado */
infusionesRoutes.get("/lotes-deshidratado", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("infusion_lotes_deshidratado")
    .select(
      "*, infusion_lotes_entrada(id, codigo_lote, materia_prima_id, infusion_materias_primas(nombre))",
    )
    .order("created_at", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  // Consumo por lote seco → stock disponible (gramos)
  const consumos = new Map<string, number>();
  const { data: mats } = await supabase
    .from("infusion_produccion_materiales")
    .select("lote_deshidratado_id, gramos_utilizados");
  for (const m of mats ?? []) {
    consumos.set(m.lote_deshidratado_id, (consumos.get(m.lote_deshidratado_id) ?? 0) + toNum(m.gramos_utilizados));
  }

  const rows = (data ?? []).map((r) => ({
    ...r,
    stock_disponible_g:
      r.peso_salida_kg != null
        ? Math.round((toNum(r.peso_salida_kg) * 1000 - (consumos.get(r.id) ?? 0)) * 100) / 100
        : null,
  }));
  return c.json({ data: rows });
});

/** POST /api/infusiones/lotes-deshidratado */
infusionesRoutes.post(
  "/lotes-deshidratado",
  zValidator("json", loteDeshidratadoFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");

    const { data: le } = await supabase
      .from("infusion_lotes_entrada")
      .select("id")
      .eq("id", input.lote_entrada_id)
      .maybeSingle();
    if (!le) return c.json({ code: "not_found", message: "Lote de entrada no encontrado" }, 404);

    const { data: ya } = await supabase
      .from("infusion_lotes_deshidratado")
      .select("id")
      .eq("lote_entrada_id", input.lote_entrada_id)
      .maybeSingle();
    if (ya) {
      return c.json(
        { code: "lote_ya_deshidratado", message: "Este lote de entrada ya tiene deshidratado registrado." },
        409,
      );
    }

    const { data, error } = await supabase
      .from("infusion_lotes_deshidratado")
      .insert({
        ...input,
        fecha_inicio: input.fecha_inicio || null,
        fecha_fin: input.fecha_fin || null,
        temperatura_c: input.temperatura_c ?? null,
        peso_entrada_kg: input.peso_entrada_kg ?? null,
        peso_salida_kg: input.peso_salida_kg ?? null,
        responsable: input.responsable ?? null,
        notas: input.notas ?? null,
        user_id: user.id,
      })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/infusiones/lotes-deshidratado/:id */
infusionesRoutes.patch(
  "/lotes-deshidratado/:id",
  zValidator("json", loteDeshidratadoFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_lotes_deshidratado")
      .update({
        ...input,
        fecha_inicio: input.fecha_inicio === undefined ? undefined : input.fecha_inicio || null,
        fecha_fin: input.fecha_fin === undefined ? undefined : input.fecha_fin || null,
        temperatura_c: input.temperatura_c === undefined ? undefined : input.temperatura_c ?? null,
        peso_entrada_kg: input.peso_entrada_kg === undefined ? undefined : input.peso_entrada_kg ?? null,
        peso_salida_kg: input.peso_salida_kg === undefined ? undefined : input.peso_salida_kg ?? null,
        responsable: input.responsable === undefined ? undefined : input.responsable ?? null,
        notas: input.notas === undefined ? undefined : input.notas ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/lotes-deshidratado/:id — bloqueado si fue consumido */
infusionesRoutes.delete("/lotes-deshidratado/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data: usado } = await supabase
    .from("infusion_produccion_materiales")
    .select("id")
    .eq("lote_deshidratado_id", id)
    .maybeSingle();
  if (usado) {
    return c.json(
      { code: "material_consumido", message: "Este lote seco ya fue consumido en producción: no se puede eliminar." },
      409,
    );
  }
  const { error } = await supabase.from("infusion_lotes_deshidratado").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Fórmulas ──────────────────────────────────────────────────────────────── */

/** GET /api/infusiones/formulas */
infusionesRoutes.get("/formulas", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("infusion_formulas")
    .select(
      "*, infusion_formula_ingredientes(*, infusion_materias_primas(id, nombre))",
    )
    .order("nombre");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? []).map((r) => ({
    ...r,
    ingredientes: r.infusion_formula_ingredientes ?? [],
  }));
  return c.json({ data: rows });
});

/** POST /api/infusiones/formulas */
infusionesRoutes.post("/formulas", zValidator("json", formulaFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { data, error } = await supabase
    .from("infusion_formulas")
    .insert({ ...input, descripcion: input.descripcion ?? null, user_id: user.id })
    .select("*")
    .single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/infusiones/formulas/:id */
infusionesRoutes.patch(
  "/formulas/:id",
  zValidator("json", formulaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_formulas")
      .update({ ...input, descripcion: input.descripcion === undefined ? undefined : input.descripcion ?? null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/formulas/:id — soft delete */
infusionesRoutes.delete("/formulas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("infusion_formulas").update({ activa: false }).eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/infusiones/formulas/:id/ingredientes */
infusionesRoutes.post(
  "/formulas/:id/ingredientes",
  zValidator("json", ingredienteFormSchema),
  async (c) => {
    const formulaId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data: f } = await supabase
      .from("infusion_formulas")
      .select("id")
      .eq("id", formulaId)
      .maybeSingle();
    if (!f) return c.json({ code: "not_found", message: "Fórmula no encontrada" }, 404);

    const { data: existentes } = await supabase
      .from("infusion_formula_ingredientes")
      .select("porcentaje")
      .eq("formula_id", formulaId);
    const suma = (existentes ?? []).reduce((a, r) => a + toNum(r.porcentaje), 0);
    if (suma + toNum(input.porcentaje) > 100) {
      return c.json(
        {
          code: "porcentaje_excede_100",
          message: `La suma de porcentajes superaría 100 (actual ${suma}% + ${input.porcentaje}%).`,
        },
        400,
      );
    }

    const { data, error } = await supabase
      .from("infusion_formula_ingredientes")
      .insert({ formula_id: formulaId, ...input })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/infusiones/formulas/:id/ingredientes/:ingId */
infusionesRoutes.patch(
  "/formulas/:id/ingredientes/:ingId",
  zValidator("json", ingredienteFormSchema.partial()),
  async (c) => {
    const ingId = c.req.param("ingId");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    if (input.porcentaje !== undefined) {
      const { data: actual } = await supabase
        .from("infusion_formula_ingredientes")
        .select("formula_id, porcentaje")
        .eq("id", ingId)
        .maybeSingle();
      if (!actual) return c.json({ code: "not_found", message: "Ingrediente no encontrado" }, 404);
      const { data: existentes } = await supabase
        .from("infusion_formula_ingredientes")
        .select("porcentaje")
        .eq("formula_id", actual.formula_id);
      const suma = (existentes ?? []).reduce((a, r) => a + toNum(r.porcentaje), 0);
      if (suma - toNum(actual.porcentaje) + toNum(input.porcentaje) > 100) {
        return c.json(
          { code: "porcentaje_excede_100", message: "La suma de porcentajes superaría 100." },
          400,
        );
      }
    }

    const { data, error } = await supabase
      .from("infusion_formula_ingredientes")
      .update(input)
      .eq("id", ingId)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/formulas/:id/ingredientes/:ingId */
infusionesRoutes.delete("/formulas/:id/ingredientes/:ingId", async (c) => {
  const ingId = c.req.param("ingId");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("infusion_formula_ingredientes").delete().eq("id", ingId);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Lotes de producción ───────────────────────────────────────────────────── */

/** GET /api/infusiones/lotes-produccion */
infusionesRoutes.get("/lotes-produccion", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("infusion_lotes_produccion")
    .select(
      "*, infusion_formulas(id, nombre, gramaje_sachet_g, tipo), infusion_produccion_materiales(*, infusion_lotes_deshidratado(lote_entrada_id, infusion_lotes_entrada(codigo_lote, materia_prima_id, infusion_materias_primas(nombre))))",
    )
    .order("fecha", { ascending: false });
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? []).map((r) => ({
    ...r,
    materiales: r.infusion_produccion_materiales ?? [],
  }));
  return c.json({ data: rows });
});

/** POST /api/infusiones/lotes-produccion */
infusionesRoutes.post(
  "/lotes-produccion",
  zValidator("json", loteProduccionFormSchema),
  async (c) => {
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const { data, error } = await supabase
      .from("infusion_lotes_produccion")
      .insert({
        ...input,
        peso_mezcla_kg: input.peso_mezcla_kg ?? null,
        cantidad_sachets: input.cantidad_sachets ?? null,
        responsable: input.responsable ?? null,
        notas: input.notas ?? null,
        user_id: user.id,
      })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** PATCH /api/infusiones/lotes-produccion/:id */
infusionesRoutes.patch(
  "/lotes-produccion/:id",
  zValidator("json", loteProduccionFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_lotes_produccion")
      .update({
        ...input,
        peso_mezcla_kg: input.peso_mezcla_kg === undefined ? undefined : input.peso_mezcla_kg ?? null,
        cantidad_sachets:
          input.cantidad_sachets === undefined ? undefined : input.cantidad_sachets ?? null,
        responsable: input.responsable === undefined ? undefined : input.responsable ?? null,
        notas: input.notas === undefined ? undefined : input.notas ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/lotes-produccion/:id */
infusionesRoutes.delete("/lotes-produccion/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("infusion_lotes_produccion").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/** POST /api/infusiones/lotes-produccion/:id/materiales — valida stock del lote seco */
infusionesRoutes.post(
  "/lotes-produccion/:id/materiales",
  zValidator("json", materialFormSchema),
  async (c) => {
    const prodId = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data: prod } = await supabase
      .from("infusion_lotes_produccion")
      .select("id")
      .eq("id", prodId)
      .maybeSingle();
    if (!prod) return c.json({ code: "not_found", message: "Lote de producción no encontrado" }, 404);

    const { data: ld } = await supabase
      .from("infusion_lotes_deshidratado")
      .select("peso_salida_kg")
      .eq("id", input.lote_deshidratado_id)
      .maybeSingle();
    if (!ld) return c.json({ code: "not_found", message: "Lote deshidratado no encontrado" }, 404);
    if (ld.peso_salida_kg == null) {
      return c.json(
        { code: "lote_sin_peso_salida", message: "El lote seco no tiene peso de salida registrado." },
        400,
      );
    }

    const { data: consumos } = await supabase
      .from("infusion_produccion_materiales")
      .select("gramos_utilizados")
      .eq("lote_deshidratado_id", input.lote_deshidratado_id);
    const usado = (consumos ?? []).reduce((a, r) => a + toNum(r.gramos_utilizados), 0);
    const disponible = Math.round(toNum(ld.peso_salida_kg) * 1000 - usado * 100) / 100;
    if (toNum(input.gramos_utilizados) > disponible) {
      return c.json(
        {
          code: "stock_insuficiente",
          message: `Stock insuficiente del lote seco: quedan ${disponible.toLocaleString("es-CL")} g disponibles.`,
        },
        409,
      );
    }

    const { data, error } = await supabase
      .from("infusion_produccion_materiales")
      .insert({ lote_produccion_id: prodId, ...input })
      .select("*")
      .single();
    if (error) return c.json({ code: "create_failed", message: error.message }, 400);
    return c.json({ data }, 201);
  },
);

/** DELETE /api/infusiones/lotes-produccion/:id/materiales/:matId */
infusionesRoutes.delete("/lotes-produccion/:id/materiales/:matId", async (c) => {
  const matId = c.req.param("matId");
  const supabase = c.get("supabase");
  const { error } = await supabase
    .from("infusion_produccion_materiales")
    .delete()
    .eq("id", matId);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});
