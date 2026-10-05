import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import {
  agruparEspeciesPorTbase,
  gddHistoricoAcumulado,
  gddPronostico,
  proyectarFloracion,
} from "@/api/lib/fenologia";
import { fromLoose } from "@/api/lib/supabase-loose";

export const fenologiaRoutes = new Hono<{ Variables: AppVariables }>();

// UI: /fenologia + InicioTerritorial widget — admin|territorial|apicultor (sidebar).
// Sin tenant: territorial/apicultor no tiene usuarios_empresas (hermano registro-territorial / bitácora).
// RLS de especies/estaciones/alertas sigue acotando mutaciones a is_admin().
fenologiaRoutes.use("*", authMiddleware, requireProfileRole("admin", "territorial", "apicultor"));

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

// ── Búsqueda Taxonómica Asistida (iNaturalist Plantae + GBIF) ───────────

fenologiaRoutes.get("/taxa-search", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q || q.length < 2) {
    return c.json({ data: [] });
  }

  try {
    // 1. Consultar iNaturalist (Plantae iconic taxon 47126, locale es-CL)
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(q)}&taxon_id=47126&rank=species&per_page=8&locale=es-CL`;
    const res = await fetch(url, {
      headers: { "User-Agent": "enjambre-legado-botanica/1.0" },
    });

    if (res.ok) {
      const json = await res.json();
      const results = json.results ?? [];
      if (results.length > 0) {
        const items = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results.slice(0, 6).map(async (r: any) => {
            let familia: string | null = null;
            try {
              const gbifRes = await fetch(
                `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(r.name)}&limit=1`,
                { headers: { "User-Agent": "enjambre-legado-botanica/1.0" } }
              );
              if (gbifRes.ok) {
                const gbifData = await gbifRes.json();
                familia = gbifData[0]?.family ?? null;
              }
            } catch {
              // Silently ignore family fallback failure
            }

            return {
              nombre_cientifico: r.name,
              nombre_comun: r.preferred_common_name || r.name,
              familia,
              foto_url: r.default_photo?.medium_url ?? r.default_photo?.square_url ?? null,
              inat_taxon_id: r.id,
            };
          })
        );
        return c.json({ data: items });
      }
    }

    // 2. Fallback a GBIF directo si iNaturalist no devuelve resultados
    const gbifUrl = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&rank=SPECIES&limit=6`;
    const gbifRes = await fetch(gbifUrl, {
      headers: { "User-Agent": "enjambre-legado-botanica/1.0" },
    });
    if (gbifRes.ok) {
      const gbifData = await gbifRes.json();
      const items = (gbifData ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((g: any) => g.kingdom === "Plantae" || !g.kingdom)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((g: any) => ({
          nombre_cientifico: g.canonicalName || g.scientificName,
          nombre_comun: g.canonicalName || g.scientificName,
          familia: g.family ?? null,
          foto_url: null,
          gbif_key: g.key,
        }));
      return c.json({ data: items });
    }

    return c.json({ data: [] });
  } catch {
    return c.json({ code: "taxa_search_failed", message: "Error al consultar catálogo botánico", data: [] }, 500);
  }
});

// ── Especies ────────────────────────────────────────────────────────────

fenologiaRoutes.get("/especies", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await fromLoose(supabase, "especies_fenologicas")
    .select("*")
    .eq("activo", true)
    .order("nombre_comun");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

fenologiaRoutes.get("/especies/todas", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await fromLoose(supabase, "especies_fenologicas")
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
  origen: z.enum(["nativa", "endemica", "introducida", "naturalizada"]).default("nativa"),
  habito: z.enum(["arbol", "arbusto", "herbacea", "enredadera", "palmera", "otro"]).default("arbol"),
  relevancia_apicola: z.enum(["nectar", "polen", "mixta", "propoleo", "melada"]).default("mixta"),
  monitoreo_activo: z.boolean().default(true),
  foto_url: z.string().url().optional().nullable(),
}).strict();

