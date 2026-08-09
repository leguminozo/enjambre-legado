import { Hono, Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { RPETC_API_URLS, RPETC_API_PATHS } from "@enjambre/contable";
import type { AccionReclamoDoc, SiiEnvironment } from "@enjambre/contable";
import type { AppVariables } from "@/api/lib/middleware";
import { resolveSiiAmbiente, resolveSiiCredentials } from "@/api/lib/sii-credentials";
import { getSiiTokenWs, getSiiToken, extractP12 } from "@/api/lib/sii-client";
import { fromLoose } from "@/api/lib/supabase-loose";
import {
  enviarAec,
  consultarEstadoEnvioRpetc,
  consultarCesionRpetc,
  consultarCesionRelacionadaRpetc,
  ingresarAceptacionReclamo,
  listarEventosHistDoc,
  consultarDocDteCedible,
  consultarFechaRecepcionSii,
} from "@/api/lib/rpetc-client";
import {
  buildRpetcJwt,
  extractRutFromCert,
  getRpetcAccessToken,
  rpetcCrearTarea,
  rpetcEstadoTarea,
  rpetcResultadoTarea,
  rpetcEstados,
} from "@/api/lib/rpetc-api";

export const rpetcRoutes = new Hono<{ Variables: AppVariables }>();

/** Token de sesión SII con fallback WS → legacy (patrón de dte.ts). */
async function getTokenConFallback(
  ambiente: SiiEnvironment,
  creds: { p12Base64: string; p12Password: string; siiClave: string },
  rut: string,
): Promise<string> {
  try {
    return (await getSiiTokenWs(ambiente, creds.p12Base64, creds.p12Password)).token;
  } catch (error) {
    console.warn("[RPETC] getSiiTokenWs fallback a LR.GetToken", error instanceof Error ? error.message : String(error));
    return (await getSiiToken(ambiente, rut, creds.siiClave)).token;
  }
}

async function resolverContexto(c: Context<{ Variables: AppVariables }>) {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const { data: empresaData, error: empresaError } = await supabase
    .from("empresas")
    .select("rut, sii_ambiente")
    .eq("id", empresaId)
    .single();
  if (empresaError || !empresaData) {
    return { ok: false as const, response: c.json({ code: "empresa_not_found", message: "Empresa no encontrada" }, 404) };
  }
  const credsResult = await resolveSiiCredentials(supabase, empresaId);
  if (!credsResult.ok) {
    return { ok: false as const, response: c.json({ code: credsResult.code, message: credsResult.message }, 400) };
  }
  const ambiente = resolveSiiAmbiente(empresaData.sii_ambiente) as SiiEnvironment;
  return { ok: true as const, empresaData, credsResult, ambiente };
}

const AccionSchema = z.enum(["ACD", "RCD", "ERM", "RFP", "RFT"]);

/**
 * Upload de Archivo Electrónico de Cesión (AEC) al Registro de Cesiones.
 */
rpetcRoutes.post(
  "/aec/enviar",
  zValidator(
    "json",
    z.object({
      aec_xml: z.string().min(1),
      email_notif: z.string().email(),
    }),
  ),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await enviarAec(ctx.ambiente, token, input.aec_xml, ctx.empresaData.rut, input.email_notif);
      return c.json({ success: result.estado === "aceptado", data: result }, result.estado === "aceptado" ? 201 : 400);
    } catch (error) {
      console.error("[RPETC AEC] Error:", error);
      return c.json({ code: "aec_failed", message: error instanceof Error ? error.message : "Error al enviar AEC" }, 500);
    }
  },
);

/** wsRPETCConsulta.getEstEnvio — estado de un envío de AEC por TrackId. */
rpetcRoutes.get("/envio/:track_id", async (c) => {
  const trackId = c.req.param("track_id");
  try {
    const ctx = await resolverContexto(c);
    if (!ctx.ok) return ctx.response;
    const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
    const result = await consultarEstadoEnvioRpetc(ctx.ambiente, token, trackId);
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("[RPETC getEstEnvio] Error:", error, { trackId });
    return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al consultar envío" }, 500);
  }
});

