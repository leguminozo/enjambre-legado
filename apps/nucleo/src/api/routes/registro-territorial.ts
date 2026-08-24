import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@enjambre/database/database.types";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { validarRUT } from "@enjambre/contable";
import { createAdminClient } from "@enjambre/auth/browser";
import { logSecurityEvent } from "@enjambre/auth/security-events";
import { haversineKm } from "@/lib/hive-state";
import { distanciaMinimaLegalKm } from "@/lib/distancias-legales";
import { enqueueTransactionalNotification } from "@/lib/notifications/enqueue-transactional";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";
import {
  CENSO_WRITE_LOCK_CODE,
  CENSO_WRITE_LOCK_MESSAGE,
  isApiActivityRol,
  territorialWritesUnlocked,
} from "@/lib/territorial-rol";
import { resolveTerritorialWriteGate } from "@/lib/territorial-write-gate";

export const registroTerritorialRoutes = new Hono<{ Variables: AppVariables }>();

// UI: /territorio y /registro-territorial solo territorial|admin (ROUTE_ROLE_GUARDS).
registroTerritorialRoutes.use(
  "*",
  authMiddleware,
  requireProfileRole("territorial", "admin"),
);

/**
 * Gate de escrituras centralizado (lib/territorial-write-gate): oleada 2a +
 * carve-outs 2b por sub-rol + acuse de alertas. Testeado en
 * lib/__tests__/territorial-write-gate.test.ts.
 */
registroTerritorialRoutes.use("*", async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const profileRole = c.get("profileRole");
  if (profileRole === "admin") return next();

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

  const gate = resolveTerritorialWriteGate(
    method,
    new URL(c.req.url).pathname,
    rol,
  );
  if (!gate.allow) {
    return c.json(
      { code: gate.code, message: gate.message },
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
  rut: z.string().nullable().optional().refine((rut) => !rut || validarRUT(rut), {
    message: "RUT inválido",
  }),
  telefono: z.string().max(30).nullable().optional(),
  rup: z.string().nullable().optional(),
  comuna: z.string().min(2).max(100),
  region: z.string().default("Los Lagos"),
  practicas_sanitarias: z.string().max(2000).nullable().optional(),
  metodo_control_varroa: z.string().max(500).nullable().optional(),
  declaracion_existencia_animal: z.boolean().optional(),
  acepta_carta: z.boolean().optional(),
  acepta_politica_datos: z.boolean().optional(),
  consentimientos: ConsentimientosSchema.optional(),
  observaciones: z.string().max(1000).nullable().optional(),
}).strict();

const CreatePredioSchema = z.object({
  actor_id: z.string().uuid(),
  nombre: z.string().max(200).nullable().optional(),
  comuna: z.string().min(2).max(100),
  zona: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).nullable().optional(),
  lng_aproximada: z.number().min(-180).max(180).nullable().optional(),
  superficie_ha: z.number().positive().nullable().optional(),
  disponible_desde: z.string().date().nullable().optional(),
  disponible_hasta: z.string().date().nullable().optional(),
  condiciones: z.string().max(2000).nullable().optional(),
}).strict();

const CreateApiarioExternoSchema = z.object({
  actor_id: z.string().uuid(),
  predio_id: z.string().uuid().nullable().optional(),
  // Cruce bidireccional con la herramienta operativa (mig 20260822010000):
  // la declaración puede nacer ligada al apiario operativo que se mueve.
  apiario_operativo_id: z.string().uuid().nullable().optional(),
  nombre: z.string().max(200).nullable().optional(),
  n_colmenas: z.number().int().positive(),
  comuna_origen: z.string().min(2).max(100),
  comuna_destino: z.string().min(2).max(100),
  zona_destino: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).nullable().optional(),
  lng_aproximada: z.number().min(-180).max(180).nullable().optional(),
  fecha_ingreso: z.string().date(),
  fecha_salida: z.string().date().nullable().optional(),
  cert_sanitaria_url: z.string().max(500).nullable().optional(), // path del PDF en storage o URL
  cert_sanitaria_fecha: z.string().date().nullable().optional(),
  cert_sanitaria_lab: z.string().max(200).nullable().optional(),
  bioseguridad_declarada: z.string().max(2000).nullable().optional(),
  observaciones: z.string().max(1000).nullable().optional(),
}).strict();

const CategoriaApiarioSchema = z.enum([
  "produccion",
  "polinizacion",
  "seleccion_cria",
  "otro",
]);

