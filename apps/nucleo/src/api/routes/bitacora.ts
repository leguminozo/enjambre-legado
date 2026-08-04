import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";
import type {
  BitacoraSupabase,
  CapturaVozRow,
  CuerpoCuadro,
  TipoCuadro,
  FaseBitacora,
  TipoOrigen,
  NodoRedCuaderno,
  AristaRedCuaderno,
  BrechaColmena,
  InspeccionCuadrosEnHistorial,
  InspeccionRowWithBitacora,
  TratamientoRow,
  MuestraRow,
  NodoManualRow,
} from "@/lib/bitacora-types";
import type { VarroaRow } from "@/lib/apicultor-types";
import { FASES_BITACORA, CUERPOS_CUADRO, TIPOS_CUADRO, TIPOS_ORIGEN } from "@/lib/bitacora-types";
import { parseTranscripcion, PARSE_AUTO_EMIT_THRESHOLD } from "@/api/lib/bitacora-parsers";

// Bitácora apícola por voz — especificación docs/BITACORA_APICOLA.md
// Estilo: registro-territorial.ts (auth + role + zod strict + BFF como
// única vía de escritura). Las tablas nuevas viven en la migración 1006.
// UI /colmenas* es admin-only (ROUTE_ROLE_GUARDS).

export const bitacoraRoutes = new Hono<{ Variables: AppVariables }>();

bitacoraRoutes.use("*", authMiddleware, requireProfileRole("admin"));

// ---------------------------------------------------------------------------
// Schemas de validación
// ---------------------------------------------------------------------------

const FaseSchema = z.enum(FASES_BITACORA);
const CuerpoSchema = z.enum(CUERPOS_CUADRO);
const TipoCuadroSchema = z.enum(TIPOS_CUADRO);
const EstadoCapturaSchema = z.enum([
  "capturado",
  "transcrito",
  "procesado",
  "en_revision",
  "confirmado",
  "descartado",
]);

const CreateSesionSchema = z.object({
  apiario_id: z.string().uuid().nullable().optional(),
  fecha: z.string().date().optional(),
  contexto: z.string().max(300).optional(),
  audio_url: z.string().max(500).optional(),
  duracion_seg: z.number().int().min(0).optional(),
  // Reconciliación offline-first: id local generado en el dispositivo; el
  // motor de sync lo usa para reescribir las capturas pendientes con el id server.
  client_local_id: z.string().uuid().optional(),
}).strict();

const UpdateSesionSchema = z.object({
  contexto: z.string().max(300).optional(),
  fecha: z.string().date().optional(),
}).strict();

const CreateCapturaSchema = z.object({
  session_id: z.string().uuid(),
  client_request_id: z.string().uuid(),
  audio_url: z.string().max(500).optional(),
  transcript_raw: z.string().optional(),
  dispositivo: z.string().max(200).optional(),
  duracion_seg: z.number().int().min(0).optional(),
}).strict();

const UpdateCapturaSchema = z.object({
  colmena_id: z.string().uuid().nullable().optional(),
  // Offline sync: POST captura → upload storage → PATCH audio_url
  audio_url: z.string().max(500).nullable().optional(),
  transcript_raw: z.string().nullable().optional(),
  estado: EstadoCapturaSchema.optional(),
  atribucion_hipotesis: z
    .array(z.object({
      colmena_id: z.string().uuid().nullable(),
      etiqueta: z.string(),
      numero: z.number().int().positive(),
      fragmento: z.string(),
      confianza: z.number().min(0).max(1),
      resultado: z
        .object({
          fase: FaseSchema.optional(),
          reina: z.enum(["RV", "NV", "SR"]).optional(),
          poblacion: z.string().optional(),
          marcos_cria: z.number().int().min(0),
          marcos_miel: z.number().int().min(0),
          cuadros: z.array(z.object({
            cuerpo: CuerpoSchema,
            tipo: TipoCuadroSchema,
          })),
          notas: z.string(),
        })
        .optional(),
    }))
    .optional(),
}).strict();

