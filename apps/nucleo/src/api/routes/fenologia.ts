import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import {
  agruparEspeciesPorTbase,
  gddHistoricoAcumulado,
  gddPronostico,
  proyectarFloracion,
} from "@/api/lib/fenologia";

export const fenologiaRoutes = new Hono<{ Variables: AppVariables }>();

fenologiaRoutes.use("*", authMiddleware, tenantMiddleware);

const PRONOSTICO_DIAS = 16;

// ── Estaciones fenológicas (puntos de referencia lat/lng para el GDD) ─────

const EstacionSchema = z.object({
  nombre: z.string().min(2).max(120),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  activo: z.boolean().default(true),
}).strict();

const EstacionPatchSchema = EstacionSchema.partial();

fenologiaRoutes.get("/estaciones", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("estaciones_fenologicas")
    .select("*")
    .eq("activo", true)
    .order("nombre");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

fenologiaRoutes.post("/estaciones", zValidator("json", EstacionSchema), async (c) => {
  const supabase = c.get("supabase");
  const body = c.req.valid("json");
  const { data, error } = await supabase
    .from("estaciones_fenologicas")
    .insert(body)
    .select()
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

fenologiaRoutes.patch("/estaciones/:id", zValidator("json", EstacionPatchSchema), async (c) => {
  const supabase = c.get("supabase");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const { data, error } = await supabase
    .from("estaciones_fenologicas")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

// ── Especies ────────────────────────────────────────────────────────────

fenologiaRoutes.get("/especies", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("especies_fenologicas")
    .select("*")
    .eq("activo", true)
    .order("nombre_comun");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

fenologiaRoutes.get("/especies/todas", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase
    .from("especies_fenologicas")
    .select("*")
    .order("nombre_comun");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

const EspecieSchema = z.object({
  nombre_cientifico: z.string().min(3).max(120),
  nombre_comun: z.string().min(2).max(80),
  familia: z.string().max(80).optional().nullable(),
  tbase_c: z.number().min(0).max(15).default(5),
  gdd_umbral: z.number().min(0).optional().nullable(),
  gdd_stddev: z.number().min(0).optional().nullable(),
  ventana_ini: z.number().int().min(1).max(12).optional().nullable(),
  ventana_fin: z.number().int().min(1).max(12).optional().nullable(),
  fuente: z.enum(["gbif", "inat", "literatura", "activa", "manual"]).default("manual"),
  activo: z.boolean().default(true),
}).strict();

fenologiaRoutes.post("/especies", zValidator("json", EspecieSchema), async (c) => {
  const supabase = c.get("supabase");
  const body = c.req.valid("json");
  const { data, error } = await supabase
    .from("especies_fenologicas")
    .insert(body)
    .select()
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

const EspeciePatchSchema = EspecieSchema.partial();

fenologiaRoutes.patch("/especies/:id", zValidator("json", EspeciePatchSchema), async (c) => {
  const supabase = c.get("supabase");
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const { data, error } = await supabase
    .from("especies_fenologicas")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

// ── Observaciones de floración (BBCH 60-69) ─────────────────────────────

const ObservacionSchema = z.object({
  especie_id: z.string().uuid(),
  fecha: z.string().date(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  fenofase_bbch: z.number().int().min(60).max(69),
  status: z.enum(["si", "no"]).default("si"),
  intensidad: z
    .enum(["menos_3", "3_10", "11_100", "101_1000", "1001_10000", "mas_10000"])
    .optional()
    .nullable(),
  foto_url: z.string().url().optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
}).strict();

fenologiaRoutes.post("/observaciones", zValidator("json", ObservacionSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const body = c.req.valid("json");
  // El observador es siempre el usuario autenticado (los admins registran en su nombre)
  const { data, error } = await supabase
    .from("observaciones_floracion")
    .insert({ ...body, observador_id: user.id })
    .select()
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

fenologiaRoutes.get("/observaciones", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { especie_id, desde, hasta, todas } = c.req.query();

  let query = supabase
    .from("observaciones_floracion")
    .select("*, especies_fenologicas(nombre_comun, nombre_cientifico)")
    .order("fecha", { ascending: false })
    .limit(200);

  // No-admin solo ve sus propias observaciones (RLS también lo garantiza)
  const esAdmin = (user.app_metadata as Record<string, unknown> | undefined)?.role === "admin";
  if (!esAdmin && todas !== "1") query = query.eq("observador_id", user.id);
  if (especie_id) query = query.eq("especie_id", especie_id);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data, error } = await query;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

// ── Pronóstico (Oráculo) ────────────────────────────────────────────────

fenologiaRoutes.get("/pronostico", async (c) => {
  const supabase = c.get("supabase");
  const estacionId = c.req.query("estacion");

  // Estación solicitada o primera activa por defecto (seed: Pureo, Chiloé)
  let estacionQuery = supabase
    .from("estaciones_fenologicas")
    .select("*")
    .eq("activo", true)
    .order("created_at");
  if (estacionId) estacionQuery = estacionQuery.eq("id", estacionId);
  const { data: estaciones, error: errEstacion } = await estacionQuery;
  if (errEstacion) return c.json({ code: "query_failed", message: errEstacion.message }, 500);
  const estacion = (estaciones ?? [])[0];
  if (!estacion) {
    return c.json({ code: "sin_estacion", message: "No hay estaciones fenológicas activas" }, 404);
  }

  const { data: especies, error } = await supabase
    .from("especies_fenologicas")
    .select("*")
    .eq("activo", true);
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  const lat = Number(estacion.lat);
  const lng = Number(estacion.lng);

  if (!especies?.length) {
    return c.json({
      data: [],
      meta: {
        gddActual: 0,
        fecha: new Date().toISOString().slice(0, 10),
        estacion: { id: estacion.id, nombre: estacion.nombre, lat, lng },
      },
    });
  }

  // Una llamada a Open-Meteo por Tbase distinta (misma estación para todas)
  const grupos = agruparEspeciesPorTbase(especies);
  const porTbase = new Map<
    number,
    {
      historico: Awaited<ReturnType<typeof gddHistoricoAcumulado>>;
      pronostico: Awaited<ReturnType<typeof gddPronostico>>;
    }
  >();
  for (const tbase of grupos.keys()) {
    const [historico, pronostico] = await Promise.all([
      gddHistoricoAcumulado(lat, lng, new Date(), tbase),
      gddPronostico(lat, lng, PRONOSTICO_DIAS, tbase),
    ]);
    porTbase.set(tbase, { historico, pronostico });
  }

  const data = especies.map((esp) => {
    const tbase = Number(esp.tbase_c ?? 5);
    const serie = porTbase.get(tbase) ?? { historico: null, pronostico: null };
    return proyectarFloracion(esp, serie.historico, serie.pronostico);
  });

  return c.json({
    data,
    meta: {
      gddActual: porTbase.get(5)?.historico?.acumulado ?? null,
      fecha: new Date().toISOString().slice(0, 10),
      estacion: { id: estacion.id, nombre: estacion.nombre, lat, lng },
    },
  });
});

// ── Alertas (creación manual admin; el job diario emite) ────────────────

const AlertaSchema = z.object({
  especie_id: z.string().uuid(),
  fecha_predicha: z.string().date(),
  gdd_calculado: z.number().optional().nullable(),
}).strict();

fenologiaRoutes.post("/alertas", zValidator("json", AlertaSchema), async (c) => {
  const supabase = c.get("supabase");
  const body = c.req.valid("json");
  const { data, error } = await supabase
    .from("alertas_floracion")
    .insert({ ...body, estado: "pendiente" })
    .select()
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

fenologiaRoutes.get("/alertas", async (c) => {
  const supabase = c.get("supabase");
  const { estado } = c.req.query();
  let query = supabase
    .from("alertas_floracion")
    .select("*, especies_fenologicas(nombre_comun)")
    .order("fecha_predicha", { ascending: true })
    .limit(50);
  if (estado) query = query.eq("estado", estado);
  const { data, error } = await query;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});