fenologiaRoutes.post("/especies", zValidator("json", EspecieSchema), async (c) => {
  const supabase = c.get("supabase");
  const body = c.req.valid("json");
  const { data, error } = await fromLoose(supabase, "especies_fenologicas")
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
  const { data, error } = await fromLoose(supabase, "especies_fenologicas")
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
  apiario_id: z.string().uuid().optional().nullable(),
  sector: z.string().max(200).optional().nullable(),
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

const ObservacionPatchSchema = ObservacionSchema.partial();

fenologiaRoutes.post("/observaciones", zValidator("json", ObservacionSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const body = c.req.valid("json");
  const { data, error } = await fromLoose(supabase, "observaciones_floracion")
    .insert({ ...body, observador_id: user.id })
    .select("*, especies_fenologicas(nombre_comun, nombre_cientifico)")
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

fenologiaRoutes.patch("/observaciones/:id", zValidator("json", ObservacionPatchSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const esAdmin = c.get("profileRole") === "admin";
  const id = c.req.param("id");
  const body = c.req.valid("json");

  let query = fromLoose(supabase, "observaciones_floracion")
    .update(body)
    .eq("id", id);
  if (!esAdmin) {
    query = query.eq("observador_id", user.id);
  }
  const { data, error } = await query
    .select("*, especies_fenologicas(nombre_comun, nombre_cientifico)")
    .single();
  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
});

fenologiaRoutes.delete("/observaciones/:id", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const esAdmin = c.get("profileRole") === "admin";
  const id = c.req.param("id");

  let query = fromLoose(supabase, "observaciones_floracion")
    .delete()
    .eq("id", id);
  if (!esAdmin) {
    query = query.eq("observador_id", user.id);
  }
  const { error } = await query;
  if (error) return c.json({ code: "delete_failed", message: error.message }, 400);
  return c.json({ ok: true });
});

fenologiaRoutes.get("/observaciones", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { especie_id, desde, hasta, apiario_id } = c.req.query();

  let query = fromLoose(supabase, "observaciones_floracion")
    .select("*, especies_fenologicas(nombre_comun, nombre_cientifico)")
    .order("fecha", { ascending: false })
    .limit(200);

  const esAdmin = c.get("profileRole") === "admin";
  if (!esAdmin) query = query.eq("observador_id", user.id);
  if (especie_id) query = query.eq("especie_id", especie_id);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  if (apiario_id) query = query.eq("apiario_id", apiario_id);

  const { data, error } = await query;
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);
  return c.json({ data: data ?? [] });
});

// ── Pronóstico (Oráculo) ────────────────────────────────────────────────

fenologiaRoutes.get("/pronostico", async (c) => {
  const supabase = c.get("supabase");
  const estacionId = c.req.query("estacion");
  const apiarioId = c.req.query("apiario_id");
  const todas = c.req.query("todas") === "1";

  let lat: number | null;
  let lng: number | null;
  let estacionMeta: { id: string; nombre: string } | null = null;
  let apiarioNombre: string | null = null;
  if (apiarioId) {
    const { data: apiario, error: errApiario } = await fromLoose(supabase, "apiarios")
      .select("id, name, lat, lng")
      .eq("id", apiarioId)
      .maybeSingle();
    if (errApiario) return c.json({ code: "query_failed", message: errApiario.message }, 500);
    if (!apiario) return c.json({ code: "sin_apiario", message: "Apiario no encontrado" }, 404);
    const row = apiario as unknown as { name?: string | null; lat?: number | null; lng?: number | null };
    apiarioNombre = row.name ?? null;
    lat = typeof row.lat === "number" ? row.lat : null;
    lng = typeof row.lng === "number" ? row.lng : null;
    if (lat == null || lng == null || (lat === 0 && lng === 0)) {
      return c.json({ code: "apiario_sin_coords", message: "El apiario no tiene coordenadas" }, 400);
    }
  } else {
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
    lat = Number(estacion.lat);
    lng = Number(estacion.lng);
    estacionMeta = { id: estacion.id, nombre: estacion.nombre };
  }

  // Filtrar especies para el pronóstico: prioritariamente las marcadas con monitoreo_activo
  let queryEspecies = fromLoose(supabase, "especies_fenologicas")
    .select("*")
    .eq("activo", true);
  if (!todas) {
    queryEspecies = queryEspecies.eq("monitoreo_activo", true);
  }
  let { data: especies, error } = await queryEspecies.order("nombre_comun");
  if (error) return c.json({ code: "query_failed", message: error.message }, 500);

  // Si no hay especies con monitoreo_activo marcado, rescatar las primeras 15 activas
  if (!especies?.length && !todas) {
    const fallback = await fromLoose(supabase, "especies_fenologicas")
      .select("*")
      .eq("activo", true)
      .limit(15);
    especies = fallback.data ?? [];
  }

  if (!especies?.length) {
    return c.json({
      data: [],
      meta: {
        gddActual: 0,
        fecha: new Date().toISOString().slice(0, 10),
        estacion: estacionMeta ?? { id: apiarioId ?? "", nombre: apiarioNombre ?? "Mi apiario" },
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
      estacion: estacionMeta
        ? { ...estacionMeta, lat, lng }
        : { id: apiarioId ?? "", nombre: `Mi apiario${apiarioNombre ? ` · ${apiarioNombre}` : ""}`, lat, lng },
    },
  });
});

// ── Alertas (creación manual admin; el job diario emite) ────────────────

const AlertaSchema = z.object({
  especie_id: z.string().uuid(),
  fecha_predicha: z.string().date(),
  gdd_calculado: z.number().optional().nullable(),
  estado: z.enum(["pendiente", "activo", "emitida", "archivada"]).optional().default("activo"),
}).strict();

fenologiaRoutes.post("/alertas", zValidator("json", AlertaSchema), async (c) => {
  const supabase = c.get("supabase");
  const body = c.req.valid("json");
  const estado = body.estado ?? "activo";
  const { data, error } = await supabase
    .from("alertas_floracion")
    .insert({ ...body, estado })
    .select("*, especies_fenologicas(nombre_comun)")
    .single();
  if (error) return c.json({ code: "insert_failed", message: error.message }, 400);
  return c.json({ data }, 201);
});

fenologiaRoutes.patch("/alertas/:id", async (c) => {
  const supabase = c.get("supabase");
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("alertas_floracion")
    .update(body)
    .eq("id", id)
    .select("*, especies_fenologicas(nombre_comun)")
    .single();
  if (error) return c.json({ code: "update_failed", message: error.message }, 400);
  return c.json({ data });
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