const CuadroSchema = z.object({
  posicion: z.number().int().positive(),
  cuerpo: CuerpoSchema,
  tipo: TipoCuadroSchema,
  notas: z.string().max(500).optional(),
}).strict();

const CreateInspeccionBitacoraSchema = z.object({
  colmena_id: z.string().uuid(),
  fecha: z.string().date().optional(),
  fase: FaseSchema,
  poblacion: z.string().max(100).optional(),
  reina: z.boolean().optional(),
  marcos_cria: z.number().int().min(0).optional(),
  marcos_miel: z.number().int().min(0).optional(),
  varroa: z.number().min(0).optional(),
  cuadros: z.array(CuadroSchema).max(40).optional(),
  notas: z.string().max(2000).optional(),
}).strict();

const CreateTratamientoSchema = z.object({
  colmena_id: z.string().uuid(),
  fecha: z.string().date().optional(),
  producto_comercial: z.string().max(200).optional(),
  principio_activo: z.string().min(1).max(200),
  dosis_recomendada: z.string().max(100).optional(),
  dosis_aplicada: z.string().max(100).optional(),
  enfermedad: z.enum(["varroa", "nosema", "loque", "otro"]).optional(),
  via: z.string().max(100).optional(),
  forma: z.string().max(100).optional(),
  retiro_fin: z.string().date().optional(),
}).strict();

const CreateMuestraSchema = z.object({
  apiario_id: z.string().uuid().nullable().optional(),
  fecha: z.string().date().optional(),
  tipo: z.enum(["varroa", "nosema", "otro"]),
  n_abejas: z.number().int().positive().optional(),
  cuadros_muestreados: z.number().int().positive().optional(),
  lab_nombre: z.string().max(200).optional(),
  lab_fecha: z.string().date().optional(),
  resultado: z.string().max(500).optional(),
  patogeno: z.enum(["varroa", "nosema", "DWV", "ABPV", "otro"]).nullable().optional(),
  es_contramuestra: z.boolean().optional(),
  confirmado_saneado: z.boolean().optional(),
}).strict();

const CreateReinaHistorySchema = z.object({
  colmena_id: z.string().uuid(),
  fecha: z.string().date().optional(),
  estado: z.enum(["RV", "NV", "SR"]),
  caracteristicas: z.record(z.string(), z.unknown()).nullable().optional(),
  reemplazada_por: z.string().uuid().nullable().optional(),
}).strict();

const UpdateOrigenSchema = z.object({
  origen_tipo: z.enum(TIPOS_ORIGEN).nullable().optional(),
  origen_fecha: z.string().date().nullable().optional(),
  origen_colmena_madre: z.string().uuid().nullable().optional(),
  origen_detalle: z.string().max(500).nullable().optional(),
}).strict();

const ConfirmarCapturaSchema = z.object({
  colmena_id: z.string().uuid(),
  fecha: z.string().date().optional(),
  inspeccion: CreateInspeccionBitacoraSchema.omit({ colmena_id: true }).optional(),
  reina: CreateReinaHistorySchema.omit({ colmena_id: true }).optional(),
}).strict();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cliente aumentado con las tablas de la bitácora (migración 1006). */
function bitacoraClient(supabase: AppVariables["supabase"]): BitacoraSupabase {
  return supabase as unknown as BitacoraSupabase;
}

/**
 * Regla §2.3: alerta si existe un tratamiento con período de retiro vigente
 * (retiro_fin >= fecha) en una colmena con alzas puestas.
 */
