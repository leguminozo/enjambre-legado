import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { validarRUT } from "@enjambre/contable";
import { createAdminClient } from "@enjambre/auth/browser";
import { haversineKm } from "@/lib/hive-state";
import { distanciaMinimaLegalKm } from "@/lib/distancias-legales";
import { fromLoose } from "@/api/lib/supabase-loose";
import { resolveTerritorialMenuFamily } from "@/lib/territorial-rol";

export const registroTerritorialRoutes = new Hono<{ Variables: AppVariables }>();

// UI: /territorio y /registro-territorial solo territorial|admin (ROUTE_ROLE_GUARDS).
registroTerritorialRoutes.use(
  "*",
  authMiddleware,
  requireProfileRole("territorial", "admin"),
);

/**
 * Oleada 2a: escrituras solo para familias api|institucion (o admin).
 * Familia `minimo` (2b / sin sub-rol) solo puede inscribir actor propio.
 * Lecturas (GET) siguen abiertas a todo territorial (RLS filtra datos).
 */
registroTerritorialRoutes.use("*", async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const profileRole = c.get("profileRole");
  if (profileRole === "admin") return next();

  const path = new URL(c.req.url).pathname;
  // Inscripción / auto-registro: siempre permitido para territorial
  if (
    method === "POST" &&
    (path.endsWith("/actores") || path.endsWith("/registro-territorial/actores"))
  ) {
    return next();
  }

  const supabase = c.get("supabase");
  const user = c.get("user");
  let rol: string | null = null;
  try {
    const { data: actor } = await supabase
      .from("actores_registro")
      .select("rol")
      .eq("user_id", user.id)
      .maybeSingle();
    if (actor && typeof (actor as { rol?: string }).rol === "string") {
      rol = (actor as { rol: string }).rol;
    }
  } catch {
    /* fallback metadata */
  }
  if (!rol) {
    const meta = user.user_metadata?.territorial_rol;
    rol = typeof meta === "string" ? meta : null;
  }

  const family = resolveTerritorialMenuFamily(rol);
  if (family === "minimo") {
    return c.json(
      {
        code: "territorial_family_restricted",
        message:
          "Tu sub-rol territorial aún no tiene escrituras habilitadas (oleada 2b). Completá la inscripción o pedí promoción de rol.",
        family,
      },
      403,
    );
  }

  return next();
});

// ---------------------------------------------------------------------------
// Schemas de validación
// ---------------------------------------------------------------------------

const RolSchema = z.enum([
  "api_residente",
  "api_trashumante",
  "api_mixto",
  "prop_facilitador",
  "agri_fitosanitario",
  "agri_aplicador",
  "comercial_acopio",
  "tecnico_inspector",
  "institucion_publica",
]);

const NivelAcreditacionSchema = z.enum([
  "base",
  "trazable",
  "comprometido",
  "referente",
]);

const ConsentimientosSchema = z.object({
  mapa_comunitario: z.boolean().default(false),
  alertas_fitosanitarias: z.boolean().default(true),
  catalogo_infraestructura: z.boolean().default(false),
  acopio_cooperativo: z.boolean().default(false),
}).strict();

const CreateActorSchema = z.object({
  rol: RolSchema,
  nombre_actor: z.string().min(2).max(200),
  rut: z.string().optional().refine((rut) => !rut || validarRUT(rut), {
    message: "RUT inválido",
  }),
  telefono: z.string().max(30).optional(),
  rup: z.string().optional(),
  comuna: z.string().min(2).max(100),
  region: z.string().default("Los Lagos"),
  practicas_sanitarias: z.string().max(2000).optional(),
  metodo_control_varroa: z.string().max(500).optional(),
  declaracion_existencia_animal: z.boolean().optional(),
  acepta_carta: z.boolean().optional(),
  acepta_politica_datos: z.boolean().optional(),
  completo: z.boolean().optional(),
  consentimientos: ConsentimientosSchema.optional(),
  observaciones: z.string().max(1000).optional(),
}).strict();

const CreatePredioSchema = z.object({
  actor_id: z.string().uuid(),
  nombre: z.string().max(200).optional(),
  comuna: z.string().min(2).max(100),
  zona: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).optional(),
  lng_aproximada: z.number().min(-180).max(180).optional(),
  superficie_ha: z.number().positive().optional(),
  disponible_desde: z.string().date().optional(),
  disponible_hasta: z.string().date().optional(),
  condiciones: z.string().max(2000).optional(),
}).strict();

