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
// Authz: admin + apicultor (patio) + territorial (red y subroles api_*). RLS owner-based (docs/RLS_AUDIT_COLMENAS_BITACORA.md).
// UI /colmenas* en ROUTE_ROLE_GUARDS: admin | apicultor | territorial.

export const bitacoraRoutes = new Hono<{ Variables: AppVariables }>();

bitacoraRoutes.use("*", authMiddleware, requireProfileRole("admin", "apicultor", "territorial"));

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

  const alzasPuestas = (colmena?.alzas ?? 0) > 0;
  return {
    vigente: true,
    tratamiento_id: t.id,
    principio_activo: t.principio_activo,
    retiro_fin: t.retiro_fin,
    mensaje: alzasPuestas
      ? `Período de retiro de ${t.principio_activo} vigente hasta ${t.retiro_fin} con alzas puestas. No recolectar miel durante este período.`
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

    // Path manual (PR6): si llega transcript sin audio → estado listo para procesar/curar.
    // Path voz: estado default `capturado` (schema) hasta STT/upload.
    const hasTranscript =
      typeof body.transcript_raw === "string" && body.transcript_raw.trim().length > 0;

    const { data, error } = await supabase
      .from("voice_inspection_captures")
      .insert({
        session_id: body.session_id,
        client_request_id: body.client_request_id,
        audio_url: body.audio_url ?? null,
        transcript_raw: hasTranscript ? body.transcript_raw!.trim() : null,
        dispositivo: body.dispositivo ?? null,
        duracion_seg: body.duracion_seg ?? null,
        user_id: user.id,
        ...(hasTranscript ? { estado: "transcrito" as const } : {}),
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

    // alzas se deriva de los cuadros; last_inspection lo mantiene el trigger
    // trg_inspecciones_last_inspection (mig 20260822020000) para todas las vías.
    const updateColmena: { alzas?: number } = {};
    if (body.fase === "alza") {
      const maxCuerpo = Math.max(
        1,
        ...cuadros
          .map((cua) => Number(String(cua.cuerpo).replace("alza_", "")))
          .filter((n) => Number.isFinite(n))
      );
      updateColmena.alzas = Math.max(1, maxCuerpo);
    }
    if (Object.keys(updateColmena).length > 0) {
      const { error: colmenaError } = await supabase
        .from("colmenas")
        .update(updateColmena)
        .eq("id", body.colmena_id);
      if (colmenaError) return c.json({ error: colmenaError.message }, 500);
    }

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

/** GET /api/bitacora/tratamientos?colmena_id= — historial con alerta de retiro.
 *  Enriquecido con nombre y hash de la colmena para la trazabilidad del cuaderno. */
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

  const tratamientos = data ?? [];
  const colmenaIds = [...new Set(tratamientos.map((t) => t.colmena_id))];
  const { data: colmenas } = await supabase
    .from("colmenas")
    .select("id, name, blockchain_hash")
    .in("id", colmenaIds.length > 0 ? colmenaIds : [""]);
  const colmenaMap = new Map((colmenas ?? []).map((c) => [c.id, c]));

  const dataEnriquecida = tratamientos.map((t) => ({
    ...t,
    colmena_name: t.colmena_id ? colmenaMap.get(t.colmena_id)?.name ?? null : null,
    colmena_hash: t.colmena_id ? colmenaMap.get(t.colmena_id)?.blockchain_hash ?? null : null,
  }));

  const alerta = colmena_id
    ? await computeAlertaRetiro(supabase, colmena_id, fecha)
    : null;

  return c.json({ data: dataEnriquecida, alerta_retiro: alerta });
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

/** GET /api/bitacora/muestras?apiario_id= — historial de muestras.
 *  Enriquecido con el nombre del apiario para la trazabilidad del cuaderno. */
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

  const muestras = data ?? [];
  const apiarioIds = [...new Set(muestras.map((m) => m.apiario_id).filter((id): id is string => Boolean(id)))];
  const { data: apiarios } = await supabase
    .from("apiarios")
    .select("id, name")
    .in("id", apiarioIds.length > 0 ? apiarioIds : [""]);
  const apiarioMap = new Map((apiarios ?? []).map((a) => [a.id, a.name]));

  const dataEnriquecida = muestras.map((m) => ({
    ...m,
    apiario_name: m.apiario_id ? apiarioMap.get(m.apiario_id) ?? null : null,
  }));

  return c.json({ data: dataEnriquecida });
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

// ---------------------------------------------------------------------------
// CUADERNO DE CAMPO v2 — colección, escena de hoja y red semántica territorial.
// El dueño administra sus datos (migración 1010 relajó las políticas delete).
// ---------------------------------------------------------------------------

const UpdateInspeccionSchema = z.object({
  colmena_id: z.string().uuid().optional(),
  fecha: z.string().date().optional(),
  fase: FaseSchema.optional(),
  poblacion: z.string().max(100).nullable().optional(),
  reina: z.boolean().nullable().optional(),
  marcos_cria: z.number().int().min(0).nullable().optional(),
  marcos_miel: z.number().int().min(0).nullable().optional(),
  varroa: z.number().min(0).nullable().optional(),
  cuadros: z.array(CuadroSchema).max(40).optional(),
  notas: z.string().max(2000).nullable().optional(),
}).strict();

const CreateVarroaSchema = z.object({
  colmena_id: z.string().uuid(),
  date: z.string().date().optional(),
  level: z.number().min(0).max(100),
  method: z.string().max(100).optional(),
}).strict();

const UpdateVarroaSchema = z.object({
  colmena_id: z.string().uuid().optional(),
  date: z.string().date().optional(),
  level: z.number().min(0).max(100).optional(),
  method: z.string().max(100).nullable().optional(),
}).strict();

const UpdateTratamientoSchema = z.object({
  colmena_id: z.string().uuid().optional(),
  fecha: z.string().date().optional(),
  producto_comercial: z.string().max(200).nullable().optional(),
  principio_activo: z.string().min(1).max(200).optional(),
  dosis_recomendada: z.string().max(100).nullable().optional(),
  dosis_aplicada: z.string().max(100).nullable().optional(),
  enfermedad: z.enum(["varroa", "nosema", "loque", "otro"]).optional(),
  via: z.string().max(100).nullable().optional(),
  forma: z.string().max(100).nullable().optional(),
  retiro_fin: z.string().date().nullable().optional(),
}).strict();

const UpdateMuestraSchema = z.object({
  apiario_id: z.string().uuid().nullable().optional(),
  fecha: z.string().date().optional(),
  tipo: z.enum(["varroa", "nosema", "otro"]).optional(),
  n_abejas: z.number().int().positive().nullable().optional(),
  cuadros_muestreados: z.number().int().positive().nullable().optional(),
  lab_nombre: z.string().max(200).nullable().optional(),
  lab_fecha: z.string().date().nullable().optional(),
  resultado: z.string().max(500).nullable().optional(),
  patogeno: z.enum(["varroa", "nosema", "DWV", "ABPV", "otro"]).nullable().optional(),
  es_contramuestra: z.boolean().optional(),
  confirmado_saneado: z.boolean().optional(),
}).strict();

const CreateNodoManualSchema = z.object({
  colmena_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(["observacion", "decision", "tension", "otro"]).default("observacion"),
  label: z.string().min(1).max(200),
  descripcion: z.string().max(2000).nullable().optional(),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
}).strict();

const UpdateNodoManualSchema = z.object({
  colmena_id: z.string().uuid().nullable().optional(),
  tipo: z.enum(["observacion", "decision", "tension", "otro"]).optional(),
  label: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  x: z.number().nullable().optional(),
  y: z.number().nullable().optional(),
}).strict();

const CreateAristaSchema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  relacion: z.enum(["deriva_de", "observa", "tension", "analogia", "otro"]).default("observa"),
  label: z.string().max(200).nullable().optional(),
}).strict();

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(fecha: string, desde: string): number {
  return Math.max(0, Math.floor((new Date(desde).getTime() - new Date(fecha).getTime()) / 86_400_000));
}

/** GET /api/bitacora/hojas?fase=&colmena_id= — colección de hojas (tarjetas).
 *  Cada hoja es una entrada del cuaderno con su contexto de colmena/apiario,
 *  conteos y brechas ("lo que no se dice también es información"). */
bitacoraRoutes.get("/hojas", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const { fase, colmena_id } = c.req.query();
  const hoy = hoyISO();

  let query = supabase
    .from("inspecciones")
    .select("*")
    .order("date", { ascending: false })
    .limit(300);
  if (fase) query = query.eq("fase", fase as FaseBitacora);
  if (colmena_id) query = query.eq("colmena_id", colmena_id);

  const [inspeccionesRes, colmenasRes, apiariosRes] = await Promise.all([
    query,
    supabase
      .from("colmenas")
      .select("id, name, apiario_id, blockchain_hash, origen_tipo, health, alzas"),
    supabase.from("apiarios").select("id, name"),
  ]);

  if (inspeccionesRes.error) return c.json({ error: inspeccionesRes.error.message }, 500);
  if (colmenasRes.error) return c.json({ error: colmenasRes.error.message }, 500);
  if (apiariosRes.error) return c.json({ error: apiariosRes.error.message }, 500);

  const inspecciones = inspeccionesRes.data ?? [];
  const colmenas = colmenasRes.data ?? [];
  const apiarios = apiariosRes.data ?? [];
  const apiarioMap = new Map(apiarios.map((a) => [a.id, a.name]));

  const colmenaIds = colmenas.map((c) => c.id);
  const insIds = inspecciones.map((i) => i.id);

  const [cuadrosRes, tratamientosRes] = await Promise.all([
    insIds.length > 0
      ? supabase.from("inspeccion_cuadros").select("inspeccion_id").in("inspeccion_id", insIds)
      : Promise.resolve({ data: [], error: null }),
    colmenaIds.length > 0
      ? supabase
          .from("tratamientos")
          .select("colmena_id, principio_activo, retiro_fin")
          .in("colmena_id", colmenaIds)
          .not("retiro_fin", "is", null)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const error2 = cuadrosRes.error ?? tratamientosRes.error;
  if (error2) return c.json({ error: error2.message }, 500);

  const cuadrosCount = new Map<string, number>();
  for (const cua of cuadrosRes.data ?? []) {
    cuadrosCount.set(cua.inspeccion_id, (cuadrosCount.get(cua.inspeccion_id) ?? 0) + 1);
  }
  const tratamientosCount = new Map<string, number>();
  const retiroVigente = new Set<string>();
  for (const t of tratamientosRes.data ?? []) {
    tratamientosCount.set(t.colmena_id, (tratamientosCount.get(t.colmena_id) ?? 0) + 1);
    if (t.retiro_fin && t.retiro_fin >= hoy) retiroVigente.add(t.colmena_id);
  }

  const data = inspecciones.map((ins) => {
    const col = colmenas.find((c) => c.id === ins.colmena_id);
    const brechas: string[] = [];
    if (ins.varroa === null || ins.varroa === undefined) brechas.push("sin_varroa");
    if ((cuadrosCount.get(ins.id) ?? 0) === 0) brechas.push("sin_cuadros");
    if (!ins.notes?.trim()) brechas.push("sin_notas");
    if (col && retiroVigente.has(col.id)) brechas.push("retiro_vigente");
    return {
      ...ins,
      colmena: col
        ? {
            id: col.id,
            name: col.name,
            apiario_id: col.apiario_id,
            blockchain_hash: col.blockchain_hash,
            origen_tipo: col.origen_tipo,
            estado: col.health ?? null,
            alzas: col.alzas,
          }
        : null,
      apiario_name: col?.apiario_id ? (apiarioMap.get(col.apiario_id) ?? null) : null,
      cuadros_count: cuadrosCount.get(ins.id) ?? 0,
      tratamientos_count: tratamientosCount.get(ins.colmena_id ?? "") ?? 0,
      brechas,
    };
  });

  return c.json({
    data,
    meta: {
      total: data.length,
      colmenas: colmenas.map((c) => ({ id: c.id, name: c.name })),
      apiarios: apiarios.map((a) => ({ id: a.id, name: a.name })),
    },
  });
});

/** GET /api/bitacora/hojas/:id — escena de la hoja: detalle + red local. */
bitacoraRoutes.get(
  "/hojas/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const hoy = hoyISO();

    const { data: hoja, error } = (await supabase
      .from("inspecciones")
      .select("*, inspeccion_cuadros(*)")
      .eq("id", id)
      .maybeSingle()) as unknown as {
      data: InspeccionCuadrosEnHistorial | null;
      error: { message: string } | null;
    };
    if (error) return c.json({ error: error.message }, 500);
    if (!hoja) return c.json({ code: "not_found", message: "Hoja no encontrada" }, 404);

    const colmenaId = hoja.colmena_id ?? null;
    const [colmenaRes, tratamientosRes, varroaRes, nodosRes, aristasRes, alerta] = await Promise.all([
      colmenaId
        ? supabase
            .from("colmenas")
            .select("id, name, apiario_id, blockchain_hash, origen_tipo, origen_fecha, origen_colmena_madre, origen_detalle, health, alzas")
            .eq("id", colmenaId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      colmenaId
        ? supabase.from("tratamientos").select("*").eq("colmena_id", colmenaId).order("fecha", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      colmenaId
        ? supabase.from("varroa_records").select("*").eq("colmena_id", colmenaId).order("date", { ascending: false }).limit(12)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("cuaderno_nodos")
        .select("*")
        .eq("colmena_id", colmenaId ?? "")
        .order("created_at", { ascending: true }),
      supabase.from("cuaderno_aristas").select("*"),
      colmenaId
        ? computeAlertaRetiro(supabase, colmenaId, hoy)
        : Promise.resolve({
            vigente: false,
            tratamiento_id: null,
            principio_activo: null,
            retiro_fin: null,
            mensaje: null,
          }),
    ]);
    const error2 = colmenaRes.error ?? tratamientosRes.error ?? varroaRes.error ?? nodosRes.error ?? aristasRes.error;
    if (error2) return c.json({ error: error2.message }, 500);

    const colmena = colmenaRes.data ?? null;
    let apiarioName: string | null = null;
    if (colmena?.apiario_id) {
      const { data: apiario } = await supabase.from("apiarios").select("name").eq("id", colmena.apiario_id).maybeSingle();
      apiarioName = apiario?.name ?? null;
    }

    const { data: muestras } = await supabase
      .from("muestras")
      .select("*")
      .eq("apiario_id", colmena?.apiario_id ?? "")
      .order("fecha", { ascending: false })
      .limit(12);

    const nodosManuales = nodosRes.data ?? [];
    const aristasManuales = aristasRes.data ?? [];

    // Red local: colmena + hoja + cuadros + sanidad + monitoreo + manuales
    const nodos: NodoRedCuaderno[] = [];
    const aristas: AristaRedCuaderno[] = [];
    if (colmena) {
      nodos.push({
        id: colmena.id,
        kind: "colmena",
        label: colmena.name ?? "Colmena",
        estado: colmena.health ?? null,
        apiario_name: apiarioName,
        origen_tipo: colmena.origen_tipo,
        blockchain_hash: colmena.blockchain_hash,
      });
    }
    nodos.push({
      id: hoja.id,
      kind: "hoja",
      label: `Hoja · ${hoja.date}`,
      estado: hoja.fase,
      fecha: hoja.date,
      colmena_id: colmenaId,
    });
    for (const cua of hoja.inspeccion_cuadros ?? []) {
      nodos.push({
        id: cua.id,
        kind: "cuadro",
        label: `#${cua.posicion} ${cua.tipo}`,
        estado: cua.cuerpo,
        descripcion: cua.notas,
      });
    }
    for (const t of tratamientosRes.data ?? []) {
      nodos.push({ id: t.id, kind: "tratamiento", label: t.principio_activo, fecha: t.fecha, estado: t.enfermedad });
    }
    for (const v of varroaRes.data ?? []) {
      nodos.push({ id: v.id, kind: "varroa", label: `Varroa ${v.level}`, fecha: v.date, estado: v.method ?? null });
    }
    for (const m of muestras ?? []) {
      nodos.push({ id: m.id, kind: "muestra", label: m.tipo, fecha: m.fecha, estado: m.patogeno ?? null });
    }
    for (const n of nodosManuales) {
      nodos.push({
        id: n.id,
        kind: "manual",
        label: n.label,
        estado: n.tipo,
        descripcion: n.descripcion,
        x: n.x,
        y: n.y,
        created_at: n.created_at,
        colmena_id: n.colmena_id,
      });
    }

    if (colmena) {
      aristas.push({ id: `registra:${colmena.id}:${hoja.id}`, source_id: colmena.id, target_id: hoja.id, relacion: "registra" });
      if (colmena.origen_colmena_madre) {
        aristas.push({ id: `deriva_de:${colmena.id}:${colmena.origen_colmena_madre}`, source_id: colmena.id, target_id: colmena.origen_colmena_madre, relacion: "deriva_de" });
      }
    }
    for (const cua of hoja.inspeccion_cuadros ?? []) {
      aristas.push({ id: `detalla:${hoja.id}:${cua.id}`, source_id: hoja.id, target_id: cua.id, relacion: "observa" });
    }
    for (const t of tratamientosRes.data ?? []) {
      if (colmena) aristas.push({ id: `trata:${colmena.id}:${t.id}`, source_id: colmena.id, target_id: t.id, relacion: "trata" });
    }
    for (const v of varroaRes.data ?? []) {
      if (colmena) aristas.push({ id: `monitorea:${colmena.id}:${v.id}`, source_id: colmena.id, target_id: v.id, relacion: "monitorea" });
    }
    for (const m of muestras ?? []) {
      if (colmena?.apiario_id) aristas.push({ id: `muestrea:${colmena.apiario_id}:${m.id}`, source_id: colmena.apiario_id, target_id: m.id, relacion: "muestrea" });
    }
    for (const a of aristasManuales) {
      aristas.push({ id: a.id, source_id: a.source_id, target_id: a.target_id, relacion: a.relacion, label: a.label });
    }

    return c.json({
      data: {
        hoja,
        colmena: colmena ? { ...colmena, apiario_name: apiarioName, estado: colmena.health ?? null } : null,
        tratamientos: tratamientosRes.data ?? [],
        muestras: muestras ?? [],
        varroa: varroaRes.data ?? [],
        nodos_manuales: nodosManuales,
        aristas_manuales: aristasManuales,
        alerta_retiro: alerta,
        red: { nodos, aristas, meta: { conteos: { nodos: nodos.length, aristas: aristas.length }, brechas: [] } },
      },
    });
  }
);

/** GET /api/bitacora/red — red semántica global del apiario (Hojas → vista Red). */
bitacoraRoutes.get("/red", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const hoy = hoyISO();

  const [apiariosRes, colmenasRes, inspeccionesRes, tratamientosRes, muestrasRes, varroaRes, nodosRes, aristasRes] =
    await Promise.all([
      supabase.from("apiarios").select("id, name"),
      supabase.from("colmenas").select("id, name, apiario_id, blockchain_hash, origen_tipo, origen_colmena_madre, health, alzas"),
      supabase.from("inspecciones").select("id, colmena_id, date, fase").order("date", { ascending: false }).limit(300),
      supabase.from("tratamientos").select("id, colmena_id, principio_activo, retiro_fin"),
      supabase.from("muestras").select("id, apiario_id, tipo"),
      supabase.from("varroa_records").select("id, colmena_id, date, level").order("date", { ascending: false }).limit(300),
      supabase.from("cuaderno_nodos").select("*"),
      supabase.from("cuaderno_aristas").select("*"),
    ]);
  const error = apiariosRes.error ?? colmenasRes.error ?? inspeccionesRes.error ?? tratamientosRes.error
    ?? muestrasRes.error ?? varroaRes.error ?? nodosRes.error ?? aristasRes.error;
  if (error) return c.json({ error: error.message }, 500);

  const apiarios = apiariosRes.data ?? [];
  const colmenas = colmenasRes.data ?? [];
  const inspecciones = inspeccionesRes.data ?? [];
  const tratamientos = tratamientosRes.data ?? [];
  const muestras = muestrasRes.data ?? [];
  const varroa = varroaRes.data ?? [];
  const nodosManuales = nodosRes.data ?? [];
  const aristasManuales = aristasRes.data ?? [];

  const apiarioName = new Map(apiarios.map((a) => [a.id, a.name]));

  const nodos: NodoRedCuaderno[] = [];
  for (const a of apiarios) nodos.push({ id: a.id, kind: "apiario", label: a.name ?? "Apiario" });
  for (const col of colmenas) {
    nodos.push({
      id: col.id,
      kind: "colmena",
      label: col.name ?? "Colmena",
      estado: col.health ?? null,
      apiario_name: col.apiario_id ? (apiarioName.get(col.apiario_id) ?? null) : null,
      origen_tipo: col.origen_tipo,
      blockchain_hash: col.blockchain_hash,
    });
  }
  for (const ins of inspecciones) {
    nodos.push({ id: ins.id, kind: "hoja", label: `Hoja · ${ins.date}`, estado: ins.fase, fecha: ins.date, colmena_id: ins.colmena_id });
  }
  for (const t of tratamientos) {
    nodos.push({ id: t.id, kind: "tratamiento", label: t.principio_activo, colmena_id: t.colmena_id });
  }
  for (const m of muestras) nodos.push({ id: m.id, kind: "muestra", label: m.tipo });
  for (const v of varroa) nodos.push({ id: v.id, kind: "varroa", label: `Varroa ${v.level}`, fecha: v.date, colmena_id: v.colmena_id });
  for (const n of nodosManuales) {
    nodos.push({ id: n.id, kind: "manual", label: n.label, estado: n.tipo, descripcion: n.descripcion, x: n.x, y: n.y, created_at: n.created_at, colmena_id: n.colmena_id });
  }

  const aristas: AristaRedCuaderno[] = [];
  for (const col of colmenas) {
    if (col.apiario_id) aristas.push({ id: `contiene:${col.apiario_id}:${col.id}`, source_id: col.apiario_id, target_id: col.id, relacion: "contiene" });
    if (col.origen_colmena_madre) aristas.push({ id: `deriva_de:${col.id}:${col.origen_colmena_madre}`, source_id: col.id, target_id: col.origen_colmena_madre, relacion: "deriva_de" });
  }
  for (const ins of inspecciones) {
    if (!ins.colmena_id) continue;
    aristas.push({ id: `registra:${ins.colmena_id}:${ins.id}`, source_id: ins.colmena_id, target_id: ins.id, relacion: "registra" });
  }
  for (const t of tratamientos) {
    aristas.push({ id: `trata:${t.colmena_id}:${t.id}`, source_id: t.colmena_id, target_id: t.id, relacion: "trata" });
  }
  for (const m of muestras) {
    if (m.apiario_id) aristas.push({ id: `muestrea:${m.apiario_id}:${m.id}`, source_id: m.apiario_id, target_id: m.id, relacion: "muestrea" });
  }
  for (const v of varroa) {
    if (!v.colmena_id) continue;
    aristas.push({ id: `monitorea:${v.colmena_id}:${v.id}`, source_id: v.colmena_id, target_id: v.id, relacion: "monitorea" });
  }
  for (const a of aristasManuales) {
    aristas.push({ id: a.id, source_id: a.source_id, target_id: a.target_id, relacion: a.relacion, label: a.label });
  }

  // Brechas por colmena: lo que NO se dice también es información
  const brechas: BrechaColmena[] = [];
  const hojaPorColmena = new Map<string, string>();
  for (const ins of inspecciones) {
    if (!ins.colmena_id) continue;
    const prev = hojaPorColmena.get(ins.colmena_id);
    if (!prev || ins.date > prev) hojaPorColmena.set(ins.colmena_id, ins.date);
  }
  const varroaPorColmena = new Map<string, string>();
  for (const v of varroa) {
    if (!v.colmena_id) continue;
    const prev = varroaPorColmena.get(v.colmena_id);
    if (!prev || v.date > prev) varroaPorColmena.set(v.colmena_id, v.date);
  }
  for (const col of colmenas) {
    const label = col.name ?? "Colmena";
    const ultimaHoja = hojaPorColmena.get(col.id);
    if (!ultimaHoja || diasEntre(ultimaHoja, hoy) > 14) {
      brechas.push({ colmena_id: col.id, colmena_label: label, tipo: "sin_hoja_14d", detalle: ultimaHoja ? `Sin hoja desde ${ultimaHoja} (>14 días)` : "Sin hojas registradas" });
    }
    const ultimaVarroa = varroaPorColmena.get(col.id);
    if (!ultimaVarroa || diasEntre(ultimaVarroa, hoy) > 30) {
      brechas.push({ colmena_id: col.id, colmena_label: label, tipo: "sin_varroa_30d", detalle: ultimaVarroa ? `Sin monitoreo de varroa desde ${ultimaVarroa}` : "Sin monitoreo de varroa" });
    }
    const retiro = tratamientos.find((t) => t.colmena_id === col.id && t.retiro_fin && t.retiro_fin >= hoy);
    if (retiro) {
      brechas.push({ colmena_id: col.id, colmena_label: label, tipo: "retiro_vigente", detalle: `Retiro de ${retiro.principio_activo} hasta ${retiro.retiro_fin}` });
    }
  }

  return c.json({
    data: {
      nodos,
      aristas,
      meta: {
        conteos: {
          apiarios: apiarios.length,
          colmenas: colmenas.length,
          hojas: inspecciones.length,
          tratamientos: tratamientos.length,
          muestras: muestras.length,
          varroa: varroa.length,
          nodos_manuales: nodosManuales.length,
        },
        brechas,
      },
    },
  });
});

/** PATCH /api/bitacora/inspecciones/:id — editar una hoja (cuadros opcionales:
 *  si se envían, se reemplazan). Guard 409 retiro vigente si la fase final es alza. */
bitacoraRoutes.patch(
  "/inspecciones/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateInspeccionSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data: existente, error: existError } = await supabase
      .from("inspecciones")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (existError) return c.json({ error: existError.message }, 500);
    if (!existente) return c.json({ code: "not_found", message: "Hoja no encontrada" }, 404);

    const colmenaId = body.colmena_id ?? existente.colmena_id;
    const fecha = body.fecha ?? existente.date;
    const faseFinal = body.fase ?? existente.fase;
    if (faseFinal === "alza" && colmenaId) {
      const alerta = await computeAlertaRetiro(supabase, colmenaId, fecha);
      if (alerta.vigente) {
        return c.json({ code: "retiro_vigente", message: alerta.mensaje, alerta }, 409);
      }
    }

    const update: Partial<InspeccionRowWithBitacora> = {};
    if (body.colmena_id !== undefined) update.colmena_id = body.colmena_id;
    if (body.fecha !== undefined) update.date = body.fecha;
    if (body.fase !== undefined) update.fase = body.fase;
    if (body.poblacion !== undefined) update.poblacion = body.poblacion;
    if (body.reina !== undefined) update.reina = body.reina;
    if (body.marcos_cria !== undefined) update.marcos_cria = body.marcos_cria;
    if (body.marcos_miel !== undefined) update.marcos_miel = body.marcos_miel;
    if (body.varroa !== undefined) update.varroa = body.varroa;
    if (body.notas !== undefined) update.notes = body.notas;

    let data = existente;
    if (Object.keys(update).length > 0) {
      const { data: updated, error } = await supabase
        .from("inspecciones")
        .update(update)
        .eq("id", id)
        .select()
        .single();
      if (error) return c.json({ error: error.message }, 500);
      data = updated;
    }

    // Reemplazo de cuadros individualizados (§1.1): delete-all + reinsert
    if (body.cuadros !== undefined) {
      const { error: delError } = await supabase
        .from("inspeccion_cuadros")
        .delete()
        .eq("inspeccion_id", id);
      if (delError) return c.json({ error: delError.message }, 500);
      if (body.cuadros.length > 0) {
        const { error: insError } = await supabase.from("inspeccion_cuadros").insert(
          body.cuadros.map((cua) => ({
            inspeccion_id: id,
            posicion: cua.posicion,
            cuerpo: cua.cuerpo,
            tipo: cua.tipo,
            notas: cua.notas ?? null,
            user_id: user.id,
          }))
        );
        if (insError) return c.json({ error: insError.message }, 500);
      }
    }

    return c.json({ data });
  }
);

/** DELETE /api/bitacora/inspecciones/:id — eliminar una hoja (cuadros en cascade). */
bitacoraRoutes.delete(
  "/inspecciones/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("inspecciones").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

/** POST /api/bitacora/varroa — registrar monitoreo de varroa (cuaderno). */
bitacoraRoutes.post(
  "/varroa",
  zValidator("json", CreateVarroaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("varroa_records")
      .insert({
        colmena_id: body.colmena_id,
        date: body.date ?? hoyISO(),
        level: body.level,
        method: body.method ?? null,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

/** GET /api/bitacora/varroa?colmena_id= — monitoreos con nombre de colmena. */
bitacoraRoutes.get("/varroa", async (c) => {
  const supabase = bitacoraClient(c.get("supabase"));
  const { colmena_id } = c.req.query();

  let query = supabase.from("varroa_records").select("*").order("date", { ascending: false });
  if (colmena_id) query = query.eq("colmena_id", colmena_id);

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  const registros = data ?? [];
  const colmenaIds = [...new Set(registros.map((v) => v.colmena_id).filter((id): id is string => Boolean(id)))];
  const { data: colmenas } = await supabase
    .from("colmenas")
    .select("id, name")
    .in("id", colmenaIds.length > 0 ? colmenaIds : [""]);
  const colmenaMap = new Map((colmenas ?? []).map((c) => [c.id, c.name]));

  return c.json({
    data: registros.map((v) => ({ ...v, colmena_name: v.colmena_id ? colmenaMap.get(v.colmena_id) ?? null : null })),
  });
});

/** GET /api/bitacora/varroa/:id — un monitoreo. */
bitacoraRoutes.get(
  "/varroa/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const { data, error } = await supabase.from("varroa_records").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Monitoreo no encontrado" }, 404);
    return c.json({ data });
  }
);

/** PATCH /api/bitacora/varroa/:id — editar monitoreo. */
bitacoraRoutes.patch(
  "/varroa/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateVarroaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const update: Partial<VarroaRow> = {};
    if (body.colmena_id !== undefined) update.colmena_id = body.colmena_id;
    if (body.date !== undefined) update.date = body.date;
    if (body.level !== undefined) update.level = body.level;
    if (body.method !== undefined) update.method = body.method;

    if (Object.keys(update).length === 0) {
      const { data, error } = await supabase.from("varroa_records").select("*").eq("id", id).maybeSingle();
      if (error) return c.json({ error: error.message }, 500);
      if (!data) return c.json({ code: "not_found", message: "Monitoreo no encontrado" }, 404);
      return c.json({ data });
    }

    const { data, error } = await supabase.from("varroa_records").update(update).eq("id", id).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }
);

/** DELETE /api/bitacora/varroa/:id — eliminar monitoreo. */
bitacoraRoutes.delete(
  "/varroa/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("varroa_records").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

/** GET /api/bitacora/tratamientos/:id — un tratamiento. */
bitacoraRoutes.get(
  "/tratamientos/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const { data, error } = await supabase.from("tratamientos").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Tratamiento no encontrado" }, 404);
    return c.json({ data });
  }
);