async function computeAlertaRetiro(
  supabase: BitacoraSupabase,
  colmenaId: string,
  fecha: string,
) {
  const { data: colmena } = await supabase
    .from("colmenas")
    .select("alzas")
    .eq("id", colmenaId)
    .maybeSingle();

  const { data: tratamientos } = await supabase
    .from("tratamientos")
    .select("id, principio_activo, retiro_fin")
    .eq("colmena_id", colmenaId)
    .not("retiro_fin", "is", null)
    .gte("retiro_fin", fecha)
    .order("retiro_fin", { ascending: false })
    .limit(1);

  const t = tratamientos?.[0];
  if (!t?.retiro_fin) {
    return {
      vigente: false,
      tratamiento_id: null,
      principio_activo: null,
      retiro_fin: null,
      mensaje: null,
    };
  }

  const alzasPuestas = (colmena?.alzas ?? 1) > 1;
  return {
    vigente: true,
    tratamiento_id: t.id,
    principio_activo: t.principio_activo,
    retiro_fin: t.retiro_fin,
    mensaje: alzasPuestas
      ? `Período de retiro de ${t.principio_activo} vigente hasta ${t.retiro_fin} con alzas puestas. No cosechar durante este período.`
      : `Período de retiro de ${t.principio_activo} vigente hasta ${t.retiro_fin}.`,
  };
}

// ---------------------------------------------------------------------------
// SESIONES
// ---------------------------------------------------------------------------

