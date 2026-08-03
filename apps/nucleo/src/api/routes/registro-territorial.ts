import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import { validarRUT } from "@enjambre/contable";

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
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", CreateActorSchema.partial()),
  async (c) => {
    const supabase = c.get("supabase");
    const { id } = c.req.valid("param");
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
    const body = c.req.valid("json");

    const payload: any = {};
    if (body.actor_id !== undefined) payload.actor_id = body.actor_id;
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
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("apiarios_registro")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

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
    "actores_registro(nombre_actor, rup)";
  const selectSinCert =
    "id, nombre, n_colmenas, comuna_origen, comuna_destino, zona_destino, " +
    "lat_aproximada, lng_aproximada, fecha_ingreso, fecha_salida, " +
    "cert_sanitaria_fecha, cert_sanitaria_lab, estado, created_at, " +
    "actores_registro(nombre_actor, rup)";

  let query = supabase
    .from("apiarios_externos")
    .select(includeCert ? selectConCert : selectSinCert)
    .in("estado", ["declarado", "activo"])
    .order("fecha_ingreso", { ascending: false });

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
    const body = c.req.valid("json");

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

    const { data, error } = await supabase
      .from("apiarios_externos")
      .insert({
        actor_id: body.actor_id,
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

    const payload: any = {};
    if (body.actor_id !== undefined) payload.actor_id = body.actor_id;
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
