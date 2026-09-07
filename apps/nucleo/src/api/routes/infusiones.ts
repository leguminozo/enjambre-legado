import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { rpcLoose } from "@/api/lib/supabase-loose";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { Json } from "@enjambre/database/database.types";
import {
  materiaPrimaFormSchema,
  proveedorFormSchema,
  loteEntradaFormSchema,
  loteDeshidratadoFormSchema,
  formulaFormSchema,
  ingredienteFormSchema,
  loteProduccionFormSchema,
  materialFormSchema,
  equipoFormSchema,
  tareaFormSchema,
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
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  // Antes del borrado en cascada: qué materias primas consumió este lote.
  const { data: mats } = await supabase
    .from("infusion_produccion_materiales")
    .select("lote_deshidratado_id")
    .eq("lote_produccion_id", id);
  // Lecturas independientes: en paralelo (antes N consultas secuenciales)
  const mpIds = new Set<string>();
  const mpIdsResolved = await Promise.all(
    (mats ?? []).map((m) => materiaPrimaDeLoteSeco(supabase, m.lote_deshidratado_id)),
  );
  for (const mpId of mpIdsResolved) {
    if (mpId) mpIds.add(mpId);
  }

  const { error } = await supabase.from("infusion_lotes_produccion").delete().eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);

  // Cada materia prima ajusta su propio ítem de inventario: en paralelo
  await Promise.all(
    [...mpIds].map((mpId) =>
      sincronizarInventarioItem(
        supabase, user, empresaId, mpId, id,
        "Eliminación de lote de producción Infusiones",
      ),
    ),
  );
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

    // Espejo en inventario: ajusta el ítem de la materia prima al stock autoritativo.
    const mpId = await materiaPrimaDeLoteSeco(supabase, input.lote_deshidratado_id);
    if (mpId) {
      await sincronizarInventarioItem(
        supabase, c.get("user"), c.get("empresaId"), mpId, prodId,
        "Consumo Infusiones — producción",
      );
    }
    return c.json({ data }, 201);
  },
);

/** DELETE /api/infusiones/lotes-produccion/:id/materiales/:matId */
infusionesRoutes.delete("/lotes-produccion/:id/materiales/:matId", async (c) => {
  const matId = c.req.param("matId");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data: material } = await supabase
    .from("infusion_produccion_materiales")
    .select("lote_produccion_id, lote_deshidratado_id")
    .eq("id", matId)
    .maybeSingle();

  const { error } = await supabase
    .from("infusion_produccion_materiales")
    .delete()
    .eq("id", matId);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);

  if (material) {
    const mpId = await materiaPrimaDeLoteSeco(supabase, material.lote_deshidratado_id);
    if (mpId) {
      await sincronizarInventarioItem(
        supabase, user, empresaId, mpId, material.lote_produccion_id,
        "Reversión consumo Infusiones",
      );
    }
  }
  return c.json({ data: { deleted: true } });
});

/** GET /api/infusiones/costos — costo seco/kg por materia prima y costo por sachet por fórmula */
infusionesRoutes.get("/costos", async (c) => {
  const supabase = c.get("supabase");
  const [viewRes, formulasRes] = await Promise.all([
    supabase.from("v_infusion_costos").select("*"),
    supabase
      .from("infusion_formulas")
      .select("id, nombre, gramaje_sachet_g, tipo, infusion_formula_ingredientes(materia_prima_id, porcentaje)")
      .eq("activa", true),
  ]);
  if (viewRes.error) return c.json({ code: "query_failed", message: viewRes.error.message }, 500);
  if (formulasRes.error) return c.json({ code: "query_failed", message: formulasRes.error.message }, 500);

  const costoPorMp = new Map<string, number | null>();
  for (const m of viewRes.data ?? []) {
    if (!m.materia_prima_id) continue;
    costoPorMp.set(m.materia_prima_id, m.costo_seco_kg_clp != null ? Number(m.costo_seco_kg_clp) : null);
  }

  const porFormula = (formulasRes.data ?? []).map((f) => {
    const ingrs = f.infusion_formula_ingredientes ?? [];
    let costoKg = 0;
    let sinPrecios = ingrs.length === 0;
    for (const i of ingrs) {
      const costo = costoPorMp.get(i.materia_prima_id);
      if (costo == null) {
        sinPrecios = true;
        continue;
      }
      costoKg += (Number(i.porcentaje) / 100) * costo;
    }
    return {
      id: f.id,
      nombre: f.nombre,
      gramaje_sachet_g: f.gramaje_sachet_g,
      tipo: f.tipo,
      costo_kg_mezcla_clp: sinPrecios ? null : Math.round(costoKg),
      costo_sachet_clp: sinPrecios
        ? null
        : Math.round((costoKg * Number(f.gramaje_sachet_g)) / 1000),
      sin_precios: sinPrecios,
    };
  });

  return c.json({ data: { por_materia: viewRes.data ?? [], por_formula: porFormula } });
});