const CreateApiarioExternoSchema = z.object({
  actor_id: z.string().uuid(),
  predio_id: z.string().uuid().optional(),
  nombre: z.string().max(200).optional(),
  n_colmenas: z.number().int().positive(),
  comuna_origen: z.string().min(2).max(100),
  comuna_destino: z.string().min(2).max(100),
  zona_destino: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).optional(),
  lng_aproximada: z.number().min(-180).max(180).optional(),
  fecha_ingreso: z.string().date(),
  fecha_salida: z.string().date().optional(),
  cert_sanitaria_url: z.string().max(500).optional(), // path del PDF en storage o URL
  cert_sanitaria_fecha: z.string().date().optional(),
  cert_sanitaria_lab: z.string().max(200).optional(),
  bioseguridad_declarada: z.string().max(2000).optional(),
  observaciones: z.string().max(1000).optional(),
}).strict();

const CategoriaApiarioSchema = z.enum([
  "produccion",
  "polinizacion",
  "seleccion_cria",
  "otro",
]);

const CreateApiarioRegistroSchema = z.object({
  nombre: z.string().max(200).optional(),
  comuna: z.string().min(2).max(100),
  zona: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).optional(),
  lng_aproximada: z.number().min(-180).max(180).optional(),
  n_colmenas: z.number().int().positive(),
  categoria: CategoriaApiarioSchema.default("produccion"),
  activo: z.boolean().optional(),
  observaciones: z.string().max(1000).optional(),
}).strict();