/** PATCH /api/bitacora/tratamientos/:id — editar tratamiento fitosanitario. */
bitacoraRoutes.patch(
  "/tratamientos/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateTratamientoSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const update: Partial<TratamientoRow> = {};
    if (body.colmena_id !== undefined) update.colmena_id = body.colmena_id;
    if (body.fecha !== undefined) update.fecha = body.fecha;
    if (body.producto_comercial !== undefined) update.producto_comercial = body.producto_comercial;
    if (body.principio_activo !== undefined) update.principio_activo = body.principio_activo;
    if (body.dosis_recomendada !== undefined) update.dosis_recomendada = body.dosis_recomendada;
    if (body.dosis_aplicada !== undefined) update.dosis_aplicada = body.dosis_aplicada;
    if (body.enfermedad !== undefined) update.enfermedad = body.enfermedad;
    if (body.via !== undefined) update.via = body.via;
    if (body.forma !== undefined) update.forma = body.forma;
    if (body.retiro_fin !== undefined) update.retiro_fin = body.retiro_fin;

    if (Object.keys(update).length === 0) {
      const { data, error } = await supabase.from("tratamientos").select("*").eq("id", id).maybeSingle();
      if (error) return c.json({ error: error.message }, 500);
      if (!data) return c.json({ code: "not_found", message: "Tratamiento no encontrado" }, 404);
      return c.json({ data });
    }

    const { data, error } = await supabase.from("tratamientos").update(update).eq("id", id).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }
);