/** wsRPETCConsulta.getEstCesion — estado de una cesión (IdCesion opcional). */
rpetcRoutes.get(
  "/cesion",
  zValidator(
    "query",
    z.object({
      rut_emisor: z.string(),
      tipo_doc: z.coerce.number(),
      folio: z.coerce.number(),
      id_cesion: z.string().optional(),
    }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await consultarCesionRpetc(ctx.ambiente, token, query.rut_emisor, query.tipo_doc, query.folio, query.id_cesion);

      // Persistir la consulta (tabla rpetc_cesiones, typegen pendiente)
      const { error: insertError } = await fromLoose(supabase, "rpetc_cesiones").insert({
        empresa_id: empresaId,
        rut_emisor: query.rut_emisor,
        tipo_doc: query.tipo_doc,
        folio: query.folio,
        id_cesion: query.id_cesion ?? null,
        estado_rpetc: result.estado,
        glosa: result.glosa,
        rut_tenedor: result.rutTenedor || null,
        fecha_ult_anot: result.fechaUltAnot || null,
        dec_jurada: result.decJurada || null,
        rut_cobranza: result.rutCobranza || null,
        dir_cobranza: result.dirCobranza || null,
      });
      if (insertError) {
        console.error("[RPETC cesión] no se pudo persistir la consulta", insertError.message);
      }

      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC getEstCesion] Error:", error);
      return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al consultar cesión" }, 500);
    }
  },
);

/** wsRPETCConsulta.getEstCesionRelac — estado de la cesión para tenedor/receptor vinculado. */
rpetcRoutes.get(
  "/cesion-relacionada",
  zValidator(
    "query",
    z.object({
      rut_emisor: z.string(),
      tipo_doc: z.coerce.number(),
      folio: z.coerce.number(),
      rut_empresa: z.string(),
    }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await consultarCesionRelacionadaRpetc(ctx.ambiente, token, query.rut_emisor, query.tipo_doc, query.folio, query.rut_empresa);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC getEstCesionRelac] Error:", error);
      return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al consultar cesión relacionada" }, 500);
    }
  },
);

/** WSREGISTRORECLAMODTE — registra aceptación o reclamo de un DTE recibido (Ley 20.956). */
rpetcRoutes.post(
  "/reclamo/registrar",
  zValidator(
    "json",
    z.object({
      rut_emisor: z.string(),
      tipo_doc: z.number().refine((v) => [33, 34, 43].includes(v), "Tipo de documento no corresponde (33/34/43)"),
      folio: z.number().positive(),
      accion: AccionSchema,
    }),
  ),
  async (c) => {
    const input = c.req.valid("json");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await ingresarAceptacionReclamo(
        ctx.ambiente,
        token,
        input.rut_emisor,
        input.tipo_doc,
        input.folio,
        input.accion as AccionReclamoDoc,
      );

      // Persistir el evento (tabla rpetc_reclamos, typegen pendiente)
      const { error: insertError } = await fromLoose(supabase, "rpetc_reclamos").insert({
        empresa_id: empresaId,
        rut_emisor: input.rut_emisor,
        tipo_doc: input.tipo_doc,
        folio: input.folio,
        accion: input.accion,
        codigo_respuesta: result.codigoRespuesta,
        descripcion_respuesta: result.descripcionRespuesta || null,
      });
      if (insertError) {
        console.error("[RPETC reclamo] no se pudo persistir el evento", insertError.message);
      }

      return c.json({ success: result.codigoRespuesta === "0" || result.codigoRespuesta === "1", data: result });
    } catch (error) {
      console.error("[RPETC reclamo] Error:", error);
      return c.json({ code: "reclamo_failed", message: error instanceof Error ? error.message : "Error al registrar reclamo" }, 500);
    }
  },
);

