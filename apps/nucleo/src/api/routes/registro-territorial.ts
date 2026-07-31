import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

export const registroTerritorialRoutes = new Hono<{ Variables: AppVariables }>();

registroTerritorialRoutes.use("*", authMiddleware);

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
});

const CreateActorSchema = z.object({
  rol: RolSchema,
  nombre_actor: z.string().min(2).max(200),
  rup: z.string().optional(),
  comuna: z.string().min(2).max(100),
  region: z.string().default("Los Lagos"),
  consentimientos: ConsentimientosSchema.optional(),
  observaciones: z.string().max(1000).optional(),
});

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
});

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
  cert_sanitaria_url: z.string().url().optional(),
  cert_sanitaria_fecha: z.string().date().optional(),
  cert_sanitaria_lab: z.string().max(200).optional(),
  bioseguridad_declarada: z.string().max(2000).optional(),
  observaciones: z.string().max(1000).optional(),
});

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
});

// ---------------------------------------------------------------------------
// ACTORES
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/actores — actores de una comuna */
registroTerritorialRoutes.get("/actores", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, rol, estado } = c.req.query();

  let query = supabase
    .from("actores_registro")
    .select("id, rol, nombre_actor, comuna, nivel_acreditacion, estado, rup, created_at")
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
    .eq("user_id", user.id);

  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** POST /api/registro-territorial/actores — inscribir un nuevo actor */
registroTerritorialRoutes.post(
  "/actores",
  zValidator("json", CreateActorSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("actores_registro")
      .insert({
        user_id: user.id,
        rol: body.rol,
        nombre_actor: body.nombre_actor,
        rup: body.rup ?? null,
        comuna: body.comuna,
        region: body.region,
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

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

/** PATCH /api/registro-territorial/actores/:id — actualizar perfil del actor */
registroTerritorialRoutes.patch(
  "/actores/:id",
  zValidator("json", CreateActorSchema.partial()),
  async (c) => {
    const supabase = c.get("supabase");
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("actores_registro")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// PREDIOS FACILITADORES
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/predios — predios disponibles */
registroTerritorialRoutes.get("/predios", async (c) => {
  const supabase = c.get("supabase");
  const { comuna } = c.req.query();

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
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("predios_facilitadores")
      .insert(body)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data }, 201);
  }
);

// ---------------------------------------------------------------------------
// APIARIOS EXTERNOS (TRASHUMANTES)
// ---------------------------------------------------------------------------

/** GET /api/registro-territorial/apiarios-externos — declaraciones activas */
registroTerritorialRoutes.get("/apiarios-externos", async (c) => {
  const supabase = c.get("supabase");
  const { comuna, estado } = c.req.query();

  let query = supabase
    .from("apiarios_externos")
    .select(`
      id, nombre, n_colmenas,
      comuna_origen, comuna_destino, zona_destino,
      lat_aproximada, lng_aproximada,
      fecha_ingreso, fecha_salida,
      cert_sanitaria_fecha, cert_sanitaria_lab,
      estado, created_at,
      actores_registro!inner(nombre_actor, rup)
    `)
    .in("estado", ["declarado", "activo"])
    .order("fecha_ingreso", { ascending: false });

  if (comuna) query = query.eq("comuna_destino", comuna);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({ data });
});

/** POST /api/registro-territorial/apiarios-externos — declarar ingreso trashumante */
registroTerritorialRoutes.post(
  "/apiarios-externos",
  zValidator("json", CreateApiarioExternoSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("apiarios_externos")
      .insert(body)
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
    const { id } = c.req.param();
    const { estado } = c.req.valid("json");

    const { data, error } = await supabase
      .from("apiarios_externos")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

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
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("alertas_fitosanitarias")
      .insert(body)
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
    const { id } = c.req.param();
    const { actor_id } = c.req.valid("json");

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
    const { id } = c.req.param();
    const { estado } = c.req.valid("json");

    const { data, error } = await supabase
      .from("alertas_fitosanitarias")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data });
  }
);