/** DELETE /api/bitacora/tratamientos/:id — eliminar tratamiento. */
bitacoraRoutes.delete(
  "/tratamientos/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("tratamientos").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

/** GET /api/bitacora/muestras/:id — una muestra. */
bitacoraRoutes.get(
  "/muestras/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const { data, error } = await supabase.from("muestras").select("*").eq("id", id).maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ code: "not_found", message: "Muestra no encontrada" }, 404);
    return c.json({ data });
  }
);

/** PATCH /api/bitacora/muestras/:id — editar muestra de laboratorio. */
bitacoraRoutes.patch(
  "/muestras/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateMuestraSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const update: Partial<MuestraRow> = {};
    if (body.apiario_id !== undefined) update.apiario_id = body.apiario_id;
    if (body.fecha !== undefined) update.fecha = body.fecha;
    if (body.tipo !== undefined) update.tipo = body.tipo;
    if (body.n_abejas !== undefined) update.n_abejas = body.n_abejas;
    if (body.cuadros_muestreados !== undefined) update.cuadros_muestreados = body.cuadros_muestreados;
    if (body.lab_nombre !== undefined) update.lab_nombre = body.lab_nombre;
    if (body.lab_fecha !== undefined) update.lab_fecha = body.lab_fecha;
    if (body.resultado !== undefined) update.resultado = body.resultado;
    if (body.patogeno !== undefined) update.patogeno = body.patogeno;
    if (body.es_contramuestra !== undefined) update.es_contramuestra = body.es_contramuestra;
    if (body.confirmado_saneado !== undefined) update.confirmado_saneado = body.confirmado_saneado;

    if (Object.keys(update).length === 0) {
      const { data, error } = await supabase.from("muestras").select("*").eq("id", id).maybeSingle();
      if (error) return c.json({ error: error.message }, 500);
      if (!data) return c.json({ code: "not_found", message: "Muestra no encontrada" }, 404);
      return c.json({ data });
    }

    const { data, error } = await supabase.from("muestras").update(update).eq("id", id).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }
);