const CreateAlertaSchema = z.object({
  actor_id: z.string().uuid(),
  comuna: z.string().min(2).max(100),
  zona: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).optional(),
  lng_aproximada: z.number().min(-180).max(180).optional(),
  radio_km: z.number().positive().default(3),
  producto: z.string().min(1).max(200),
  tipo_producto: z.enum([
    "herbicida",
    "fungicida",
    "insecticida",
    "acaricida",
    "fertilizante",
    "otro",
  ]).optional(),
  metodo_aplicacion: z.string().max(200).optional(),
  fecha_programada: z.string().datetime(),
  periodo_carencia_horas: z.number().int().min(0).optional(),
  observaciones: z.string().max(1000).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Helpers de ownership (fail-closed: los no-admin solo operan sobre su actor)
// ---------------------------------------------------------------------------

/** Resuelve el actor propio del usuario autenticado (null si no está inscrito).
 *  Lanza si la consulta falla → el onError global responde 500 JSON. */
async function resolveMiActor(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("actores_registro")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// ACTORES
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/actores — actores de una comuna */
registroTerritorialRoutes.get("/actores", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, rol, estado } = c.req.query();

  let query = supabase
    .from("actores_registro")
    .select("id, rol, nombre_actor, comuna, nivel_acreditacion, estado, rup, completo, created_at")
    .order("created_at", { ascending: false });

  if (comuna) query = query.eq("comuna", comuna);
  if (rol) query = query.eq("rol", rol);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** GET /api/registro-territorial/actores/me — perfil propio del usuario autenticado */
registroTerritorialRoutes.get("/actores/me", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("actores_registro")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** GET /api/registro-territorial/resumen — métricas personales del actor (inicio territorial) */
registroTerritorialRoutes.get("/resumen", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: actor } = await supabase
    .from("actores_registro")
    .select("id, rol, nombre_actor, comuna, region, nivel_acreditacion, completo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!actor) {
    return c.json({
      data: { actor: null, apiarios: 0, colmenas: 0, alertasActivas: 0, observaciones: 0 },
    });
  }

  const [apiariosRes, obsRes] = await Promise.all([
    supabase
      .from("apiarios_registro")
      .select("lat_aproximada, lng_aproximada, n_colmenas")
      .eq("actor_id", actor.id)
      .eq("activo", true),
    supabase
      .from("observaciones_floracion")
      .select("id", { count: "exact", head: true })
      .eq("observador_id", user.id),
  ]);

  const apiarios = apiariosRes.data ?? [];
  const colmenas = apiarios.reduce((sum, a) => sum + Number(a.n_colmenas ?? 0), 0);

  // Alertas fitosanitarias activas en el radio del primer apiario con coordenadas
  let alertasActivas = 0;
  const primerApiario = apiarios.find(
    (a) => a.lat_aproximada != null && a.lng_aproximada != null
  );
  if (primerApiario) {
    const { data: alertas } = await supabase.rpc("alertas_en_radio", {
      p_lat: Number(primerApiario.lat_aproximada),
      p_lng: Number(primerApiario.lng_aproximada),
      p_radio: 5,
    });
    alertasActivas = Array.isArray(alertas) ? alertas.length : 0;
  }

  return c.json({
    data: {
      actor,
      apiarios: apiarios.length,
      colmenas,
      alertasActivas,
      observaciones: obsRes.count ?? 0,
    },
  });
});

// ---------------------------------------------------------------------------
// Dashboard municipal: agregados por comuna (patrón bump de mapa-chiloe-publico)
// ---------------------------------------------------------------------------

interface ComunaResumen {
  comuna: string;
  actores_activos: number;
  apiarios: number;
  colmenas: number;
  trashumantes: number;
  alertas_activas: number;
}

async function fetchResumenComunas(
  supabase: SupabaseClient<Database>,
): Promise<{ rows: ComunaResumen[] } | { error: string }> {
  const [actoresRes, apiariosRes, externosRes, alertasRes] = await Promise.all([
    supabase.from("actores_registro").select("comuna").eq("estado", "activo"),
    supabase.from("apiarios_registro").select("comuna, n_colmenas").eq("activo", true),
    supabase
      .from("apiarios_externos")
      .select("comuna_destino")
      .in("estado", ["declarado", "activo"]),
    supabase.from("alertas_fitosanitarias").select("comuna").eq("estado", "activa"),
  ]);

  for (const r of [actoresRes, apiariosRes, externosRes, alertasRes]) {
    if (r.error) return { error: r.error.message };
  }

  const mapa = new Map<string, ComunaResumen>();
  const bump = (
    comuna: string | null | undefined,
    key: "actores_activos" | "apiarios" | "colmenas" | "trashumantes" | "alertas_activas",
    delta = 1,
  ) => {
    if (!comuna) return;
    const actual = mapa.get(comuna) ?? {
      comuna,
      actores_activos: 0,
      apiarios: 0,
      colmenas: 0,
      trashumantes: 0,
      alertas_activas: 0,
    };
    actual[key] += delta;
    mapa.set(comuna, actual);
  };

  for (const a of actoresRes.data ?? []) bump(a.comuna, "actores_activos");
  for (const ap of apiariosRes.data ?? []) {
    bump(ap.comuna, "apiarios");
    bump(ap.comuna, "colmenas", Number(ap.n_colmenas ?? 0));
  }
  for (const e of externosRes.data ?? []) bump(e.comuna_destino, "trashumantes");
  for (const al of alertasRes.data ?? []) bump(al.comuna, "alertas_activas");

  const rows = [...mapa.values()].sort((a, b) => a.comuna.localeCompare(b.comuna, "es"));
  return { rows };
}

/** GET /api/registro-territorial/resumen-comunas — agregados por comuna (dashboard municipal) */
registroTerritorialRoutes.get("/resumen-comunas", async (c) => {
  const supabase = c.get("supabase");
  const res = await fetchResumenComunas(supabase);
  if ("error" in res) return c.json({ error: res.error }, 500);
  return c.json({ data: res.rows });
});

/** GET /api/registro-territorial/export/comunas.csv — export del resumen por comuna (patrón cash-sessions) */
registroTerritorialRoutes.get("/export/comunas.csv", async (c) => {
  const supabase = c.get("supabase");
  const res = await fetchResumenComunas(supabase);
  if ("error" in res) return c.json({ error: res.error }, 500);

  const header = "comuna;actores_activos;apiarios;colmenas;trashumantes;alertas_activas";
  const rows = res.rows.map((r) =>
    [r.comuna, r.actores_activos, r.apiarios, r.colmenas, r.trashumantes, r.alertas_activas].join(";")
  );
  const csv = [header, ...rows].join("\n");
  const hoy = new Date().toISOString().slice(0, 10);

  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="resumen-comunas_${hoy}.csv"`,
  });
});

/** GET /api/registro-territorial/declaracion-sag?actor_id= — declaración SAG
 *  pre-llenada (Res. Exenta 8.196/2015: registro anual de apicultores y
 *  apiarios). El actor genera la suya; admin puede generar cualquiera. */
registroTerritorialRoutes.get("/declaracion-sag", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const profileRole = c.get("profileRole");
  const { actor_id } = c.req.query();

  if (!actor_id) {
    return c.json({ error: "Falta actor_id" }, 400);
  }

  // Fail-closed: no-admin solo genera su propia declaración.
  if (profileRole !== "admin") {
    const miActor = await resolveMiActor(supabase, user.id);
    if (!miActor || miActor.id !== actor_id) {
      return c.json({ error: "Solo puedes generar tu propia declaración SAG" }, 403);
    }
  }

  const [actorRes, apiariosRes, externosRes] = await Promise.all([
    supabase
      .from("actores_registro")
      .select(
        "id, rol, nombre_actor, rut, rup, telefono, comuna, region, nivel_acreditacion, estado, created_at",
      )
      .eq("id", actor_id)
      .maybeSingle(),
    supabase
      .from("apiarios_registro")
      .select(
        "nombre, comuna, zona, n_colmenas, categoria, activo, lat_aproximada, lng_aproximada, created_at",
      )
      .eq("actor_id", actor_id)
      .eq("activo", true)
      .order("comuna", { ascending: true }),
    supabase
      .from("apiarios_externos")
      .select(
        "nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, fecha_ingreso, fecha_salida, estado, distancia_verificada, distancia_minima_km, distancia_km_menor",
      )
      .eq("actor_id", actor_id)
      .order("fecha_ingreso", { ascending: false }),
  ]);

  for (const r of [actorRes, apiariosRes, externosRes]) {
    if (r.error) return c.json({ error: r.error.message }, 500);
  }
  if (!actorRes.data) return c.json({ error: "Actor no encontrado" }, 404);

  return c.json({
    data: {
      actor: actorRes.data,
      apiarios: apiariosRes.data ?? [],
      trashumancia: externosRes.data ?? [],
      generado_at: new Date().toISOString(),
    },
  });
});

/** POST /api/registro-territorial/actores — inscribir un nuevo actor */
registroTerritorialRoutes.post(
  "/actores",
  zValidator("json", CreateActorSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");

    // Incluir campos del censo legal (mig 1004) — el form de inscripción los envía.
    const { data, error } = await supabase
      .from("actores_registro")
      .insert({
        user_id: user.id,
        rol: body.rol,
        nombre_actor: body.nombre_actor,
        rut: body.rut ?? null,
        telefono: body.telefono ?? null,
        rup: body.rup ?? null,
        comuna: body.comuna,
        region: body.region,
        practicas_sanitarias: body.practicas_sanitarias ?? null,
        metodo_control_varroa: body.metodo_control_varroa ?? null,
        declaracion_existencia_animal: body.declaracion_existencia_animal ?? false,
        acepta_carta: body.acepta_carta ?? false,
        acepta_politica_datos: body.acepta_politica_datos ?? false,
        completo: body.completo ?? false,
        consentimientos: body.consentimientos ?? {
          mapa_comunitario: false,
          alertas_fitosanitarias: true,
          catalogo_infraestructura: false,
          acopio_cooperativo: false,
        },
        observaciones: body.observaciones ?? null,
      })
      .select()
      .single();

    if (error) {
      // Unique user_id: re-inscripción
      if (error.code === "23505") {
        return c.json(
          { error: "Ya tienes un perfil en el Registro Territorial. Puedes completar el censo legal desde Mi Territorio." },
          409,
        );
      }
      return c.json({ error: error.message }, 500);
    }

    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/actores/:id — actualizar perfil del actor (propio o admin) */
registroTerritorialRoutes.patch(
  "/actores/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", CreateActorSchema.partial()),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    // Fail-closed ownership en BFF (RLS también filtra; evita 500 PGRST116 opaco)
    let query = supabase
      .from("actores_registro")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (profileRole !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) {
      return c.json({ error: "Actor no encontrado o sin permiso" }, 404);
    }

    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// PREDIOS FACILITADORES
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/predios — predios disponibles */
registroTerritorialRoutes.get("/predios", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, actor_id } = c.req.query();

  let query = supabase
    .from("predios_facilitadores")
    .select(`
      id, nombre, comuna, zona,
      lat_aproximada, lng_aproximada,
      superficie_ha, disponible_desde, disponible_hasta,
      condiciones, activo,
      actores_registro!inner(nombre_actor, rol)
    `)
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (comuna) query = query.eq("comuna", comuna);
  if (actor_id) query = query.eq("actor_id", actor_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** POST /api/registro-territorial/predios — registrar predio facilitador */
registroTerritorialRoutes.post(
  "/predios",
  zValidator("json", CreatePredioSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    // Fail-closed: solo admin puede declarar en nombre de otro actor.
    let actorId = body.actor_id;
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json(
          { error: "Debes estar inscrito en el Registro Territorial para registrar predios." },
          400
        );
      }
      actorId = miActor.id;
    }

    const payload: any = {};
    if (actorId !== undefined) payload.actor_id = actorId;
    if (body.nombre !== undefined) payload.nombre = body.nombre;
    if (body.comuna !== undefined) payload.comuna = body.comuna;
    if (body.zona !== undefined) payload.zona = body.zona;
    if (body.lat_aproximada !== undefined) payload.lat_aproximada = body.lat_aproximada;
    if (body.lng_aproximada !== undefined) payload.lng_aproximada = body.lng_aproximada;
    if (body.superficie_ha !== undefined) payload.superficie_ha = body.superficie_ha;
    if (body.disponible_desde !== undefined) payload.disponible_desde = body.disponible_desde;
    if (body.disponible_hasta !== undefined) payload.disponible_hasta = body.disponible_hasta;
    if (body.condiciones !== undefined) payload.condiciones = body.condiciones;

    const { data, error } = await supabase
      .from("predios_facilitadores")
      .insert(payload)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

// ---------------------------------------------------------------------------
// APIARIOS DEL REGISTRO (declaración censal de apiarios propios del actor)
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/apiarios — apiarios visibles para el usuario.
 *  La RLS aplica la escalera de visibilidad: los propios siempre; los de otros
 *  actores solo si consintieron el mapa comunitario. */
registroTerritorialRoutes.get("/apiarios", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, categoria, actor_id } = c.req.query();

  let query = supabase
    .from("apiarios_registro")
    .select(
      "id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones, created_at"
    )
    .order("created_at", { ascending: false });

  if (comuna) query = query.eq("comuna", comuna);
  if (categoria) query = query.eq("categoria", categoria);
  if (actor_id) query = query.eq("actor_id", actor_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** POST /api/registro-territorial/apiarios — declarar un apiario propio */
registroTerritorialRoutes.post(
  "/apiarios",
  zValidator("json", CreateApiarioRegistroSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data: miActor, error: errActor } = await supabase
      .from("actores_registro")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (errActor) return c.json({ error: errActor.message }, 500);
    if (!miActor) {
      return c.json(
        { error: "Debes estar inscrito en el Registro Territorial para declarar apiarios." },
        400
      );
    }

    const { data, error } = await supabase
      .from("apiarios_registro")
      .insert({
        actor_id: miActor.id,
        nombre: body.nombre ?? null,
        comuna: body.comuna,
        zona: body.zona,
        lat_aproximada: body.lat_aproximada ?? null,
        lng_aproximada: body.lng_aproximada ?? null,
        n_colmenas: body.n_colmenas,
        categoria: body.categoria,
        observaciones: body.observaciones ?? null,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/apiarios/:id — actualizar un apiario propio */
registroTerritorialRoutes.patch(
  "/apiarios/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", CreateApiarioRegistroSchema.partial()),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    // Asegurar que el apiario pertenece al actor del usuario (o admin)
    if (profileRole !== "admin") {
      const { data: miActor } = await supabase
        .from("actores_registro")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!miActor) {
        return c.json({ error: "No tienes perfil en el registro territorial" }, 403);
      }
      const { data, error } = await supabase
        .from("apiarios_registro")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("actor_id", miActor.id)
        .select()
        .maybeSingle();
      if (error) return c.json({ error: error.message }, 500);
      if (!data) return c.json({ error: "Apiario no encontrado o sin permiso" }, 404);
      return c.json({ data });
    }

    const { data, error } = await supabase
      .from("apiarios_registro")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Apiario no encontrado" }, 404);

    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// APIARIOS EXTERNOS (TRASHUMANTES)
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/apiarios-externos — declaraciones activas.
 *  La visibilidad comunitaria funciona por RLS; el documento del certificado
 *  sanitario (URL firmada) solo se expone cuando el dueño consulta los suyos
 *  (filtro actor_id). */
registroTerritorialRoutes.get("/apiarios-externos", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { comuna, estado, actor_id } = c.req.query();

  // El documento del certificado solo se expone al dueño de la declaración:
  // si se filtra por un actor ajeno, la consulta cae en la visibilidad
  // comunitaria (sin certificado).
  const { data: miActor } = actor_id
    ? await supabase
        .from("actores_registro")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const includeCert = Boolean(actor_id && miActor && actor_id === miActor.id);

  // Selects estáticos: el parser de tipos de supabase-js no acepta template literals.
  const selectConCert =
    "id, nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, " +
    "lat_aproximada, lng_aproximada, fecha_ingreso, fecha_salida, " +
    "cert_sanitaria_fecha, cert_sanitaria_lab, cert_sanitaria_url, estado, created_at, " +
    "distancia_verificada, distancia_minima_km, distancia_km_menor, distancia_verificada_at, " +
    "actores_registro(nombre_actor, rup)";
  const selectSinCert =
    "id, nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, " +
    "lat_aproximada, lng_aproximada, fecha_ingreso, fecha_salida, " +
    "cert_sanitaria_fecha, cert_sanitaria_lab, estado, created_at, " +
    "distancia_verificada, distancia_minima_km, distancia_km_menor, distancia_verificada_at, " +
    "actores_registro(nombre_actor, rup)";

  let query = supabase
    .from("apiarios_externos")
    .select(includeCert ? selectConCert : selectSinCert)
    .order("fecha_ingreso", { ascending: false });

  // La vista comunal solo expone declarado/activo; el dueño (includeCert) ve
  // todas sus declaraciones, incluidas las suspendidas en revisión por
  // distancia legal (Ley 21.102).
  if (!includeCert) {
    query = query.in("estado", ["declarado", "activo"]);
  }

  if (comuna) query = query.eq("comuna_destino", comuna);
  if (estado) query = query.eq("estado", estado);
  if (actor_id) query = query.eq("actor_id", actor_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  let rows = (data ?? []) as unknown as Array<{
    cert_sanitaria_url?: string | null;
    [key: string]: unknown;
  }>;

  if (includeCert && rows.length > 0) {
    rows = await Promise.all(
      rows.map(async (row) => {
        if (!row.cert_sanitaria_url) return row;
        const { data: signed } = await supabase.storage
          .from("certificados-sanitarios")
          .createSignedUrl(row.cert_sanitaria_url, 3600);
        return {
          ...row,
          // Nunca exponer el path crudo del bucket si la firma falla.
          cert_sanitaria_url: signed?.signedUrl ?? null,
        };
      })
    );
  }

  return c.json({ data: rows });
});

/** POST /api/registro-territorial/apiarios-externos — declarar ingreso trashumante */
registroTerritorialRoutes.post(
  "/apiarios-externos",
  zValidator("json", CreateApiarioExternoSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    // Fail-closed: los no-admin solo declaran con su propio actor.
    let actorId = body.actor_id;
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json(
          { error: "Debes estar inscrito en el Registro Territorial para declarar ingresos trashumantes." },
          400
        );
      }
      actorId = miActor.id;
    }

    // Regla de la ordenanza (Art. 14): certificación sanitaria con antigüedad
    // máxima de 30 días al momento del ingreso.
    if (body.cert_sanitaria_fecha) {
      const dias =
        (new Date(body.fecha_ingreso).getTime() -
          new Date(body.cert_sanitaria_fecha).getTime()) /
        86_400_000;
      if (dias < 0 || dias > 30) {
        return c.json(
          {
            error:
              "La certificación sanitaria debe tener una antigüedad máxima de 30 días al momento del ingreso (Art. 14 de la ordenanza).",
          },
          400
        );
      }
    }

    // Verificación de distancia mínima legal (Ley 21.102): si la declaración
    // trae coordenadas, se mide la distancia al apiario registrado más cercano
    // (admin client: la medición no depende del consentimiento del declarante).
    // Una violación deja la declaración en 'suspendido' para revisión humana —
    // la red no la ve (la RLS comunitaria solo muestra declarado/activo) pero
    // el dueño sí. Las coordenadas son aproximadas (±1 km): la verificación es
    // indicativa, no una fiscalización.
    let distanciaVerificada = false;
    let distanciaMinimaKm: number | null = null;
    let distanciaKmMenor: number | null = null;
    let estado: "declarado" | "suspendido" = "declarado";
    const tieneCoords =
      body.lat_aproximada != null &&
      body.lng_aproximada != null &&
      Number.isFinite(body.lat_aproximada) &&
      Number.isFinite(body.lng_aproximada);

    if (
      body.lat_aproximada != null &&
      body.lng_aproximada != null &&
      Number.isFinite(body.lat_aproximada) &&
      Number.isFinite(body.lng_aproximada)
    ) {
      const umbral = distanciaMinimaLegalKm(body.n_colmenas);
      if (umbral === null) {
        // Carga ≤36 colmenas: la ley no exige distanciamiento.
        distanciaVerificada = true;
      } else {
        const admin = createAdminClient();
        const { data: apiarios, error: apiariosErr } = await admin
          .from("apiarios_registro")
          .select("id, lat_aproximada, lng_aproximada")
          .eq("activo", true)
          .not("lat_aproximada", "is", null)
          .not("lng_aproximada", "is", null)
          .limit(2000);
        if (apiariosErr) return c.json({ error: apiariosErr.message }, 500);

        let menor = Number.POSITIVE_INFINITY;
        for (const a of apiarios ?? []) {
          if (a.lat_aproximada == null || a.lng_aproximada == null) continue;
          const d = haversineKm(
            body.lat_aproximada,
            body.lng_aproximada,
            a.lat_aproximada,
            a.lng_aproximada,
          );
          if (d < menor) menor = d;
        }

        if (Number.isFinite(menor)) {
          distanciaKmMenor = Math.round(menor * 100) / 100;
          distanciaMinimaKm = umbral;
          distanciaVerificada = menor >= umbral;
          if (!distanciaVerificada) {
            estado = "suspendido";
          }
        }
      }
    }

    // fromLoose: distancia_* aún no está en el typegen (migración 20260808030000).
    const { data, error } = await fromLoose(supabase, "apiarios_externos")
      .insert({
        actor_id: actorId,
        predio_id: body.predio_id ?? null,
        nombre: body.nombre ?? null,
        n_colmenas: body.n_colmenas,
        comuna_origen: body.comuna_origen,
        comuna_destino: body.comuna_destino,
        zona_destino: body.zona_destino,
        lat_aproximada: body.lat_aproximada ?? null,
        lng_aproximada: body.lng_aproximada ?? null,
        fecha_ingreso: body.fecha_ingreso,
        fecha_salida: body.fecha_salida ?? null,
        cert_sanitaria_url: body.cert_sanitaria_url ?? null,
        cert_sanitaria_fecha: body.cert_sanitaria_fecha ?? null,
        cert_sanitaria_lab: body.cert_sanitaria_lab ?? null,
        bioseguridad_declarada: body.bioseguridad_declarada ?? null,
        observaciones: body.observaciones ?? null,
        estado,
        distancia_verificada: distanciaVerificada,
        distancia_minima_km: distanciaMinimaKm,
        distancia_km_menor: distanciaKmMenor,
        distancia_verificada_at: tieneCoords ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/apiarios-externos/:id/estado — cambiar estado */
registroTerritorialRoutes.patch(
  "/apiarios-externos/:id/estado",
  zValidator("json", z.object({
    estado: z.enum(["declarado", "activo", "retirado", "suspendido"]),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.param();
    const { estado } = c.req.valid("json");

    // Fail-closed (mismo idiom que PATCH /actores/:id): no-admin solo toca
    // recursos propios; recurso ajeno → 404 sin revelar existencia.
    let query = supabase
      .from("apiarios_externos")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json(
          { error: "Debes estar inscrito en el Registro Territorial." },
          400
        );
      }
      query = query.eq("actor_id", miActor.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) {
      return c.json({ error: "Recurso no encontrado o sin permiso" }, 404);
    }

    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// ALERTAS FITOSANITARIAS
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/alertas — alertas activas */
registroTerritorialRoutes.get("/alertas", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, lat, lng, radio } = c.req.query();

  // Si vienen coordenadas, usar RPC de radio
  if (lat && lng) {
    const { data, error } = await supabase.rpc("alertas_en_radio", {
      p_lat: parseFloat(lat),
      p_lng: parseFloat(lng),
      p_radio: radio ? parseFloat(radio) : 5,
    });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }

  let query = supabase
    .from("alertas_fitosanitarias")
    .select(`
      id, comuna, zona,
      lat_aproximada, lng_aproximada, radio_km,
      producto, tipo_producto, metodo_aplicacion,
      fecha_programada, periodo_carencia_horas,
      confirmaciones, estado, observaciones,
      created_at,
      actores_registro!inner(nombre_actor, rol)
    `)
    .eq("estado", "activa")
    .order("fecha_programada", { ascending: true });

  if (comuna) query = query.eq("comuna", comuna);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** POST /api/registro-territorial/alertas — emitir alerta fitosanitaria */
registroTerritorialRoutes.post(
  "/alertas",
  zValidator("json", CreateAlertaSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    // Fail-closed: los no-admin solo emiten alertas con su propio actor.
    let actorId = body.actor_id;
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json(
          { error: "Debes estar inscrito en el Registro Territorial para emitir alertas fitosanitarias." },
          400
        );
      }
      actorId = miActor.id;
    }

    const payload: any = {};
    if (actorId !== undefined) payload.actor_id = actorId;
    if (body.comuna !== undefined) payload.comuna = body.comuna;
    if (body.zona !== undefined) payload.zona = body.zona;
    if (body.lat_aproximada !== undefined) payload.lat_aproximada = body.lat_aproximada;
    if (body.lng_aproximada !== undefined) payload.lng_aproximada = body.lng_aproximada;
    if (body.radio_km !== undefined) payload.radio_km = body.radio_km;
    if (body.producto !== undefined) payload.producto = body.producto;
    if (body.tipo_producto !== undefined) payload.tipo_producto = body.tipo_producto;
    if (body.metodo_aplicacion !== undefined) payload.metodo_aplicacion = body.metodo_aplicacion;
    if (body.fecha_programada !== undefined) payload.fecha_programada = body.fecha_programada;
    if (body.periodo_carencia_horas !== undefined) payload.periodo_carencia_horas = body.periodo_carencia_horas;
    if (body.observaciones !== undefined) payload.observaciones = body.observaciones;

    const { data, error } = await supabase
      .from("alertas_fitosanitarias")
      .insert(payload)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

/** POST /api/registro-territorial/alertas/:id/confirmar — confirmar recepción */
registroTerritorialRoutes.post(
  "/alertas/:id/confirmar",
  zValidator("json", z.object({ actor_id: z.string().uuid() })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.param();
    const { actor_id } = c.req.valid("json");

    // Fail-closed: los no-admin solo confirman con su propio actor (mata el
    // hack del AlertasPanel que confirmaba con actores[0].id).
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor || miActor.id !== actor_id) {
        return c.json({ error: "Solo puedes confirmar alertas con tu propio actor" }, 403);
      }
    }

    // Obtener confirmaciones actuales
    const { data: alerta, error: fetchError } = await supabase
      .from("alertas_fitosanitarias")
      .select("confirmaciones")
      .eq("id", id)
      .single();

    if (fetchError || !alerta) return c.json({ error: "Alerta no encontrada" }, 404);

    const confirmaciones = Array.isArray(alerta.confirmaciones)
      ? alerta.confirmaciones
      : [];

    const yaConfirmado = confirmaciones.some(
      (c: unknown) =>
        typeof c === "object" && c !== null && "actor_id" in c &&
        (c as { actor_id: string }).actor_id === actor_id
    );

    if (yaConfirmado) {
      return c.json({ message: "Ya confirmado previamente" });
    }

    const nuevasConfirmaciones = [
      ...confirmaciones,
      { actor_id, confirmado_at: new Date().toISOString() },
    ];

    const { data, error } = await supabase
      .from("alertas_fitosanitarias")
      .update({
        confirmaciones: nuevasConfirmaciones,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data });
  }
);

/** PATCH /api/registro-territorial/alertas/:id/estado — marcar ejecutada/cancelada */
registroTerritorialRoutes.patch(
  "/alertas/:id/estado",
  zValidator("json", z.object({
    estado: z.enum(["ejecutada", "cancelada"]),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.param();
    const { estado } = c.req.valid("json");

    // Fail-closed (mismo idiom que PATCH /actores/:id): no-admin solo toca
    // recursos propios; recurso ajeno → 404 sin revelar existencia.
    let query = supabase
      .from("alertas_fitosanitarias")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json(
          { error: "Debes estar inscrito en el Registro Territorial." },
          400
        );
      }
      query = query.eq("actor_id", miActor.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) {
      return c.json({ error: "Recurso no encontrado o sin permiso" }, 404);
    }

    return c.json({ data });
  }
);