/** GET /api/infusiones/planificacion?formula_id=&sachets= — cuánto recolectar según rendimiento histórico */
infusionesRoutes.get("/planificacion", async (c) => {
  const supabase = c.get("supabase");
  const formulaId = c.req.query("formula_id");
  const sachetsRaw = c.req.query("sachets");
  if (!formulaId || !sachetsRaw) {
    return c.json({ code: "invalid_params", message: "Faltan formula_id y sachets" }, 400);
  }
  const sachets = Number(sachetsRaw);
  if (!Number.isFinite(sachets) || sachets <= 0) {
    return c.json({ code: "invalid_params", message: "sachets debe ser un número positivo" }, 400);
  }

  const [fRes, stockRes, costoRes] = await Promise.all([
    supabase
      .from("infusion_formulas")
      .select(
        "id, nombre, gramaje_sachet_g, infusion_formula_ingredientes(materia_prima_id, porcentaje, infusion_materias_primas(nombre))",
      )
      .eq("id", formulaId)
      .maybeSingle(),
    supabase.from("v_infusion_stock_seco").select("*"),
    supabase.from("v_infusion_costos").select("*"),
  ]);
  if (fRes.error) return c.json({ code: "query_failed", message: fRes.error.message }, 500);
  if (!fRes.data) return c.json({ code: "not_found", message: "Fórmula no encontrada" }, 404);

  const stockPorMp = new Map(
    (stockRes.data ?? []).map((s) => [s.materia_prima_id, Number(s.stock_disponible_kg)]),
  );
  const rendPorMp = new Map(
    (costoRes.data ?? []).map((m) => [
      m.materia_prima_id,
      m.rendimiento_promedio_pct != null ? Number(m.rendimiento_promedio_pct) : null,
    ]),
  );

  const totalSeco = (Number(fRes.data.gramaje_sachet_g) / 1000) * sachets;
  const redondear = (n: number) => Math.round(n * 1000) / 1000;

  const porIngrediente = (fRes.data.infusion_formula_ingredientes ?? []).map((i) => {
    const pct = Number(i.porcentaje);
    const seco = (totalSeco * pct) / 100;
    const disponible = stockPorMp.get(i.materia_prima_id) ?? 0;
    const rend = rendPorMp.get(i.materia_prima_id) ?? null;
    return {
      materia_prima_id: i.materia_prima_id,
      materia_prima: i.infusion_materias_primas?.nombre ?? "—",
      porcentaje: pct,
      seco_necesario_kg: redondear(seco),
      disponible_kg: disponible,
      deficit_kg: redondear(Math.max(0, seco - disponible)),
      rendimiento_pct: rend,
      fresco_a_recolectar_kg: rend && rend > 0
        ? redondear(seco / (rend / 100))
        : null,
    };
  });

  const conHistorial = porIngrediente.filter((p) => p.fresco_a_recolectar_kg != null);
  const totalFresco = conHistorial.length === porIngrediente.length && porIngrediente.length > 0
    ? redondear(conHistorial.reduce((a, p) => a + (p.fresco_a_recolectar_kg ?? 0), 0))
    : null;

  return c.json({
    data: {
      formula: {
        id: fRes.data.id,
        nombre: fRes.data.nombre,
        gramaje_sachet_g: fRes.data.gramaje_sachet_g,
      },
      sachets,
      total_seco_necesario_kg: redondear(totalSeco),
      total_fresco_sugerido_kg: totalFresco,
      por_ingrediente: porIngrediente,
    },
  });
});