const CreateApiarioRegistroSchema = z.object({
  nombre: z.string().max(200).nullable().optional(),
  comuna: z.string().min(2).max(100),
  zona: z.string().min(2).max(200),
  lat_aproximada: z.number().min(-90).max(90).nullable().optional(),
  lng_aproximada: z.number().min(-180).max(180).nullable().optional(),
  n_colmenas: z.number().int().positive(),
  categoria: CategoriaApiarioSchema.default("produccion"),
  activo: z.boolean().optional(),
  observaciones: z.string().max(1000).nullable().optional(),
  predio_id: z.string().uuid().nullable().optional(),
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
): Promise<{ id: string; completo: boolean } | null> {
  const { data, error } = await supabase
    .from("actores_registro")
    .select("id, completo")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { id: data.id, completo: Boolean(data.completo) };
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

/** GET /api/registro-territorial/mi-historial-sanitario
 *  Últimos registros reales de varroa del usuario (cruce vivo → ley): permite
 *  pre-llenar la declaración legal del censo con lo efectivamente medido. */
registroTerritorialRoutes.get("/mi-historial-sanitario", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("varroa_records")
    .select("date, level, method, colmenas!inner(id, name, user_id)")
    .eq("colmenas.user_id", user.id)
    .order("date", { ascending: false })
    .limit(12);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data: data ?? [] });
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
        "id, nombre, comuna, zona, n_colmenas, categoria, activo, lat_aproximada, lng_aproximada, created_at",
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

  // Conciliación ley vs vivo: para cada apiario del registro con origen
  // operativo, contar sus colmenas reales (columnas puente 20260822000000).
  const { data: origenes } = await fromLoose(supabase, "apiarios_registro")
    .select("id, apiario_origen_id")
    .eq("actor_id", actor_id)
    .not("apiario_origen_id", "is", null);
  const registroAOrigen = new Map<string, string>();
  for (const o of (origenes ?? []) as Array<{ id: string; apiario_origen_id: string }>) {
    registroAOrigen.set(o.id, o.apiario_origen_id);
  }
  const vivosPorOrigen = new Map<string, number>();
  const origenIds = [...new Set(registroAOrigen.values())];
  if (origenIds.length > 0) {
    const { data: cols } = await fromLoose(supabase, "colmenas")
      .select("apiario_id")
      .in("apiario_id", origenIds);
    for (const col of (cols ?? []) as Array<{ apiario_id: string | null }>) {
      if (!col.apiario_id) continue;
      vivosPorOrigen.set(col.apiario_id, (vivosPorOrigen.get(col.apiario_id) ?? 0) + 1);
    }
  }

  const apiariosConVivo = (apiariosRes.data ?? []).map((a) => {
    const origenId = registroAOrigen.get((a as { id: string }).id);
    return {
      ...a,
      n_colmenas_vivo: origenId ? (vivosPorOrigen.get(origenId) ?? 0) : null,
    };
  });

  return c.json({
    data: {
      actor: actorRes.data,
      apiarios: apiariosConVivo,
      trashumancia: externosRes.data ?? [],
      generado_at: new Date().toISOString(),
    },
  });
});