/** DELETE /api/bitacora/muestras/:id — eliminar muestra. */
bitacoraRoutes.delete(
  "/muestras/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("muestras").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

// ---------------------------------------------------------------------------
// CAPA MANUAL DE LA RED (nodos/aristas libres del cuaderno apícola)
// ---------------------------------------------------------------------------

/** POST /api/bitacora/nodos — crear nodo manual (observación/decisión/tensión). */
bitacoraRoutes.post(
  "/nodos",
  zValidator("json", CreateNodoManualSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("cuaderno_nodos")
      .insert({
        colmena_id: body.colmena_id ?? null,
        tipo: body.tipo,
        label: body.label,
        descripcion: body.descripcion ?? null,
        x: body.x ?? null,
        y: body.y ?? null,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

/** PATCH /api/bitacora/nodos/:id — editar nodo manual (incluye posición). */
bitacoraRoutes.patch(
  "/nodos/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("json", UpdateNodoManualSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const update: Partial<NodoManualRow> = { updated_at: new Date().toISOString() };
    if (body.colmena_id !== undefined) update.colmena_id = body.colmena_id;
    if (body.tipo !== undefined) update.tipo = body.tipo;
    if (body.label !== undefined) update.label = body.label;
    if (body.descripcion !== undefined) update.descripcion = body.descripcion;
    if (body.x !== undefined) update.x = body.x;
    if (body.y !== undefined) update.y = body.y;

    const { data, error } = await supabase.from("cuaderno_nodos").update(update).eq("id", id).select().single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }
);

/** DELETE /api/bitacora/nodos/:id — eliminar nodo manual. */
bitacoraRoutes.delete(
  "/nodos/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("cuaderno_nodos").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

/** POST /api/bitacora/aristas — conectar dos nodos (modo conectar del lienzo). */
bitacoraRoutes.post(
  "/aristas",
  zValidator("json", CreateAristaSchema),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const user = c.get("user");
    const body = c.req.valid("json");

    if (body.source_id === body.target_id) {
      return c.json({ code: "self_loop", message: "Una arista no puede conectar un nodo consigo mismo" }, 400);
    }

    const { data, error } = await supabase
      .from("cuaderno_aristas")
      .insert({
        source_id: body.source_id,
        target_id: body.target_id,
        relacion: body.relacion,
        label: body.label ?? null,
        user_id: user.id,
      })
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data }, 201);
  }
);

/** DELETE /api/bitacora/aristas/:id — quitar conexión manual. */
bitacoraRoutes.delete(
  "/aristas/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  async (c) => {
    const supabase = bitacoraClient(c.get("supabase"));
    const { id } = c.req.valid("param");

    const { error } = await supabase.from("cuaderno_aristas").delete().eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data: { deleted: id } });
  }
);