/** WSREGISTRORECLAMODTE — lista los eventos históricos del DTE recibido. */
rpetcRoutes.get(
  "/reclamo/eventos",
  zValidator(
    "query",
    z.object({ rut_emisor: z.string(), tipo_doc: z.coerce.number(), folio: z.coerce.number() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await listarEventosHistDoc(ctx.ambiente, token, query.rut_emisor, query.tipo_doc, query.folio);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC eventos] Error:", error);
      return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al listar eventos" }, 500);
    }
  },
);

/** WSREGISTRORECLAMODTE — consulta si el DTE es cedible. */
rpetcRoutes.get(
  "/reclamo/cedible",
  zValidator(
    "query",
    z.object({ rut_emisor: z.string(), tipo_doc: z.coerce.number(), folio: z.coerce.number() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await consultarDocDteCedible(ctx.ambiente, token, query.rut_emisor, query.tipo_doc, query.folio);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC cedible] Error:", error);
      return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al consultar cedibilidad" }, 500);
    }
  },
);

/** WSREGISTRORECLAMODTE — fecha de recepción del DTE en el SII. */
rpetcRoutes.get(
  "/reclamo/fecha-recepcion",
  zValidator(
    "query",
    z.object({ rut_emisor: z.string(), tipo_doc: z.coerce.number(), folio: z.coerce.number() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const token = await getTokenConFallback(ctx.ambiente, ctx.credsResult.credentials, ctx.empresaData.rut);
      const result = await consultarFechaRecepcionSii(ctx.ambiente, token, query.rut_emisor, query.tipo_doc, query.folio);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC fecha recepción] Error:", error);
      return c.json({ code: "rpetc_query_failed", message: error instanceof Error ? error.message : "Error al consultar fecha de recepción" }, 500);
    }
  },
);

// ---------------------------------------------------------------------------
// API-RPETC (2025): OAuth 2.0 cert_credentials + tareas asincrónicas
// ---------------------------------------------------------------------------

/** Credenciales de la API-RPETC desde el entorno (Basic auth). */
function rpetcApiCreds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.RPETC_CLIENT_ID ?? "";
  const clientSecret = process.env.RPETC_CLIENT_SECRET ?? "";
  if (!clientId || !clientSecret) {
    throw new Error("Faltan RPETC_CLIENT_ID / RPETC_CLIENT_SECRET en el entorno");
  }
  return { clientId, clientSecret };
}

/** JWT firmado + access token de la API-RPETC. */
async function rpetcAccessToken(
  ambiente: SiiEnvironment,
  creds: { p12Base64: string; p12Password: string },
  aioOverride?: string,
): Promise<string> {
  const { privateKeyPem, certPem } = extractP12(creds.p12Base64, creds.p12Password);
  const aio = aioOverride ?? extractRutFromCert(certPem);
  if (!aio) {
    throw new Error("No se pudo determinar el RUT (aio) del certificado para la API-RPETC");
  }
  const aud = `${RPETC_API_URLS[ambiente]}${RPETC_API_PATHS.TOKEN}`;
  const jwt = buildRpetcJwt(aio, aud, creds.p12Base64, creds.p12Password);
  const token = await getRpetcAccessToken(ambiente, rpetcApiCreds(), jwt);
  return token.accessToken;
}

