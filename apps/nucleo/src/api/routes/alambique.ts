import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/server-index";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@enjambre/database/database.types";
import { revalidateTiendaLayout } from "@/lib/revalidate-tienda";

export const alambiqueRoutes = new Hono<{ Variables: AppVariables }>();

alambiqueRoutes.use("*", authMiddleware);
alambiqueRoutes.use("*", tenantMiddleware);
alambiqueRoutes.use("*", requireProfileRole("admin"));

/* ── Schemas ─────────────────────────────────────────────────────────────── */

const OrganolepticoSchema = z
  .object({
    color: z.string().max(200).optional(),
    olor: z.string().max(200).optional(),
    sabor: z.string().max(200).optional(),
    textura: z.string().max(200).optional(),
  })
  .optional();

const CreatePlantaSchema = z
  .object({
    nombre_comun: z.string().min(1).max(200),
    nombre_cientifico: z.string().max(300).optional().nullable(),
    parte_usada: z.enum(["hojas", "flores", "corteza", "raices", "semillas", "frutos", "ramas", "otra"]),
    estado_material: z.enum(["fresco", "seco", "semicresco"]),
    cantidad_kg: z.number().positive(),
    origen: z.string().max(300).optional().nullable(),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),
    fecha_recoleccion: z.string().date().optional().nullable(),
    observaciones: z.string().max(5000).optional().nullable(),
  })
  .strict();

const UpdatePlantaSchema = CreatePlantaSchema.partial();

const CreateDestilacionSchema = z
  .object({
    planta_id: z.string().uuid(),
    metodo: z.enum(["hidrodestilacion", "arrastre_vapor"]),
    fecha_inicio: z.string().datetime().optional(),
    fecha_fin: z.string().datetime().optional().nullable(),
    carga_kg: z.number().positive(),
    agua_l: z.number().positive().optional().nullable(),
    duracion_min: z.number().int().positive().optional().nullable(),
    temperatura_promedio: z.number().min(0).max(200).optional().nullable(),
    rendimiento_hidrolato_ml: z.number().nonnegative().optional().nullable(),
    rendimiento_aceite_ml: z.number().nonnegative().optional().nullable(),
    analisis_organoleptico: OrganolepticoSchema,
    observaciones: z.string().max(5000).optional().nullable(),
    estado: z.enum(["planificada", "en_proceso", "finalizada", "descartada"]),
    publico: z.boolean(),
    relato_publico: z.string().max(5000).optional().nullable(),
  })
  .strict();

const UpdateDestilacionSchema = CreateDestilacionSchema.partial();

const emptyToNullUuid = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.string().uuid().nullable().optional(),
);

const CreateProductoDestilacionSchema = z
  .object({
    destilacion_id: z.string().uuid(),
    tipo: z.enum(["hidrolato", "aceite_esencial", "otro"]),
    volumen_ml: z.number().positive(),
    envase: z.string().max(200).optional().nullable(),
    unidades: z.number().int().positive(),
    fecha_envasado: z.string().date().optional().nullable(),
    destino: z.enum(["venta", "uso_propio", "regalo", "investigacion"]),
    // Select "Sin vínculo" manda "" — no uuid inválido
    producto_id: emptyToNullUuid,
    precio_sugerido_clp: z.number().int().nonnegative().optional().nullable(),
    observaciones: z.string().max(5000).optional().nullable(),
    // Triangulación 4: ingresar directamente al stock del SKU vinculado
    ingresar_a_stock: z.boolean().optional(),
  })
  .strict();

const UpdateProductoDestilacionSchema = CreateProductoDestilacionSchema.omit({ ingresar_a_stock: true }).partial();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUuid(c: { req: { param: (k: string) => string } }): boolean {
  return UUID_RE.test(c.req.param("id"));
}

/* ── Materias primas ─────────────────────────────────────────────────────── */