/* ── Equipo ─────────────────────────────────────────────────────────────────── */

/** GET /api/infusiones/equipo */
infusionesRoutes.get("/equipo", async (c) => {
  const supabase = c.get("supabase");
  const incluirInactivas = c.req.query("incluir_inactivas") === "1";
  let q = supabase.from("infusion_equipo").select("*").order("nombre");
  if (!incluirInactivas) q = q.eq("activa", true);
  const { data, error } = await q;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/infusiones/equipo */
infusionesRoutes.post("/equipo", zValidator("json", equipoFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { data, error } = await supabase
    .from("infusion_equipo")
    .insert({ ...input, notas: input.notas ?? null, user_id: user.id })
    .select("*")
    .single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/infusiones/equipo/:id */
infusionesRoutes.patch(
  "/equipo/:id",
  zValidator("json", equipoFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");
    const { data, error } = await supabase
      .from("infusion_equipo")
      .update({ ...input, notas: input.notas === undefined ? undefined : input.notas ?? null })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/equipo/:id — soft delete */
infusionesRoutes.delete("/equipo/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { error } = await supabase.from("infusion_equipo").update({ activa: false }).eq("id", id);
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Tareas ─────────────────────────────────────────────────────────────────── */

const BUCKET_EVIDENCIAS = "infusiones-evidencias";

async function materiaPrimaDeLoteSeco(
  supabase: AppVariables["supabase"],
  loteDeshidratadoId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("infusion_lotes_deshidratado")
    .select("infusion_lotes_entrada(materia_prima_id)")
    .eq("id", loteDeshidratadoId)
    .maybeSingle();
  return data?.infusion_lotes_entrada?.materia_prima_id ?? null;
}

/**
 * Espejo del stock de Infusiones en el inventario operativo (clase insumo).
 * La fuente de verdad es Infusiones (v_infusion_stock_seco): se ajusta el stock
 * del ítem al valor autoritativo vía la RPC atómica. Una falla de sync no rompe
 * la operación primaria (solo se registra en consola).
 */
async function sincronizarInventarioItem(
  supabase: AppVariables["supabase"],
  user: AppVariables["user"],
  empresaId: string,
  materiaPrimaId: string,
  refId: string,
  motivo: string,
) {
  // Lookup y creación con admin client: un usuario delegado no ve (RLS) los
  // ítems creados por el admin y duplicaría el ítem de la misma materia prima.
  // La RPC del movimiento sí usa el cliente del usuario (auth.uid() = actor).
  const adminSupabase = createAdminClient() as unknown as AppVariables["supabase"];

  const [stockRes, costoRes] = await Promise.all([
    adminSupabase
      .from("v_infusion_stock_seco")
      .select("stock_disponible_kg")
      .eq("materia_prima_id", materiaPrimaId)
      .maybeSingle(),
    adminSupabase
      .from("v_infusion_costos")
      .select("costo_seco_kg_clp")
      .eq("materia_prima_id", materiaPrimaId)
      .maybeSingle(),
  ]);
  const disponible = stockRes.data?.stock_disponible_kg != null
    ? Number(stockRes.data.stock_disponible_kg)
    : 0;

  const { data: item } = await adminSupabase
    .from("inventario_items")
    .select("id, stock")
    .eq("ingredient_id", materiaPrimaId)
    .eq("clase", "insumo")
    .maybeSingle();

  let itemId = item?.id;
  // El ítem recién creado ya nace con el stock autoritativo: no hace falta ajuste.
  let itemCreado = false;
  if (!itemId) {
    const { data: mp } = await adminSupabase
      .from("infusion_materias_primas")
      .select("nombre")
      .eq("id", materiaPrimaId)
      .maybeSingle();
    const { data: creado, error: creErr } = await adminSupabase
      .from("inventario_items")
      .insert({
        clase: "insumo",
        nombre: mp?.nombre ?? "Insumo infusiones",
        unidad: "kg",
        stock: disponible,
        stock_minimo: 0,
        costo_unitario: costoRes.data?.costo_seco_kg_clp != null
          ? Math.round(Number(costoRes.data.costo_seco_kg_clp))
          : 0,
        ingredient_id: materiaPrimaId,
        user_id: user.id,
        empresa_id: empresaId || null,
      })
      .select("id")
      .single();
    if (creErr) {
      console.warn("[infusiones] sync inventario: no se pudo crear el ítem", creErr.message);
      return;
    }
    itemId = creado.id;
    itemCreado = true;
  }

  if (itemCreado) return; // ya está sincronizado (nació con el stock correcto)

  const antes = Number(item?.stock ?? 0);
  if (Math.abs(antes - disponible) < 0.0001) return; // ya está sincronizado

  const { error: rpcErr } = await rpcLoose(supabase, "inventario_aplicar_movimiento", {
    p_item_id: itemId,
    p_tipo: "ajuste",
    p_cantidad: disponible,
    p_motivo: motivo,
    p_ref_tipo: "lote",
    p_ref_id: refId,
    p_doc_tipo: null,
    p_doc_numero: null,
    p_doc_fecha: null,
  });
  if (rpcErr) {
    console.warn("[infusiones] sync inventario: RPC", rpcErr.message);
  }
}

async function nombreEquipo(
  supabase: AppVariables["supabase"],
  equipoId: string | null,
): Promise<string | null> {
  if (!equipoId) return null;
  const { data } = await supabase
    .from("infusion_equipo")
    .select("nombre")
    .eq("id", equipoId)
    .maybeSingle();
  return data?.nombre ?? null;
}

/** Valida que el rol del equipo corresponda al paso: dosificado → solo dosificador. */
async function validarRolEquipo(
  supabase: AppVariables["supabase"],
  tipo: string,
  equipoId: string | null,
): Promise<string | null> {
  if (!equipoId) return null;
  const { data: eq } = await supabase
    .from("infusion_equipo")
    .select("rol_operacion, nombre")
    .eq("id", equipoId)
    .maybeSingle();
  if (!eq) return "El miembro del equipo no existe";
  if (tipo === "dosificado" && eq.rol_operacion !== "dosificador") {
    return `El paso "Dosificado" queda reservado al rol dosificador (${eq.nombre} es operario).`;
  }
  return null;
}

/** GET /api/infusiones/tareas?estado=&equipo_id=&tipo=
 *  Consolidado en crm_tareas (ref_tipo='infusion') — Fase C de la auditoría. */
infusionesRoutes.get("/tareas", async (c) => {
  const supabase = c.get("supabase");
  const estado = c.req.query("estado");
  const equipoId = c.req.query("equipo_id");
  const tipo = c.req.query("tipo");

  let q = supabase
    .from("crm_tareas")
    .select("*, infusion_equipo(id, nombre, rol_operacion)")
    .eq("ref_tipo", "infusion")
    .order("fecha_vencimiento", { ascending: true, nullsFirst: false });
  if (estado) q = q.eq("estado", estado);
  if (equipoId) q = q.eq("equipo_id", equipoId);
  if (tipo) q = q.eq("titulo", tipo);
  const { data, error } = await q;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const rows = (data ?? []) as { id: string; titulo: string; metadata: Record<string, unknown> | null; evidencia_path: string | null }[];

  // Resolver nombres de lotes referenciados (metadata guarda los ids)
  const leIds = new Set<string>();
  const ldIds = new Set<string>();
  const lpIds = new Set<string>();
  for (const r of rows) {
    const m = r.metadata ?? {};
    if (m.lote_entrada_id) leIds.add(String(m.lote_entrada_id));
    if (m.lote_deshidratado_id) ldIds.add(String(m.lote_deshidratado_id));
    if (m.lote_produccion_id) lpIds.add(String(m.lote_produccion_id));
  }
  const [leRes, ldRes, lpRes] = await Promise.all([
    leIds.size ? supabase.from("infusion_lotes_entrada").select("id, codigo_lote").in("id", [...leIds]) : Promise.resolve({ data: [] }),
    ldIds.size
      ? supabase.from("infusion_lotes_deshidratado").select("id, infusion_lotes_entrada(codigo_lote)").in("id", [...ldIds])
      : Promise.resolve({ data: [] }),
    lpIds.size
      ? supabase.from("infusion_lotes_produccion").select("id, infusion_formulas(nombre)").in("id", [...lpIds])
      : Promise.resolve({ data: [] }),
  ]);
  const leNombre = new Map((leRes.data ?? []).map((l) => [l.id, l.codigo_lote]));
  const ldNombre = new Map((ldRes.data ?? []).map((l) => [l.id, l.infusion_lotes_entrada?.codigo_lote ?? ""]));
  const lpNombre = new Map((lpRes.data ?? []).map((l) => [l.id, l.infusion_formulas?.nombre ?? ""]));

  const conEvidencia = rows.filter((r) => r.evidencia_path);
  const firmadas = await Promise.all(
    conEvidencia.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET_EVIDENCIAS)
        .createSignedUrl(r.evidencia_path as string, 3600);
      return { id: r.id, url: signed?.signedUrl ?? null };
    }),
  );
  const urlPorId = new Map(firmadas.map((f) => [f.id, f.url]));

  const out = rows.map((r) => {
    const m = r.metadata ?? {};
    return {
      id: r.id,
      tipo: r.titulo,
      lote_entrada_id: m.lote_entrada_id ?? null,
      lote_deshidratado_id: m.lote_deshidratado_id ?? null,
      lote_produccion_id: m.lote_produccion_id ?? null,
      equipo_id: (r as Record<string, unknown>).equipo_id ?? null,
      estado: (r as Record<string, unknown>).estado ?? "pendiente",
      fecha_vencimiento: (r as Record<string, unknown>).fecha_vencimiento ?? null,
      prioridad: (r as Record<string, unknown>).prioridad ?? "media",
      evidencia_path: r.evidencia_path,
      evidencia_url: r.evidencia_path ? (urlPorId.get(r.id) ?? null) : null,
      completada_at: (r as Record<string, unknown>).completada_at ?? null,
      completada_por: (r as Record<string, unknown>).completada_por ?? null,
      notas: (r as Record<string, unknown>).descripcion ?? null,
      equipo: (r as Record<string, unknown>).infusion_equipo ?? null,
      lote_entrada: m.lote_entrada_id ? { id: String(m.lote_entrada_id), codigo_lote: leNombre.get(String(m.lote_entrada_id)) ?? "" } : null,
      lote_deshidratado: m.lote_deshidratado_id
        ? { id: String(m.lote_deshidratado_id), lote_entrada: { codigo_lote: ldNombre.get(String(m.lote_deshidratado_id)) ?? "" } }
        : null,
      lote_produccion: m.lote_produccion_id
        ? { id: String(m.lote_produccion_id), infusion_formulas: { nombre: lpNombre.get(String(m.lote_produccion_id)) ?? "" } }
        : null,
      created_at: (r as Record<string, unknown>).created_at ?? "",
    };
  });
  return c.json({ data: out });
});

/** POST /api/infusiones/tareas */
infusionesRoutes.post("/tareas", zValidator("json", tareaFormSchema), async (c) => {
  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const rolError = await validarRolEquipo(supabase, input.tipo, input.equipo_id ?? null);
  if (rolError) return c.json({ code: "rol_no_corresponde", message: rolError }, 400);

  const refId = (input.lote_entrada_id ?? input.lote_deshidratado_id ?? input.lote_produccion_id ?? null) as string | null;
  const completada = input.estado === "completada";
  const { data, error } = await supabase
    .from("crm_tareas")
    .insert({
      titulo: input.tipo,
      tipo: "produccion",
      descripcion: input.notas ?? null,
      fecha_vencimiento: input.fecha_vencimiento || null,
      prioridad: input.prioridad,
      estado: input.estado,
      metadata: {
        lote_entrada_id: input.lote_entrada_id ?? null,
        lote_deshidratado_id: input.lote_deshidratado_id ?? null,
        lote_produccion_id: input.lote_produccion_id ?? null,
      },
      ref_tipo: "infusion",
      ref_id: refId,
      equipo_id: input.equipo_id ?? null,
      evidencia_path: input.evidencia_path ?? null,
      completada_at: completada ? new Date().toISOString() : null,
      completada_por: completada ? (await nombreEquipo(supabase, input.equipo_id ?? null)) ?? "—" : null,
      user_id: user.id,
    })
    .select("*")
    .single();
  if (error) return c.json({ code: "create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

/** PATCH /api/infusiones/tareas/:id — al completar, el server setea fecha y quién */
infusionesRoutes.patch(
  "/tareas/:id",
  zValidator("json", tareaFormSchema.partial()),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const supabase = c.get("supabase");

    const { data: actual, error: readErr } = await supabase
      .from("crm_tareas")
      .select("estado, titulo, equipo_id, metadata")
      .eq("id", id)
      .eq("ref_tipo", "infusion")
      .maybeSingle();
    if (readErr) return c.json({ code: "query_failed", message: readErr.message }, 500);
    if (!actual) return c.json({ code: "not_found", message: "Tarea no encontrada" }, 404);

    const tipo = input.tipo ?? actual.titulo;
    const equipoId = input.equipo_id !== undefined ? input.equipo_id : actual.equipo_id;
    const rolError = await validarRolEquipo(supabase, tipo, equipoId ?? null);
    if (rolError) return c.json({ code: "rol_no_corresponde", message: rolError }, 400);

    const estado = input.estado ?? actual.estado;
    const completando = estado === "completada" && actual.estado !== "completada";
    const reabriendo = estado !== "completada" && actual.estado === "completada";

    const metadataActual = (actual.metadata ?? {}) as Record<string, unknown>;
    const payload: {
      titulo?: string; descripcion?: string | null; fecha_vencimiento?: string | null;
      prioridad?: string; estado?: string; equipo_id?: string | null; evidencia_path?: string | null;
      metadata?: Json; ref_id?: string | null; completada_at?: string | null; completada_por?: string | null;
    } = {};
    if (input.tipo !== undefined) payload.titulo = input.tipo;
    if (input.notas !== undefined) payload.descripcion = input.notas ?? null;
    if (input.fecha_vencimiento !== undefined) payload.fecha_vencimiento = input.fecha_vencimiento || null;
    if (input.prioridad !== undefined) payload.prioridad = input.prioridad;
    if (input.estado !== undefined) payload.estado = input.estado;
    if (input.equipo_id !== undefined) payload.equipo_id = input.equipo_id ?? null;
    if (input.evidencia_path !== undefined) payload.evidencia_path = input.evidencia_path ?? null;
    if (input.lote_entrada_id !== undefined || input.lote_deshidratado_id !== undefined || input.lote_produccion_id !== undefined) {
      const nuevoMetadata = {
        ...metadataActual,
        lote_entrada_id: input.lote_entrada_id !== undefined ? input.lote_entrada_id ?? null : metadataActual.lote_entrada_id ?? null,
        lote_deshidratado_id: input.lote_deshidratado_id !== undefined ? input.lote_deshidratado_id ?? null : metadataActual.lote_deshidratado_id ?? null,
        lote_produccion_id: input.lote_produccion_id !== undefined ? input.lote_produccion_id ?? null : metadataActual.lote_produccion_id ?? null,
      };
      payload.metadata = nuevoMetadata as unknown as Json;
      const refId = nuevoMetadata.lote_entrada_id ?? nuevoMetadata.lote_deshidratado_id ?? nuevoMetadata.lote_produccion_id;
      payload.ref_id = refId ? String(refId) : null;
    }
    payload.completada_at = completando ? new Date().toISOString() : reabriendo ? null : undefined;
    payload.completada_por = completando
      ? (await nombreEquipo(supabase, equipoId ?? null)) ?? "—"
      : reabriendo
        ? null
        : undefined;

    const { data, error } = await supabase
      .from("crm_tareas")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return c.json({ code: "update_failed", message: error.message }, 400);
    return c.json({ data });
  },
);

/** DELETE /api/infusiones/tareas/:id — borra la tarea y su evidencia del bucket */
infusionesRoutes.delete("/tareas/:id", async (c) => {
  const id = c.req.param("id");
  const supabase = c.get("supabase");
  const { data: tarea } = await supabase
    .from("crm_tareas")
    .select("evidencia_path")
    .eq("id", id)
    .eq("ref_tipo", "infusion")
    .maybeSingle();
  if (tarea?.evidencia_path) {
    await supabase.storage.from(BUCKET_EVIDENCIAS).remove([tarea.evidencia_path]);
  }
  const { error } = await supabase.from("crm_tareas").delete().eq("id", id).eq("ref_tipo", "infusion");
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});