/** Genera una tarea asincrónica de cesiones o certificados (API-RPETC). */
rpetcRoutes.post(
  "/api/tarea",
  zValidator(
    "json",
    z.object({
      tipo: z.enum(["cesiones", "certificados"]),
      rol: z.enum(["deudor", "cedente", "cesionario"]),
      rut: z.string(),
      dv: z.string().max(1),
      aio: z.string().optional(),
      body: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const accessToken = await rpetcAccessToken(ctx.ambiente, ctx.credsResult.credentials, input.aio);
      const result = await rpetcCrearTarea(ctx.ambiente, accessToken, input.rut, input.dv, input.tipo, input.rol, input.body);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      console.error("[RPETC API tarea] Error:", error);
      return c.json({ code: "rpetc_api_failed", message: error instanceof Error ? error.message : "Error al crear tarea RPETC" }, 500);
    }
  },
);

/** Estado de una tarea asincrónica (API-RPETC). */
rpetcRoutes.get(
  "/api/tarea/estado",
  zValidator(
    "query",
    z.object({ rut: z.string(), dv: z.string().max(1), id_tarea: z.string(), aio: z.string().optional() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const accessToken = await rpetcAccessToken(ctx.ambiente, ctx.credsResult.credentials, query.aio);
      const result = await rpetcEstadoTarea(ctx.ambiente, accessToken, query.rut, query.dv, query.id_tarea);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC API estado] Error:", error);
      return c.json({ code: "rpetc_api_failed", message: error instanceof Error ? error.message : "Error al consultar estado de tarea" }, 500);
    }
  },
);

/** Archivo con el resultado de la tarea (API-RPETC). */
rpetcRoutes.get(
  "/api/tarea/resultado",
  zValidator(
    "query",
    z.object({ rut: z.string(), dv: z.string().max(1), id_tarea: z.string(), aio: z.string().optional() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const accessToken = await rpetcAccessToken(ctx.ambiente, ctx.credsResult.credentials, query.aio);
      const result = await rpetcResultadoTarea(ctx.ambiente, accessToken, query.rut, query.dv, query.id_tarea);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC API resultado] Error:", error);
      return c.json({ code: "rpetc_api_failed", message: error instanceof Error ? error.message : "Error al consultar resultado de tarea" }, 500);
    }
  },
);

/** Estado de tareas por emisor (API-RPETC), opcional por período. */
rpetcRoutes.get(
  "/api/estados",
  zValidator(
    "query",
    z.object({ rut: z.string(), dv: z.string().max(1), periodo: z.string().regex(/^\d{4}-\d{2}$/).optional(), aio: z.string().optional() }),
  ),
  async (c) => {
    const query = c.req.valid("query");
    try {
      const ctx = await resolverContexto(c);
      if (!ctx.ok) return ctx.response;
      const accessToken = await rpetcAccessToken(ctx.ambiente, ctx.credsResult.credentials, query.aio);
      const result = await rpetcEstados(ctx.ambiente, accessToken, query.rut, query.dv, query.periodo);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error("[RPETC API estados] Error:", error);
      return c.json({ code: "rpetc_api_failed", message: error instanceof Error ? error.message : "Error al consultar estados RPETC" }, 500);
    }
  },
);

// Named export only, no default export

/** Historial de consultas de cesión persistidas de la empresa. */
rpetcRoutes.get("/cesiones", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  try {
    const { data, error } = await fromLoose(supabase, "rpetc_cesiones")
      .select("id, rut_emisor, tipo_doc, folio, id_cesion, estado_rpetc, glosa, rut_tenedor, fecha_ult_anot, dec_jurada, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return c.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("[RPETC cesiones list] Error:", error);
    return c.json({ code: "rpetc_list_failed", message: error instanceof Error ? error.message : "Error al listar cesiones" }, 500);
  }
});

/** Historial de reclamos/aceptaciones persistidos de la empresa. */
rpetcRoutes.get("/reclamos", async (c) => {
  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  try {
    const { data, error } = await fromLoose(supabase, "rpetc_reclamos")
      .select("id, rut_emisor, tipo_doc, folio, accion, codigo_respuesta, descripcion_respuesta, created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return c.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("[RPETC reclamos list] Error:", error);
    return c.json({ code: "rpetc_list_failed", message: error instanceof Error ? error.message : "Error al listar reclamos" }, 500);
  }
});