/** GET /api/registro-territorial/declaraciones-sag — histórico del actor */
registroTerritorialRoutes.get("/declaraciones-sag", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const profileRole = c.get("profileRole");
  const { actor_id } = c.req.query();

  let query = supabase
    .from("sag_declaraciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (profileRole !== "admin") {
    const miActor = await resolveMiActor(supabase, user.id);
    if (!miActor) return c.json({ data: [] });
    query = query.eq("actor_id", actor_id && actor_id === miActor.id ? actor_id : miActor.id);
  } else if (actor_id) {
    query = query.eq("actor_id", actor_id);
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/registro-territorial/declaraciones-sag — registrar presentación
 *  El PDF es desechable; este guardado deja rastro de la declaración emitida. */
registroTerritorialRoutes.post(
  "/declaraciones-sag",
  zValidator("json", z.object({
    actor_id: z.string().uuid(),
    periodo: z.string().min(4).max(30),
    n_colmenas_declaradas: z.number().int().min(0),
    n_colmenas_vivas: z.number().int().min(0),
    estado: z.enum(["borrador", "presentada", "rechazada"]).default("presentada"),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor || miActor.id !== body.actor_id) {
        return c.json({ error: "Solo puedes registrar tu propia declaración SAG" }, 403);
      }
    }

    const { data, error } = await supabase
      .from("sag_declaraciones")
      .insert({
        actor_id: body.actor_id,
        user_id: user.id,
        periodo: body.periodo,
        n_colmenas_declaradas: body.n_colmenas_declaradas,
        n_colmenas_vivas: body.n_colmenas_vivas,
        estado: body.estado,
        presentado_en: body.estado === "presentada" ? new Date().toISOString() : null,
      })
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/declaraciones-sag/:id — actualizar estado */
registroTerritorialRoutes.patch(
  "/declaraciones-sag/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", z.object({
    estado: z.enum(["borrador", "presentada", "rechazada"]),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");
    const { estado } = c.req.valid("json");

    let query = supabase
      .from("sag_declaraciones")
      .update({
        estado,
        presentado_en: estado === "presentada" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (profileRole !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Declaración no encontrada o sin permiso" }, 404);
    return c.json({ data });
  }
);

/** POST /api/registro-territorial/actores/:id/recalcular-credencial
 *  La credencial se DERIVA de actividad documentada (RPC evaluar_nivel_acreditacion):
 *  base → censo completo · trazable → apiarios activos + cosechas · comprometido → + mapa. */
registroTerritorialRoutes.post(
  "/actores/:id/recalcular-credencial",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");

    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor || miActor.id !== id) {
        return c.json({ error: "Solo puedes recalcular tu propia credencial" }, 403);
      }
    }

    const { data: nivel, error: rpcErr } = await rpcLoose(
      supabase,
      "evaluar_nivel_acreditacion",
      { p_actor_id: id },
    );
    if (rpcErr) return c.json({ error: rpcErr.message }, 500);

    const { data, error } = await supabase
      .from("actores_registro")
      .update({ nivel_acreditacion: nivel, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, nivel_acreditacion, completo, consentimientos")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Actor no encontrado o sin permiso" }, 404);

    return c.json({ data });
  }
);

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
    // `completo` no viaja aquí: solo POST /actores/:id/completar-censo (service_role).
    // `rol` tampoco: el sub-rol es la llave del gate de escrituras — cambiarlo
    // uno mismo sería escalación. Solo admin lo muta (vía admin-identidades).
    const updates = { ...body };
    if (profileRole !== "admin") {
      delete updates.rol;
    }
    let query = supabase
      .from("actores_registro")
      .update({ ...updates, updated_at: new Date().toISOString() })
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

/** POST /api/registro-territorial/actores/:id/completar-censo — único camino a completo=true */
registroTerritorialRoutes.post(
  "/actores/:id/completar-censo",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const { id } = c.req.valid("param");
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const admin = createAdminClient();

    let actorQuery = admin.from("actores_registro").select("*").eq("id", id);
    if (profileRole !== "admin") {
      actorQuery = actorQuery.eq("user_id", user.id);
    }
    const { data: actor, error: actorErr } = await actorQuery.maybeSingle();
    if (actorErr) return c.json({ error: actorErr.message }, 500);
    if (!actor) {
      return c.json({ error: "Actor no encontrado o sin permiso" }, 404);
    }

    const rut = typeof actor.rut === "string" ? actor.rut : "";
    const telefono = typeof actor.telefono === "string" ? actor.telefono.trim() : "";
    if (!validarRUT(rut) || telefono.length < 6 || !actor.declaracion_existencia_animal) {
      return c.json(
        { code: "censo_identidad_incompleta", error: "Falta identidad legal (RUT, teléfono, declaración SAG)." },
        400,
      );
    }
    if (!actor.acepta_carta || !actor.acepta_politica_datos) {
      return c.json(
        { code: "censo_consentimiento_incompleto", error: "Debes aceptar la Carta Constitutiva y la política de datos." },
        400,
      );
    }

    // Exigencias apícolas solo para api_*: exigir apiarios/varroa a un
    // agricultor o propietario era un deadlock — jamás podría completar.
    if (isApiActivityRol(actor.rol)) {
      const practicas =
        typeof actor.practicas_sanitarias === "string" ? actor.practicas_sanitarias.trim() : "";
      const varroa =
        typeof actor.metodo_control_varroa === "string" ? actor.metodo_control_varroa.trim() : "";
      if (practicas.length < 10 || varroa.length < 3) {
        return c.json(
          { code: "censo_sanidad_incompleta", error: "Faltan prácticas sanitarias o método de varroa." },
          400,
        );
      }

      const { count, error: countErr } = await admin
        .from("apiarios_registro")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", id)
        .eq("activo", true);
      if (countErr) return c.json({ error: countErr.message }, 500);
      if (!count || count < 1) {
        return c.json(
          { code: "censo_sin_apiarios", error: "Declara al menos un apiario activo para completar el censo." },
          400,
        );
      }
    }

    const { data, error } = await admin
      .from("actores_registro")
      .update({ completo: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);

    // Downstream del censo completo (auditoría entrelazado 2026-08-23):
    // 1) Credencial formal "base" (antes era copy estático; ahora se sella).
    // 2) Notificación in-app (campana) para cerrar el ciclo visiblemente.
    const { error: credErr } = await admin
      .from("actores_registro")
      .update({ nivel_acreditacion: "base", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("nivel_acreditacion", "base");
    if (credErr) {
      console.error("completar-censo: no se pudo sellar credencial", credErr.message);
    }

    const userProfileId =
      typeof actor.user_id === "string" ? actor.user_id : user.id;
    void admin
      .from("notification_events")
      .insert({
        channel: "in_app",
        recipient: userProfileId,
        recipient_user_id: userProfileId,
        subject: "Censo territorial completo",
        body: "Tu inscripción en el Registro Territorial está completa. Ya puedes declarar trashumancia, predios y publicar tus apiarios.",
        status: "sent",
        created_by: user.id,
      })
      .then(undefined, () => undefined);

    // Auditoría de gobernanza: evento de seguridad (tabla security_events,
    // RLS admin lee, authenticated inserta). El client de sesión (JWT del
    // usuario) resuelve userId correctamente.
    void logSecurityEvent(supabase, {
      eventType: "censo_completado",
      email:
        typeof actor.email === "string" && actor.email
          ? actor.email
          : "actor@" + id.slice(0, 8),
      userId: userProfileId,
      appSource: "nucleo-bff",
      details: { actor_id: id, rol: actor.rol ?? null },
    });

    return c.json({ data });
  },
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

  // Enriquecer: nº de apiarios residentes acogidos por predio (entrelazado
  // predios ↔ apiarios_registro, auditoría 2026-08-23).
  const conConteo = await Promise.all(
    (data ?? []).map(async (p) => {
      const { count } = await fromLoose(supabase, "apiarios_registro")
        .select("id", { count: "exact", head: true })
        .eq("predio_id", (p as { id: string }).id)
        .eq("activo", true);
      return { ...p, apiarios_acogidos: count ?? 0 };
    }),
  );

  return c.json({ data: conConteo });
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
      if (!territorialWritesUnlocked(miActor.completo)) {
        return c.json(
          { code: CENSO_WRITE_LOCK_CODE, error: CENSO_WRITE_LOCK_MESSAGE },
          403,
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
        predio_id: body.predio_id ?? null,
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
// CRUCE BIDIRECCIONAL APIARIO OPERATIVO <-> REGISTRO TERRITORIAL
// ---------------------------------------------------------------------------

/**
 * Degrada coordenadas exactas a ~1 km (2 decimales) para no exponer la
 * ubicación real de las colmenas en el mapa comunitario del registro.
 */
function degradarCoordenadas(
  lat: number | null | undefined,
  lng: number | null | undefined,
): { lat_aproximada: number | null; lng_aproximada: number | null } {
  const finita = (v: number | null | undefined) =>
    typeof v === "number" && Number.isFinite(v);
  if (!finita(lat) || !finita(lng)) {
    return { lat_aproximada: null, lng_aproximada: null };
  }
  return {
    lat_aproximada: Math.round((lat as number) * 100) / 100,
    lng_aproximada: Math.round((lng as number) * 100) / 100,
  };
}

const SyncApiarioOperativoSchema = z
  .object({
    apiario_id: z.string().uuid(),
    comuna: z.string().min(2).max(100),
    zona: z.string().min(2).max(200),
    categoria: CategoriaApiarioSchema.default("produccion"),
    lat_aproximada: z.number().min(-90).max(90).nullable().optional(),
    lng_aproximada: z.number().min(-180).max(180).nullable().optional(),
    predio_id: z.string().uuid().nullable().optional(),
  })
  .strict();

/** POST /api/registro-territorial/apiarios/sync-desde-operativo
 *  Publica (o actualiza) un apiario operativo en el Registro Territorial.
 *  El nº de colmenas se cuenta en vivo; las coordenadas se degradan a ~1 km. */
registroTerritorialRoutes.post(
  "/apiarios/sync-desde-operativo",
  zValidator("json", SyncApiarioOperativoSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    const miActor = await resolveMiActor(supabase, user.id);
    if (!miActor) {
      return c.json(
        { error: "Debes estar inscrito en el Registro Territorial para publicar apiarios." },
        400,
      );
    }
    if (profileRole !== "admin" && !territorialWritesUnlocked(miActor.completo)) {
      return c.json(
        { code: CENSO_WRITE_LOCK_CODE, error: CENSO_WRITE_LOCK_MESSAGE },
        403,
      );
    }

    // Fail-closed: el apiario operativo debe pertenecer al usuario.
    const { data: apiario, error: apiarioErr } = await fromLoose(supabase, "apiarios")
      .select("id, name, lat, lng, apiario_registro_id")
      .or(`created_by.eq.${user.id},user_id.eq.${user.id}`)
      .eq("id", body.apiario_id)
      .maybeSingle();
    if (apiarioErr) return c.json({ error: apiarioErr.message }, 500);
    if (!apiario) {
      return c.json({ error: "Apiario no encontrado o sin permiso" }, 404);
    }

    // Conteo vivo de colmenas.
    const { count, error: countErr } = await fromLoose(supabase, "colmenas")
      .select("id", { count: "exact", head: true })
      .eq("apiario_id", body.apiario_id);
    if (countErr) return c.json({ error: countErr.message }, 500);
    const nColmenas = count ?? 0;
    if (nColmenas < 1) {
      return c.json(
        { error: "El apiario no tiene colmenas registradas para publicar en el Registro." },
        400,
      );
    }

    const degradadas = degradarCoordenadas(body.lat_aproximada, body.lng_aproximada);

    // predio_id opcional: debe pertenecer al actor (fail-closed, sin revelar existencia).
    let predioResuelto: string | null = null;
    if (body.predio_id) {
      const { data: predio, error: predioErr } = await fromLoose(supabase, "predios_facilitadores")
        .select("id")
        .eq("id", body.predio_id)
        .eq("actor_id", miActor.id)
        .maybeSingle();
      if (predioErr) return c.json({ error: predioErr.message }, 500);
      if (!predio) {
        return c.json({ error: "Predio no encontrado o sin permiso" }, 404);
      }
      predioResuelto = predio.id;
    }

    // Resolver fila de registro destino: la ya enlazada o la previa por origen.
    let registroId: string | null =
      (apiario as { apiario_registro_id?: string | null }).apiario_registro_id ?? null;
    if (!registroId) {
      const { data: prev } = await fromLoose(supabase, "apiarios_registro")
        .select("id")
        .eq("actor_id", miActor.id)
        .eq("apiario_origen_id", body.apiario_id)
        .maybeSingle();
      registroId = (prev as { id?: string } | null)?.id ?? null;
    }

    const payload = {
      actor_id: miActor.id,
      apiario_origen_id: body.apiario_id,
      nombre: (apiario as { name?: string | null }).name ?? null,
      comuna: body.comuna,
      zona: body.zona,
      n_colmenas: nColmenas,
      categoria: body.categoria,
      lat_aproximada: degradadas.lat_aproximada,
      lng_aproximada: degradadas.lng_aproximada,
      predio_id: predioResuelto,
      activo: true,
      sincronizado_en: new Date().toISOString(),
    };

    let registro: unknown;
    let registroErr: { message: string } | null = null;
    if (registroId) {
      const { data, error } = await fromLoose(supabase, "apiarios_registro")
        .update(payload)
        .eq("id", registroId)
        .eq("actor_id", miActor.id)
        .select()
        .maybeSingle();
      registro = data;
      registroErr = error as { message: string } | null;
    } else {
      const { data, error } = await fromLoose(supabase, "apiarios_registro")
        .insert(payload)
        .select()
        .single();
      if ((error as { code?: string } | null)?.code === "23505") {
        // Carrera perdida ante request concurrente (índice único
        // apiarios_registro_origen_unico_idx): devolvemos su fila.
        const { data: ganador } = await fromLoose(supabase, "apiarios_registro")
          .select("*")
          .eq("actor_id", miActor.id)
          .eq("apiario_origen_id", body.apiario_id)
          .maybeSingle();
        if (ganador) return c.json({ data: ganador }, 200);
      }
      registro = data;
      registroErr = error as { message: string } | null;
    }
    if (registroErr) return c.json({ error: registroErr.message }, 500);

    // Back-link: el operativo conoce su declaración en el Registro.
    const nuevoRegistroId = (registro as { id: string }).id;
    const { error: linkErr } = await fromLoose(supabase, "apiarios")
      .update({ apiario_registro_id: nuevoRegistroId })
      .eq("id", body.apiario_id);
    if (linkErr) return c.json({ error: linkErr.message }, 500);

    return c.json({ data: registro }, registroId ? 200 : 201);
  },
);

/** GET /api/registro-territorial/apiarios/estado-operativo
 *  Mapa de apiarios operativos ya declarados (para badge + desfase en /colmenas). */
registroTerritorialRoutes.get("/apiarios/estado-operativo", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const miActor = await resolveMiActor(supabase, user.id);
  if (!miActor) return c.json({ data: [] });

  const { data, error } = await fromLoose(supabase, "apiarios_registro")
    .select(
      "id, apiario_origen_id, n_colmenas, sincronizado_en, activo, nombre, comuna, zona, categoria",
    )
    .eq("actor_id", miActor.id)
    .not("apiario_origen_id", "is", null);
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data: data ?? [] });
});

/** GET /api/registro-territorial/apiarios/operativos-pendientes
 *  Apiarios operativos del usuario aún no declarados (importar en /territorio). */
registroTerritorialRoutes.get("/apiarios/operativos-pendientes", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const miActor = await resolveMiActor(supabase, user.id);
  if (!miActor) return c.json({ data: [] });

  const { data, error } = await fromLoose(supabase, "apiarios")
    .select("id, name, lat, lng, apiario_registro_id")
    .or(`created_by.eq.${user.id},user_id.eq.${user.id}`)
    .is("apiario_registro_id", null)
    .order("name", { ascending: true });
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data: data ?? [] });
});

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
    "apiario_operativo_id, " +
    "actores_registro(nombre_actor, rup)";
  const selectSinCert =
    "id, nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, " +
    "lat_aproximada, lng_aproximada, fecha_ingreso, fecha_salida, " +
    "cert_sanitaria_fecha, cert_sanitaria_lab, estado, created_at, " +
    "distancia_verificada, distancia_minima_km, distancia_km_menor, distancia_verificada_at, " +
    "apiario_operativo_id, " +
    "actores_registro(nombre_actor, rup)";

  let query = supabase
    .from("apiarios_externos")
    .select(includeCert ? selectConCert : selectSinCert)
    .order("fecha_ingreso", { ascending: false });

  // La vista comunal solo expone declarado/activo; el dueño (includeCert) ve
  // todas sus declaraciones, incluidas las suspendidas en revisión por
  // distancia (Ley 21.489 — bandas de apoyo, no fiscalización).
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
      if (!territorialWritesUnlocked(miActor.completo)) {
        return c.json(
          { code: CENSO_WRITE_LOCK_CODE, error: CENSO_WRITE_LOCK_MESSAGE },
          403,
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

    // Apoyo a distancias (Ley 21.489 / Dto. 21): si hay coords aproximadas,
    // se mide Haversine al apiario registrado más cercano. Una posible
    // infracción deja la declaración en 'suspendido' para revisión humana.
    // No es fiscalización ni resolución SAG.
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
        apiario_operativo_id: body.apiario_operativo_id ?? null,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    // Trashumancia → calendario: el ingreso declarado genera tarea de la
    // categoría transhumancia (la categoría existía sin productor).
    if (data) {
      const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const fechaIngreso = body.fecha_ingreso ? new Date(body.fecha_ingreso) : new Date();
      void fromLoose(supabase, "calendario_tasks")
        .insert({
          user_id: user.id,
          title: `Ingreso trashumante: ${body.comuna_origen} → ${body.comuna_destino}${body.n_colmenas ? ` (${body.n_colmenas} colmenas)` : ""}`,
          month: MESES[fechaIngreso.getMonth()],
          week: Math.min(4, Math.ceil(fechaIngreso.getDate() / 7)),
          category: "transhumancia",
          priority: "media",
          done: false,
        })
        .then(undefined, () => undefined);
    }

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

/** POST /api/registro-territorial/apiarios-externos/:id/materializar
 *  Cruce ley → vivo: convierte una declaración trashumante en apiario
 *  operativo del apicultor y enlaza ambos lados. Idempotente. */
registroTerritorialRoutes.post(
  "/apiarios-externos/:id/materializar",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");

    let query = fromLoose(supabase, "apiarios_externos")
      .select(
        "id, nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, " +
          "lat_aproximada, lng_aproximada, apiario_operativo_id",
      )
      .eq("id", id);
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json({ error: "Debes estar inscrito en el Registro Territorial." }, 400);
      }
      query = query.eq("actor_id", miActor.id);
    }
    const { data: externo, error: externoErr } = await query.maybeSingle();
    if (externoErr) return c.json({ error: externoErr.message }, 500);
    if (!externo) {
      return c.json({ error: "Declaración no encontrada o sin permiso" }, 404);
    }

    const row = externo as unknown as Record<string, unknown>;
    const yaMaterializado = row.apiario_operativo_id as string | null | undefined;
    if (yaMaterializado) {
      return c.json({ data: { apiario_operativo_id: yaMaterializado }, materializado: true });
    }

    // El apiario operativo nace en el destino declarado; el apicultor puede
    // refinar nombre/GPS después desde su herramienta.
    const { data: nuevoApiario, error: apiarioErr } = await fromLoose(supabase, "apiarios")
      .insert({
        name:
          (row.nombre as string | null) ??
          `${row.comuna_destino} — ${row.zona_destino}`,
        lat: (row.lat_aproximada as number | null) ?? 0,
        lng: (row.lng_aproximada as number | null) ?? 0,
        sector: row.zona_destino as string,
        health: "optimal",
        details: `Materializado desde declaración trashumante (${row.comuna_origen ?? "?"} → ${row.comuna_destino}).`,
        user_id: user.id,
      })
      .select("id")
      .single();
    if (apiarioErr) return c.json({ error: apiarioErr.message }, 500);
    const nuevoId = (nuevoApiario as unknown as { id: string }).id;

    const { error: linkExtErr } = await fromLoose(supabase, "apiarios_externos")
      .update({ apiario_operativo_id: nuevoId, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (linkExtErr) return c.json({ error: linkExtErr.message }, 500);

    const { error: linkOpErr } = await fromLoose(supabase, "apiarios")
      .update({ origen_externo_id: id })
      .eq("id", nuevoId);
    if (linkOpErr) return c.json({ error: linkOpErr.message }, 500);

    return c.json({ data: { apiario_operativo_id: nuevoId } }, 201);
  },
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
      id, actor_id, comuna, zona,
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
      if (!territorialWritesUnlocked(miActor.completo)) {
        return c.json(
          { code: CENSO_WRITE_LOCK_CODE, error: CENSO_WRITE_LOCK_MESSAGE },
          403,
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

    // Aviso comunitario: in_app + email inmediato a actores activos de la misma
    // comuna con consentimiento de alertas. Fire-and-forget: emitir la alerta no
    // debe fallar por las notificaciones. Sin coordenadas ni datos de otros
    // actores en el texto (Ley 19.628). Dedupe por (alerta, actor).
    void (async () => {
      try {
        const admin = createAdminClient();
        const { data: actores } = await admin
          .from("actores_registro")
          .select("id, user_id, email, consentimientos")
          .eq("estado", "activo")
          .eq("comuna", data.comuna);

        const alerta = data as unknown as {
          id: string;
          comuna?: string | null;
          zona?: string | null;
          producto?: string | null;
          tipo_producto?: string | null;
          fecha_programada?: string | null;
          radio_km?: number | null;
          periodo_carencia_horas?: number | null;
        };

        for (const actor of actores ?? []) {
          const consent =
            actor.consentimientos && typeof actor.consentimientos === "object"
              ? (actor.consentimientos as Record<string, unknown>)
              : null;
          if (consent && consent.alertas_fitosanitarias === false) continue;
          if (typeof actor.email !== "string" || !actor.email) continue;

          const fecha = alerta.fecha_programada
            ? new Intl.DateTimeFormat("es-CL", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(alerta.fecha_programada))
            : "próximamente";
          const sector = [alerta.zona, alerta.comuna].filter(Boolean).join(" · ");
          const producto = alerta.producto || alerta.tipo_producto || "fitosanitario";
          const radio =
            typeof alerta.radio_km === "number" && alerta.radio_km > 0
              ? ` dentro de un radio de ${alerta.radio_km} km`
              : "";
          const carencia =
            typeof alerta.periodo_carencia_horas === "number" &&
            alerta.periodo_carencia_horas > 0
              ? `\nPeriodo de carencia: ${alerta.periodo_carencia_horas} horas.`
              : "";

          await enqueueTransactionalNotification(admin, {
            dedupeKey: `alerta_fitosanitaria:${alerta.id}:${actor.id}`,
            source: "alerta_fitosanitaria",
            email: actor.email,
            userId: typeof actor.user_id === "string" ? actor.user_id : undefined,
            subject: `Aviso fitosanitario en ${sector || "tu zona de pecoreo"}`,
            body: [
              `Se programó una aplicación de ${producto}${radio} en ${sector || "tu zona de pecoreo"}.`,
              `Fecha programada: ${fecha}.`,
              "Mantén tus colmenas resguardadas y confirma recepción desde tu panel territorial.",
              carencia,
            ].join("\n"),
            category: "territorio",
            immediate: true,
            templateVars: {
              sector: sector || "tu zona de pecoreo",
              producto,
              radio,
              fecha,
              carencia: carencia.trim(),
            },
          });
        }
      } catch (notifErr) {
        console.error(
          "[registro-territorial] alerta fitosanitaria notification failed:",
          notifErr instanceof Error ? notifErr.message : notifErr,
        );
      }
    })();

    return c.json({ data }, 201);
  }
);

/** POST /api/registro-territorial/alertas/:id/confirmar — confirmar recepción */
registroTerritorialRoutes.post(
  "/alertas/:id/confirmar",
  zValidator("json", z.object({
    actor_id: z.string().uuid(),
    // Acuse por apiario concreto (no solo por actor): qué yardas fueron notificadas.
    apiario_ids: z.array(z.string().uuid()).max(50).optional(),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.param();
    const { actor_id, apiario_ids } = c.req.valid("json");

    // Fail-closed: los no-admin solo confirman con su propio actor (mata el
    // hack del AlertasPanel que confirmaba con actores[0].id).
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor || miActor.id !== actor_id) {
        return c.json({ error: "Solo puedes confirmar alertas con tu propio actor" }, 403);
      }
    }

    // Obtener confirmaciones actuales (+ datos para las tareas de resguardo)
    const { data: alerta, error: fetchError } = await supabase
      .from("alertas_fitosanitarias")
      .select(
        "confirmaciones, producto, periodo_carencia_horas, fecha_programada",
      )
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
      {
        actor_id,
        ...(apiario_ids?.length ? { apiario_ids } : {}),
        confirmado_at: new Date().toISOString(),
      },
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

    // C2 loop-back: confirmar una alerta genera tareas de resguardo en el
    // calendario del apicultor (una por colmena real de cada apiario afectado).
    // Fire-and-forget: el acuse no debe fallar por el calendario.
    // Idempotencia: calendario_tasks_alerta_colmena_unico_idx (user_id, alerta_id, colmena_id).
    const a = alerta as unknown as {
      producto?: string;
      periodo_carencia_horas?: number | null;
      fecha_programada?: string;
    } | null;
    if (a) {
      const fechaAlerta = a.fecha_programada ? new Date(a.fecha_programada) : new Date();
      const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
      const carencia =
        typeof a.periodo_carencia_horas === "number" && a.periodo_carencia_horas > 0
          ? ` — carencia ${a.periodo_carencia_horas}h`
          : "";
      // Las colmenas reales de los apiarios notificados (no los apiarios):
      // la tarea de resguardo es por yarda, y calendario_tasks.colmena_id
      // referencia colmenas (FK). Si no hay apiarios, tarea sin colmena.
      const apiariosNotificados = apiario_ids?.length ? apiario_ids : null;
      const colmenasResueltas = apiariosNotificados
        ? await (async () => {
            try {
              const r = await fromLoose(supabase, "colmenas")
                .select("id")
                .in("apiario_id", apiariosNotificados);
              return (r.data ?? []).map((c) => c.id as string);
            } catch {
              return [];
            }
          })()
        : [];
      const filas = (colmenasResueltas.length ? colmenasResueltas : [null]).map((colmenaId) => ({
        user_id: user.id,
        title: `Resguardo post-aplicación: ${a.producto ?? "fitosanitario"}${carencia}`,
        month: MESES[fechaAlerta.getMonth()],
        week: Math.min(4, Math.ceil(fechaAlerta.getDate() / 7)),
        category: "tratamiento",
        priority: "alta",
        colmena_id: colmenaId,
        alerta_id: id,
        done: false,
      }));
      void fromLoose(supabase, "calendario_tasks")
        .insert(filas)
        .then(undefined, () => undefined);
    }

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

// ---------------------------------------------------------------------------
// ACOPIO (comercial_acopio) — declaración de intención por temporada
// ---------------------------------------------------------------------------

const AcopioSchema = z.object({
  temporada: z.string().min(4).max(20),
  volumen_kg: z.number().min(0),
  zona: z.string().max(200).nullable().optional(),
  estado: z.enum(["propuesta", "confirmada", "cancelada"]).optional(),
}).strict();

/** GET /api/registro-territorial/acopio — declaraciones del actor */
registroTerritorialRoutes.get("/acopio", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const profileRole = c.get("profileRole");

  let query = supabase
    .from("acopio_declaraciones")
    .select("*")
    .order("created_at", { ascending: false });

  if (profileRole !== "admin") {
    const miActor = await resolveMiActor(supabase, user.id);
    if (!miActor) return c.json({ data: [] });
    query = query.eq("actor_id", miActor.id);
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** POST /api/registro-territorial/acopio — declarar intención */
registroTerritorialRoutes.post(
  "/acopio",
  zValidator("json", AcopioSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const body = c.req.valid("json");

    let actorId: string | null = null;
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) {
        return c.json({ error: "Debes estar inscrito en el Registro Territorial." }, 400);
      }
      actorId = miActor.id;
    } else if (body.zona) {
      // Admin puede declarar para cualquier actor si manda actor_id… no:
      // el schema no trae actor_id; el acopio es SIEMPRE del actor de sesión.
      actorId = null;
    }
    if (!actorId) {
      return c.json({ error: "No se pudo resolver tu actor en el Registro." }, 400);
    }

    const { data, error } = await supabase
      .from("acopio_declaraciones")
      .insert({
        actor_id: actorId,
        temporada: body.temporada,
        volumen_kg: body.volumen_kg,
        zona: body.zona ?? null,
        estado: body.estado ?? "propuesta",
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/acopio/:id — estado (confirmada/cancelada) */
registroTerritorialRoutes.patch(
  "/acopio/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", z.object({
    estado: z.enum(["propuesta", "confirmada", "cancelada"]),
  })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { id } = c.req.valid("param");
    const { estado } = c.req.valid("json");

    let query = supabase
      .from("acopio_declaraciones")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (profileRole !== "admin") {
      const miActor = await resolveMiActor(supabase, user.id);
      if (!miActor) return c.json({ error: "Debes estar inscrito en el Registro." }, 400);
      query = query.eq("actor_id", miActor.id);
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Declaración no encontrada o sin permiso" }, 404);
    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// ARCO — solicitud de supresión de datos (Ley 19.628, derecho al olvido)
// ---------------------------------------------------------------------------

/** POST /api/registro-territorial/arco/solicitar-eliminacion
 *  Marca profiles.deletion_requested_at (mig 20260814210000). No borra nada:
 *  pedidos y DTE se conservan (deber tributario). El flag habilita un flujo
 *  de revisión manual por admin. Idempotente: si ya está marcado, responde OK. */
registroTerritorialRoutes.post(
  "/arco/solicitar-eliminacion",
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");

    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, deletion_requested_at")
      .eq("id", user.id)
      .maybeSingle();
    if (fetchErr) return c.json({ error: fetchErr.message }, 500);

    if (profile?.deletion_requested_at) {
      return c.json({
        data: { ya_solicitada: true, deletion_requested_at: profile.deletion_requested_at },
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return c.json({ error: error.message }, 500);

    // Auditoría: evento de seguridad (gobernanza + evidencia del derecho).
    void logSecurityEvent(supabase, {
      eventType: "arco_solicitado",
      email: "arco@" + user.id.slice(0, 8),
      userId: user.id,
      appSource: "nucleo-bff",
      details: { tipo: "eliminacion_datos", ley: "19.628" },
    });

    return c.json({ data: { ya_solicitada: false } }, 201);
  }
);

/** GET /api/registro-territorial/arco/estado — estado de la solicitud */
registroTerritorialRoutes.get("/arco/estado", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase
    .from("profiles")
    .select("deletion_requested_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data: { deletion_requested_at: data?.deletion_requested_at ?? null } });
});