// ---------------------------------------------------------------------------
// COSTOS POR COLMENA (B3 — antes tabla fantasma sin consumidores)
// ---------------------------------------------------------------------------

const CostoColmenaSchema = z
  .object({
    horas_anuales: z.number().min(0).nullable().optional(),
    costo_hora: z.number().min(0).nullable().optional(),
    amortizacion_cajon: z.number().min(0).nullable().optional(),
    insumos_anuales: z.number().min(0).nullable().optional(),
  })
  .strict();

/** GET /api/bitacora/costos — costos de todas las colmenas propias (RLS filtra). */
bitacoraRoutes.get("/costos", async (c) => {
  const supabase = c.get("supabase");
  const { data, error } = await supabase.from("costos_colmena").select("*");
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data: data ?? [] });
});

/** PATCH /api/bitacora/costos/:colmenaId — upsert del registro económico. */
bitacoraRoutes.patch(
  "/costos/:colmenaId",
  zValidator("param", z.object({ colmenaId: z.string().uuid() })),
  zValidator("json", CostoColmenaSchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    const profileRole = c.get("profileRole");
    const { colmenaId } = c.req.valid("param");
    const body = c.req.valid("json");

    // Fail-closed: la colmena debe ser propia (admin exceptuado).
    let colmenaQuery = supabase.from("colmenas").select("id, user_id").eq("id", colmenaId);
    if (profileRole !== "admin") colmenaQuery = colmenaQuery.eq("user_id", user.id);
    const { data: colmena, error: colmenaErr } = await colmenaQuery.maybeSingle();
    if (colmenaErr) return c.json({ error: colmenaErr.message }, 500);
    if (!colmena) return c.json({ error: "Colmena no encontrada o sin permiso" }, 404);

    // produccion_kg no es editable: lo deriva el ledger de cosechas (mig A1).
    const { data, error } = await supabase
      .from("costos_colmena")
      .upsert(
        { colmena_id: colmenaId, ...body },
        { onConflict: "colmena_id" },
      )
      .select()
      .single();
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  }
);