/** GET /api/bitacora/sesiones?apiario_id= — sesiones propias */
bitacoraRoutes.get("/sesiones", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const user = c.get("user");
  const { apiario_id } = c.req.query();

  let query = supabase
    .from("sesiones_bitacora")
    .select("*")
    .eq("user_id", user.id)
    .order("fecha", { ascending: false });

  if (apiario_id) query = query.eq("apiario_id", apiario_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

/** POST /api/bitacora/sesiones — crear sesión de inspección */
bitacoraRoutes.post(
  "/sesiones",
  zValidator("json", CreateSesionSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("sesiones_bitacora")
      .insert({
        apiario_id: body.apiario_id ?? null,
        fecha: body.fecha ?? new Date().toISOString().slice(0, 10),
        contexto: body.contexto ?? null,
        audio_url: body.audio_url ?? null,
        duracion_seg: body.duracion_seg ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const meta: Record<string, unknown> = {};
    if (body.client_local_id) meta.client_local_id = body.client_local_id;

    return c.json({ data, meta }, 201);
  }
);

/** PATCH /api/bitacora/sesiones/:id — actualizar contexto/fecha (propio) */
bitacoraRoutes.patch(
  "/sesiones/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateSesionSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("sesiones_bitacora")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Sesión no encontrada o sin permiso" }, 404);
    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// CAPTURAS DE VOZ
// ---------------------------------------------------------------------------

/** GET /api/bitacora/capturas?session_id=&estado= — capturas de una sesión */
bitacoraRoutes.get("/capturas", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const user = c.get("user");
  const { session_id, estado } = c.req.query();

  let query = supabase
    .from("voice_inspection_captures")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (session_id) query = query.eq("session_id", session_id);
  if (estado) query = query.eq("estado", estado as CapturaVozRow["estado"]);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

/**
 * POST /api/bitacora/capturas — encolar captura de voz.
 * Idempotente: client_request_id ya procesado → 200 con already_processed
 * (patrón rep-ventas.ts:79-104 / ventas.buy_order).
 */
bitacoraRoutes.post(
  "/capturas",
  zValidator("json", CreateCapturaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    // Replay idempotente: si la captura ya existe, devolverla sin duplicar.
    const { data: existente } = await supabase
      .from("voice_inspection_captures")
      .select("*")
      .eq("client_request_id", body.client_request_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existente) {
      return c.json({ data: existente, meta: { already_processed: true } });
    }

    // Sesión debe ser del usuario (evita FK a sesión ajena)
    const { data: sesion } = await supabase
      .from("sesiones_bitacora")
      .select("id")
      .eq("id", body.session_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!sesion) {
      return c.json({ error: "Sesión no encontrada o sin permiso" }, 404);
    }

    const { data, error } = await supabase
      .from("voice_inspection_captures")
      .insert({
        session_id: body.session_id,
        client_request_id: body.client_request_id,
        audio_url: body.audio_url ?? null,
        transcript_raw: body.transcript_raw ?? null,
        dispositivo: body.dispositivo ?? null,
        duracion_seg: body.duracion_seg ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

/** PATCH /api/bitacora/capturas/:id — audio_url (sync offline), estado, atribución */
bitacoraRoutes.patch(
  "/capturas/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateCapturaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("voice_inspection_captures")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: "Captura no encontrada o sin permiso" }, 404);
    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// INSPECCIONES DE BITÁCORA (fases del ciclo de vida)
// ---------------------------------------------------------------------------

/**
 * POST /api/bitacora/inspecciones — crear inspección de bitácora con cuadros.
 * Regla §2.3: fase 'alza' con retiro vigente → 409 retiro_vigente.
 */
bitacoraRoutes.post(
  "/inspecciones",
  zValidator("json", CreateInspeccionBitacoraSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");
    const fecha = body.fecha ?? new Date().toISOString().slice(0, 10);

    // Guard sanitario: no alza puesta durante período de retiro vigente (§2.3)
    if (body.fase === "alza") {
      const alerta = await computeAlertaRetiro(supabase, body.colmena_id, fecha);
      if (alerta.vigente) {
        return c.json(
          {
            code: "retiro_vigente",
            message: alerta.mensaje,
            alerta,
          },
          409
        );
      }
    }

    const { data: inspeccion, error } = await supabase
      .from("inspecciones")
      .insert({
        colmena_id: body.colmena_id,
        date: fecha,
        fase: body.fase as FaseBitacora,
        poblacion: body.poblacion ?? null,
        reina: body.reina ?? null,
        marcos_cria: body.marcos_cria ?? null,
        marcos_miel: body.marcos_miel ?? null,
        varroa: body.varroa ?? null,
        notes: body.notas ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    // Cuadros individualizados (§1.1/§1.2)
    const cuadros = body.cuadros ?? [];
    if (cuadros.length > 0) {
      const { error: cuadrosError } = await supabase
        .from("inspeccion_cuadros")
        .insert(
          cuadros.map((cua) => ({
            inspeccion_id: inspeccion.id,
            posicion: cua.posicion,
            cuerpo: cua.cuerpo as CuerpoCuadro,
            tipo: cua.tipo as TipoCuadro,
            notas: cua.notas ?? null,
            user_id: user.id,
          }))
        );
      if (cuadrosError) return c.json({ error: cuadrosError.message }, 500);
    }

    // Mantener la ficha al día
    const updateColmena: { last_inspection: string; alzas?: number } = {
      last_inspection: fecha,
    };
    if (body.fase === "alza") {
      const maxCuerpo = Math.max(
        1,
        ...cuadros
          .map((cua) => Number(String(cua.cuerpo).replace("alza_", "")))
          .filter((n) => Number.isFinite(n))
      );
      updateColmena.alzas = Math.max(1, maxCuerpo);
    }
    const { error: colmenaError } = await supabase
      .from("colmenas")
      .update(updateColmena)
      .eq("id", body.colmena_id);
    if (colmenaError) return c.json({ error: colmenaError.message }, 500);

    return c.json({ data: inspeccion }, 201);
  }
);

/** GET /api/bitacora/colmenas/:id — historial completo de la colmena */
bitacoraRoutes.get(
  "/colmenas/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const { id } = c.req.valid("param");
  const fecha = new Date().toISOString().slice(0, 10);

  const [inspecciones, tratamientos, reinas, alertaRetiro, origen] = await Promise.all([
    supabase
      .from("inspecciones")
      .select("*, inspeccion_cuadros(*)")
      .eq("colmena_id", id)
      .order("date", { ascending: false }),
    supabase
      .from("tratamientos")
      .select("*")
      .eq("colmena_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("reina_history")
      .select("*")
      .eq("colmena_id", id)
      .order("fecha", { ascending: false }),
    computeAlertaRetiro(supabase, id, fecha),
    supabase
      .from("colmenas")
      .select("id, origen_tipo, origen_fecha, origen_colmena_madre, origen_detalle")
      .eq("id", id)
      .maybeSingle(),
  ]);

  const error = inspecciones.error ?? tratamientos.error ?? reinas.error ?? origen.error;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    data: {
      inspecciones: inspecciones.data,
      tratamientos: tratamientos.data,
      reinas: reinas.data,
      alerta_retiro: alertaRetiro,
      origen: origen.data ?? null,
    },
  });
});

/** PATCH /api/bitacora/colmenas/:id/origen — provenance del núcleo/colmena */
bitacoraRoutes.patch(
  "/colmenas/:id/origen",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateOrigenSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    // Solo actualiza las claves enviadas (null explícito = limpiar campo)
    const update: {
      origen_tipo?: TipoOrigen | null;
      origen_fecha?: string | null;
      origen_colmena_madre?: string | null;
      origen_detalle?: string | null;
    } = {};
    if (body.origen_tipo !== undefined) update.origen_tipo = body.origen_tipo;
    if (body.origen_fecha !== undefined) update.origen_fecha = body.origen_fecha;
    if (body.origen_colmena_madre !== undefined) update.origen_colmena_madre = body.origen_colmena_madre;
    if (body.origen_detalle !== undefined) update.origen_detalle = body.origen_detalle;

    const { data, error } = await supabase
      .from("colmenas")
      .update(update)
      .eq("id", id)
      .select("id, origen_tipo, origen_fecha, origen_colmena_madre, origen_detalle")
      .maybeSingle();

    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Colmena no encontrada" }, 404);
    return c.json({ data });
  }
);

// ---------------------------------------------------------------------------
// TRATAMIENTOS FITOSANITARIOS
// ---------------------------------------------------------------------------

/** POST /api/bitacora/tratamientos — registrar aplicación fitosanitaria */
bitacoraRoutes.post(
  "/tratamientos",
  zValidator("json", CreateTratamientoSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    // Regla §2.4: advertir si el principio activo repite la temporada anterior
    const temporadaPasada = new Date();
    temporadaPasada.setFullYear(temporadaPasada.getFullYear() - 1);

    const { data: previos } = await supabase
      .from("tratamientos")
      .select("principio_activo")
      .eq("colmena_id", body.colmena_id)
      .eq("principio_activo", body.principio_activo)
      .gte("fecha", temporadaPasada.toISOString().slice(0, 10))
      .limit(1);

    const { data, error } = await supabase
      .from("tratamientos")
      .insert({
        colmena_id: body.colmena_id,
        fecha: body.fecha ?? new Date().toISOString().slice(0, 10),
        producto_comercial: body.producto_comercial ?? null,
        principio_activo: body.principio_activo,
        dosis_recomendada: body.dosis_recomendada ?? null,
        dosis_aplicada: body.dosis_aplicada ?? null,
        enfermedad: body.enfermedad ?? "varroa",
        via: body.via ?? null,
        forma: body.forma ?? null,
        retiro_fin: body.retiro_fin ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const meta: Record<string, unknown> = {
      repetido_temporada: (previos?.length ?? 0) > 0,
    };
    if ((previos?.length ?? 0) > 0) {
      meta.aviso = `El principio activo ${body.principio_activo} ya se aplicó en esta colmena el último año. Considere rotarlo para evitar resistencia de Varroa destructor (§2.4).`;
    }

    return c.json({ data, meta }, 201);
  }
);

/** GET /api/bitacora/tratamientos?colmena_id= — historial con alerta de retiro */
bitacoraRoutes.get("/tratamientos", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const { colmena_id } = c.req.query();
  const fecha = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("tratamientos")
    .select("*")
    .order("fecha", { ascending: false });

  if (colmena_id) query = query.eq("colmena_id", colmena_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  const alerta = colmena_id
    ? await computeAlertaRetiro(supabase, colmena_id, fecha)
    : null;

  return c.json({ data, alerta_retiro: alerta });
});

// ---------------------------------------------------------------------------
// MUESTRAS Y CONTRA-MUESTREO
// ---------------------------------------------------------------------------

/** POST /api/bitacora/muestras — registrar muestra de laboratorio */
bitacoraRoutes.post(
  "/muestras",
  zValidator("json", CreateMuestraSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("muestras")
      .insert({
        apiario_id: body.apiario_id ?? null,
        fecha: body.fecha ?? new Date().toISOString().slice(0, 10),
        tipo: body.tipo,
        n_abejas: body.n_abejas ?? null,
        cuadros_muestreados: body.cuadros_muestreados ?? null,
        lab_nombre: body.lab_nombre ?? null,
        lab_fecha: body.lab_fecha ?? null,
        resultado: body.resultado ?? null,
        patogeno: body.patogeno ?? null,
        es_contramuestra: body.es_contramuestra ?? false,
        confirmado_saneado: body.confirmado_saneado ?? false,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);

    const meta: Record<string, unknown> = {};
    if (body.es_contramuestra && body.confirmado_saneado) {
      meta.mensaje = "Contramuestreo confirma remisión del cuadro sanitario: la cuarentena puede levantarse (§2.1).";
    }

    return c.json({ data, meta }, 201);
  }
);

/** GET /api/bitacora/muestras?apiario_id= — historial de muestras */
bitacoraRoutes.get("/muestras", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const { apiario_id } = c.req.query();

  let query = supabase
    .from("muestras")
    .select("*")
    .order("fecha", { ascending: false });

  if (apiario_id) query = query.eq("apiario_id", apiario_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

// ---------------------------------------------------------------------------
// REINAS
// ---------------------------------------------------------------------------

/** POST /api/bitacora/reinas — registrar estado/características de la reina */
bitacoraRoutes.post(
  "/reinas",
  zValidator("json", CreateReinaHistorySchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("reina_history")
      .insert({
        colmena_id: body.colmena_id,
        fecha: body.fecha ?? new Date().toISOString().slice(0, 10),
        estado: body.estado,
        caracteristicas: body.caracteristicas ?? null,
        reemplazada_por: body.reemplazada_por ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

// ---------------------------------------------------------------------------
// PROCESAMIENTO DE CAPTURA (parseo en backend — la lógica nunca vive en el cliente)
// ---------------------------------------------------------------------------

/**
 * POST /api/bitacora/capturas/:id/procesar
 * Toma la transcripción, la segmenta por marcadores de colmena (voz libre no
 * correlativa, §3.2), parsea cada fragmento (patrón ReceiptParser) y resuelve
 * el número hablado → colmena_id contra las colmenas del usuario. El resultado
 * queda como hipótesis para la curaduría en escritorio (§3.4).
 */
bitacoraRoutes.post(
  "/capturas/:id/procesar",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const { id } = c.req.valid("param");

    const { data: captura, error } = await supabase
      .from("voice_inspection_captures")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!captura) return c.json({ code: "not_found", message: "Captura no encontrada" }, 404);
    if (!captura.transcript_raw) {
      return c.json({ code: "sin_transcripcion", message: "La captura aún no tiene transcripción" }, 400);
    }

    const parsed = parseTranscripcion(captura.transcript_raw);
    if (parsed.length === 0) {
      // Sin marcadores de colmena: se mantiene sin atribuir, va a revisión
      await supabase
        .from("voice_inspection_captures")
        .update({ estado: "en_revision", updated_at: new Date().toISOString() })
        .eq("id", id);
      return c.json({ data: { captura_id: id, hipotesis: [], estado: "en_revision" } });
    }

    // Equivalencia hablada → identificador interno (§3.2): por nombre
    // ("colmena 20", "caja 15", "20"). numero_caja no existe en la BD real.
    const { data: colmenas } = await supabase
      .from("colmenas")
      .select("id, name")
      .eq("user_id", user.id);

    const hipotesis = parsed.map((p) => {
      const colmena = colmenas?.find(
        (col) => col.name !== null && col.name !== undefined && col.name.includes(String(p.numero))
      );
      return {
        colmena_id: colmena?.id ?? null,
        etiqueta: p.etiqueta,
        numero: p.numero,
        fragmento: p.fragmento,
        confianza: p.confianza,
        resultado: p.resultado,
      };
    });

    // Auto-emisión vs. curaduría: umbral 0.85 (concepto de parse-confidence.ts)
    const todasResueltas = hipotesis.every((h) => h.colmena_id !== null);
    const altaConfianza = hipotesis.every((h) => h.confianza >= PARSE_AUTO_EMIT_THRESHOLD);
    const estado = todasResueltas && altaConfianza ? "procesado" : "en_revision";

    await supabase
      .from("voice_inspection_captures")
      .update({ atribucion_hipotesis: hipotesis, estado, updated_at: new Date().toISOString() })
      .eq("id", id);

    return c.json({ data: { captura_id: id, hipotesis, estado } });
  }
);

// ---------------------------------------------------------------------------
// CONFIRMACIÓN DE CAPTURA (curaduría → inspecciones estructuradas)
// ---------------------------------------------------------------------------

/**
 * POST /api/bitacora/capturas/:id/confirmar
 * Curaduría en escritorio (§3.4): el apicultor confirma la atribución de una
 * captura a una colmena; el BFF materializa la inspección estructurada.
 */
bitacoraRoutes.post(
  "/capturas/:id/confirmar",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", ConfirmarCapturaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    // Guard sanitario (misma regla que POST /inspecciones)
    const fecha = body.inspeccion?.fecha ?? new Date().toISOString().slice(0, 10);
    if (body.inspeccion?.fase === "alza") {
      const alerta = await computeAlertaRetiro(supabase, body.colmena_id, fecha);
      if (alerta.vigente) {
        return c.json({ code: "retiro_vigente", message: alerta.mensaje, alerta }, 409);
      }
    }

    let inspeccionId: string | null = null;
    if (body.inspeccion) {
      const ins = body.inspeccion;
      const { data: insp, error } = await supabase
        .from("inspecciones")
        .insert({
          colmena_id: body.colmena_id,
          date: fecha,
          fase: ins.fase,
          poblacion: ins.poblacion ?? null,
          reina: ins.reina ?? null,
          marcos_cria: ins.marcos_cria ?? null,
          marcos_miel: ins.marcos_miel ?? null,
          varroa: ins.varroa ?? null,
          notes: ins.notas ?? null,
          user_id: c.get("user").id,
        })
        .select()
        .single();
      if (error) return c.json({ error: error.message }, 500);
      inspeccionId = insp.id;

      const cuadros = ins.cuadros ?? [];
      if (cuadros.length > 0) {
        const { error: cuadrosError } = await supabase
          .from("inspeccion_cuadros")
          .insert(
            cuadros.map((cua) => ({
              inspeccion_id: insp.id,
              posicion: cua.posicion,
              cuerpo: cua.cuerpo,
              tipo: cua.tipo,
              notas: cua.notas ?? null,
              user_id: c.get("user").id,
            }))
          );
        if (cuadrosError) return c.json({ error: cuadrosError.message }, 500);
      }
    }

    if (body.reina) {
      const { error: reinaError } = await supabase
        .from("reina_history")
        .insert({
          colmena_id: body.colmena_id,
          fecha: body.reina.fecha ?? fecha,
          estado: body.reina.estado,
          caracteristicas: body.reina.caracteristicas ?? null,
          reemplazada_por: body.reina.reemplazada_por ?? null,
          user_id: c.get("user").id,
        });
      if (reinaError) return c.json({ error: reinaError.message }, 500);
    }

    const { data: captura, error: capturaError } = await supabase
      .from("voice_inspection_captures")
      .update({
        colmena_id: body.colmena_id,
        estado: "confirmado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (capturaError) return c.json({ error: capturaError.message }, 500);

    return c.json({ data: { captura, inspeccion_id: inspeccionId } });
  }
);

// TODO Sprint C: POST /capturas/:id/procesar — invoca el pipeline de parseo
// (bitacora-parsers) y rellena atribucion_hipotesis + transcript_raw.