alambiqueRoutes.get("/plantas", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("plantas_destilacion")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

alambiqueRoutes.post("/plantas", zValidator("json", CreatePlantaSchema), async (c) => {
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("plantas_destilacion")
    .insert(input)
    .select()
    .single();

  if (error) return c.json({ code: "planta_create_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

alambiqueRoutes.patch("/plantas/:id", zValidator("json", UpdatePlantaSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("plantas_destilacion")
    .update(input)
    .eq("id", c.req.param("id"))
    .select()
    .single();

  if (error) return c.json({ code: "planta_update_failed", message: error.message }, 400);
  return c.json({ data });
});

alambiqueRoutes.delete("/plantas/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("plantas_destilacion")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "planta_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Destilaciones ───────────────────────────────────────────────────────── */

/** Genera el código DST-YYYY-#### contando las corridas del año (único). */
async function generarCodigoDestilacion(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const year = new Date().getFullYear();
  const inicio = `${year}-01-01T00:00:00.000Z`;
  const fin = `${year + 1}-01-01T00:00:00.000Z`;

  const { count, error } = await supabase
    .from("destilaciones")
    .select("id", { count: "exact", head: true })
    .gte("fecha_inicio", inicio)
    .lt("fecha_inicio", fin);

  if (error) return null;
  return `DST-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

function shapeDestilacion(d: Record<string, unknown>) {
  const planta = d.plantas_destilacion as Record<string, unknown> | null;
  const productos = Array.isArray(d.productos_destilacion)
    ? (d.productos_destilacion as Record<string, unknown>[])
    : [];

  return {
    id: String(d.id),
    codigo: d.codigo ? String(d.codigo) : null,
    metodo: String(d.metodo ?? ""),
    fecha_inicio: String(d.fecha_inicio ?? ""),
    fecha_fin: d.fecha_fin ? String(d.fecha_fin) : null,
    carga_kg: Number(d.carga_kg) || 0,
    agua_l: d.agua_l != null ? Number(d.agua_l) : null,
    duracion_min: d.duracion_min != null ? Number(d.duracion_min) : null,
    temperatura_promedio: d.temperatura_promedio != null ? Number(d.temperatura_promedio) : null,
    rendimiento_hidrolato_ml: d.rendimiento_hidrolato_ml != null ? Number(d.rendimiento_hidrolato_ml) : null,
    rendimiento_aceite_ml: d.rendimiento_aceite_ml != null ? Number(d.rendimiento_aceite_ml) : null,
    estado: String(d.estado ?? "finalizada"),
    publico: Boolean(d.publico),
    relato_publico: d.relato_publico ? String(d.relato_publico) : null,
    observaciones: d.observaciones ? String(d.observaciones) : null,
    planta: planta
      ? {
          id: String(planta.id),
          nombre_comun: String(planta.nombre_comun ?? ""),
          nombre_cientifico: planta.nombre_cientifico ? String(planta.nombre_cientifico) : null,
          parte_usada: String(planta.parte_usada ?? ""),
          estado_material: String(planta.estado_material ?? ""),
          cantidad_kg: Number(planta.cantidad_kg) || 0,
          origen: planta.origen ? String(planta.origen) : null,
          fecha_recoleccion: planta.fecha_recoleccion ? String(planta.fecha_recoleccion) : null,
        }
      : null,
    productos: productos.map((p) => ({
      id: String(p.id),
      tipo: String(p.tipo ?? ""),
      volumen_ml: Number(p.volumen_ml) || 0,
      unidades: Number(p.unidades) || 1,
      destino: String(p.destino ?? ""),
    })),
  };
}

alambiqueRoutes.get("/destilaciones", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("destilaciones")
    .select(
      "*, plantas_destilacion(id, nombre_comun, nombre_cientifico, parte_usada, estado_material, cantidad_kg, origen, fecha_recoleccion), productos_destilacion(id, tipo, volumen_ml, unidades, destino)",
    )
    .order("fecha_inicio", { ascending: false });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  const rows = (data ?? []).map((d) => shapeDestilacion(d as unknown as Record<string, unknown>));
  return c.json({ data: rows });
});

alambiqueRoutes.get("/destilaciones/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("destilaciones")
    .select(
      "*, plantas_destilacion(id, nombre_comun, nombre_cientifico, parte_usada, estado_material, cantidad_kg, origen, lat, lng, fecha_recoleccion), productos_destilacion(*)",
    )
    .eq("id", c.req.param("id"))
    .single();

  if (error || !data) return c.json({ code: "not_found", message: "Destilación no encontrada" }, 404);
  const row = shapeDestilacion(data as unknown as Record<string, unknown>);
  const raw = data as unknown as Record<string, unknown>;
  return c.json({
    data: {
      ...row,
      analisis_organoleptico: (raw.analisis_organoleptico as Record<string, string> | null) ?? null,
    },
  });
});

alambiqueRoutes.post("/destilaciones", zValidator("json", CreateDestilacionSchema), async (c) => {
  const supabase = c.get("supabase");
  const input = c.req.valid("json");
  const organoleptico: Json | null = (input.analisis_organoleptico ?? null) as Json | null;

  // El código es único por año; si colisiona (doble click/raza), reintenta.
  for (let attempt = 0; attempt < 5; attempt++) {
    const codigo = await generarCodigoDestilacion(supabase);
    if (!codigo) {
      return c.json({ code: "codigo_failed", message: "No se pudo generar el código de destilación" }, 500);
    }

    const { data, error } = await supabase
      .from("destilaciones")
      .insert({ ...input, codigo, analisis_organoleptico: organoleptico })
      .select("id, codigo")
      .single();

    if (!error) return c.json({ data }, 201);
    if (!/duplicate key|unique/i.test(error.message)) {
      return c.json({ code: "destilacion_create_failed", message: error.message }, 400);
    }
  }

  return c.json({ code: "codigo_conflict", message: "Conflicto al generar código único" }, 409);
});

alambiqueRoutes.patch("/destilaciones/:id", zValidator("json", UpdateDestilacionSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const payload: Database["public"]["Tables"]["destilaciones"]["Update"] = { ...input };
  if (input.analisis_organoleptico !== undefined) {
    payload.analisis_organoleptico = (input.analisis_organoleptico ?? null) as Json | null;
  }

  const { data, error } = await supabase
    .from("destilaciones")
    .update(payload)
    .eq("id", c.req.param("id"))
    .select("id, codigo")
    .single();

  if (error) return c.json({ code: "destilacion_update_failed", message: error.message }, 400);
  return c.json({ data });
});

alambiqueRoutes.delete("/destilaciones/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("destilaciones")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "destilacion_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Productos envasados ─────────────────────────────────────────────────── */

alambiqueRoutes.get("/productos", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("productos_destilacion")
    .select(
      // id de destilaciones es obligatorio: el form de edición usa destilacion.id / destilacion_id
      "*, destilaciones(id, codigo, fecha_inicio, plantas_destilacion(nombre_comun)), productos(id, nombre, stock, visible)",
    )
    .order("created_at", { ascending: false });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const rows = (data ?? []).map((raw) => {
    const d = raw as unknown as Record<string, unknown>;
    const destilacion = d.destilaciones as Record<string, unknown> | null;
    const destilacionPlanta = destilacion?.plantas_destilacion as Record<string, unknown> | null;
    const productoVenta = d.productos as Record<string, unknown> | null;
    const destilacionId = String(destilacion?.id ?? d.destilacion_id ?? "");
    return {
      id: String(d.id),
      destilacion_id: destilacionId,
      tipo: String(d.tipo ?? ""),
      volumen_ml: Number(d.volumen_ml) || 0,
      envase: d.envase ? String(d.envase) : null,
      unidades: Number(d.unidades) || 1,
      fecha_envasado: d.fecha_envasado ? String(d.fecha_envasado) : null,
      destino: String(d.destino ?? "venta"),
      precio_sugerido_clp: d.precio_sugerido_clp != null ? Number(d.precio_sugerido_clp) : null,
      observaciones: d.observaciones ? String(d.observaciones) : null,
      destilacion: destilacionId
        ? {
            id: destilacionId,
            codigo: destilacion?.codigo ? String(destilacion.codigo) : null,
            fecha_inicio: String(destilacion?.fecha_inicio ?? ""),
            planta_nombre: String(destilacionPlanta?.nombre_comun ?? ""),
          }
        : null,
      producto_venta: productoVenta
        ? {
            id: String(productoVenta.id),
            nombre: String(productoVenta.nombre ?? ""),
            stock: Number(productoVenta.stock) || 0,
            visible: Boolean(productoVenta.visible),
          }
        : null,
    };
  });

  return c.json({ data: rows });
});

/** Catálogo de productos de venta (tienda/campo) para el select de entrelazado. */
alambiqueRoutes.get("/productos-venta", async (c) => {
  const supabase = c.get("supabase");

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, stock, visible")
    .order("nombre", { ascending: true });

  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

alambiqueRoutes.post("/productos", zValidator("json", CreateProductoDestilacionSchema), async (c) => {
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  // Extraer el flag antes de insertar (no va a la tabla)
  const { ingresar_a_stock, ...insertPayload } = input;

  const { data, error } = await supabase
    .from("productos_destilacion")
    .insert(insertPayload)
    .select()
    .single();

  if (error) return c.json({ code: "producto_create_failed", message: error.message }, 400);

  // Triangulación 4: si ingresar_a_stock=true y hay producto_id, incrementar stock
  let stockActualizado = false;
  if (ingresar_a_stock && input.producto_id) {
    try {
      const admin = createAdminClient();
      const { data: prod } = await admin
        .from("productos")
        .select("id, stock")
        .eq("id", input.producto_id)
        .maybeSingle();

      if (prod) {
        const nuevoStock = Number(prod.stock ?? 0) + input.unidades;
        const { error: stockErr } = await admin
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("id", input.producto_id);

        if (!stockErr) {
          stockActualizado = true;
          await revalidateTiendaLayout().catch(() => undefined);
        } else {
          console.error("[Alambique] Error al actualizar stock del SKU:", stockErr);
        }
      }
    } catch (err) {
      console.error("[Alambique] Excepción al actualizar stock:", err);
    }
  }

  return c.json({ data, stock_actualizado: stockActualizado }, 201);
});


alambiqueRoutes.patch("/productos/:id", zValidator("json", UpdateProductoDestilacionSchema), async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");
  const input = c.req.valid("json");

  const { data, error } = await supabase
    .from("productos_destilacion")
    .update(input)
    .eq("id", c.req.param("id"))
    .select()
    .single();

  if (error) return c.json({ code: "producto_update_failed", message: error.message }, 400);
  return c.json({ data });
});

alambiqueRoutes.delete("/productos/:id", async (c) => {
  if (!validUuid(c)) return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  const supabase = c.get("supabase");

  const { error } = await supabase
    .from("productos_destilacion")
    .delete()
    .eq("id", c.req.param("id"));

  if (error) return c.json({ code: "producto_delete_failed", message: error.message }, 400);
  return c.json({ data: { deleted: true } });
});

/* ── Dashboard ───────────────────────────────────────────────────────────── */

alambiqueRoutes.get("/dashboard", async (c) => {
  const supabase = c.get("supabase");

  const [plantasRes, destilacionesRes] = await Promise.all([
    supabase.from("plantas_destilacion").select("id, nombre_comun, cantidad_kg"),
    supabase
      .from("destilaciones")
      .select("id, codigo, planta_id, fecha_inicio, carga_kg, rendimiento_hidrolato_ml, rendimiento_aceite_ml, estado, plantas_destilacion(nombre_comun)")
      .order("fecha_inicio", { ascending: false })
      .limit(500),
  ]);

  if (plantasRes.error || destilacionesRes.error) {
    return c.json({ code: "query_failed", message: "Error al obtener métricas" }, 500);
  }

  const destilaciones = (destilacionesRes.data ?? []).map((d) =>
    d as unknown as Record<string, unknown>,
  );
  const plantas = plantasRes.data ?? [];

  const finalizadas = destilaciones.filter((d) => d.estado !== "descartada");
  const totalHidrolato = finalizadas.reduce(
    (acc, d) => acc + (d.rendimiento_hidrolato_ml != null ? Number(d.rendimiento_hidrolato_ml) : 0),
    0,
  );
  const totalAceite = finalizadas.reduce(
    (acc, d) => acc + (d.rendimiento_aceite_ml != null ? Number(d.rendimiento_aceite_ml) : 0),
    0,
  );
  const totalCarga = finalizadas.reduce(
    (acc, d) => acc + (d.carga_kg != null ? Number(d.carga_kg) : 0),
    0,
  );

  // Rendimiento promedio por planta: ml de hidrolato por kg de carga
  const porPlanta = new Map<string, { nombre: string; destilaciones: number; hidrolato_ml: number; aceite_ml: number; carga_kg: number }>();
  for (const d of finalizadas) {
    const planta = d.plantas_destilacion as Record<string, unknown> | null;
    const nombre = planta?.nombre_comun ? String(planta.nombre_comun) : "Sin planta";
    const acc = porPlanta.get(nombre) ?? { nombre, destilaciones: 0, hidrolato_ml: 0, aceite_ml: 0, carga_kg: 0 };
    acc.destilaciones += 1;
    acc.hidrolato_ml += d.rendimiento_hidrolato_ml != null ? Number(d.rendimiento_hidrolato_ml) : 0;
    acc.aceite_ml += d.rendimiento_aceite_ml != null ? Number(d.rendimiento_aceite_ml) : 0;
    acc.carga_kg += d.carga_kg != null ? Number(d.carga_kg) : 0;
    porPlanta.set(nombre, acc);
  }

  const porPlantaList = Array.from(porPlanta.values())
    .map((p) => ({
      ...p,
      rendimiento_ml_por_kg: p.carga_kg > 0 ? Math.round(p.hidrolato_ml / p.carga_kg) : 0,
    }))
    .sort((a, b) => b.hidrolato_ml - a.hidrolato_ml);

  return c.json({
    data: {
      stats: {
        total_plantas: plantas.length,
        total_destilaciones: destilaciones.length,
        en_proceso: destilaciones.filter((d) => d.estado === "en_proceso").length,
        total_hidrolato_ml: Math.round(totalHidrolato),
        total_aceite_ml: Math.round(totalAceite),
        rendimiento_ml_por_kg: totalCarga > 0 ? Math.round(totalHidrolato / totalCarga) : 0,
      },
      por_planta: porPlantaList,
      ultimas: destilaciones.slice(0, 6).map((d) => ({
        id: String(d.id),
        codigo: d.codigo ? String(d.codigo) : null,
        planta: String((d.plantas_destilacion as Record<string, unknown> | null)?.nombre_comun ?? ""),
        fecha_inicio: String(d.fecha_inicio ?? ""),
        estado: String(d.estado ?? ""),
        rendimiento_hidrolato_ml: d.rendimiento_hidrolato_ml != null ? Number(d.rendimiento_hidrolato_ml) : null,
      })),
    },
  });
});

/* ── Página pública (QR de trazabilidad) ─────────────────────────────────── */

export const alambiquePublicRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/alambique/publico/:id — sin auth; valida explícitamente publico = true
alambiquePublicRoutes.get("/publico/:id", async (c) => {
  const { id } = c.req.param();

  if (!UUID_RE.test(id)) {
    return c.json({ code: "invalid_id", message: "Formato de ID inválido" }, 400);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("destilaciones")
    .select(
      "id, codigo, metodo, fecha_inicio, fecha_fin, carga_kg, agua_l, duracion_min, temperatura_promedio, rendimiento_hidrolato_ml, rendimiento_aceite_ml, relato_publico, publico, plantas_destilacion(nombre_comun, nombre_cientifico, parte_usada, estado_material, cantidad_kg, origen, lat, lng, fecha_recoleccion)",
    )
    .eq("id", id)
    .eq("publico", true)
    .single();

  if (error || !data) {
    return c.json({ code: "not_found", message: "Destilación no encontrada o no es pública" }, 404);
  }

  const d = data as unknown as Record<string, unknown>;
  const planta = d.plantas_destilacion as Record<string, unknown> | null;

  return c.json({
    data: {
      id: String(d.id),
      codigo: d.codigo ? String(d.codigo) : String(d.id).split("-")[0],
      metodo: String(d.metodo ?? ""),
      fecha_inicio: String(d.fecha_inicio ?? ""),
      fecha_fin: d.fecha_fin ? String(d.fecha_fin) : null,
      carga_kg: Number(d.carga_kg) || 0,
      agua_l: d.agua_l != null ? Number(d.agua_l) : null,
      duracion_min: d.duracion_min != null ? Number(d.duracion_min) : null,
      temperatura_promedio: d.temperatura_promedio != null ? Number(d.temperatura_promedio) : null,
      rendimiento_hidrolato_ml: d.rendimiento_hidrolato_ml != null ? Number(d.rendimiento_hidrolato_ml) : null,
      rendimiento_aceite_ml: d.rendimiento_aceite_ml != null ? Number(d.rendimiento_aceite_ml) : null,
      relato_publico: d.relato_publico ? String(d.relato_publico) : null,
      planta: planta
        ? {
            nombre_comun: String(planta.nombre_comun ?? ""),
            nombre_cientifico: planta.nombre_cientifico ? String(planta.nombre_cientifico) : null,
            parte_usada: String(planta.parte_usada ?? ""),
            estado_material: String(planta.estado_material ?? ""),
            cantidad_kg: Number(planta.cantidad_kg) || 0,
            origen: planta.origen ? String(planta.origen) : null,
            lat: planta.lat != null ? Number(planta.lat) : null,
            lng: planta.lng != null ? Number(planta.lng) : null,
            fecha_recoleccion: planta.fecha_recoleccion ? String(planta.fecha_recoleccion) : null,
          }
        : null,
    },
  });
});
