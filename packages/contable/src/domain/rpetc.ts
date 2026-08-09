import { decodeSoapReturn, parseSiiRespuesta } from "./sii-soap";
import { escapeXml } from "./dte-xml";

/**
 * Registro Público Electrónico de Transferencia de Créditos (RPETC) — SII.
 * Módulo puro: parseo de respuestas de upload AEC, sobres SOAP y parsers de
 * wsRPETCConsulta y WSREGISTRORECLAMODTE, y helpers de JWT para la
 * API-RPETC (OAuth 2.0 cert_credentials). El HTTP y la firma viven en
 * apps/nucleo.
 */

export const RPETC_ENDPOINTS = {
  /** Upload de Archivos Electrónicos de Cesión (multipart RFC1867). */
  AEC_UPLOAD: "/cgi_rtc/RTC/RTCAnotEnvio.cgi",
  /** WS SOAP de consulta de estado de envíos y cesiones. */
  WS_RPETC_CONSULTA: "/DTEWS/services/wsRPETCConsulta",
} as const;

export const REGISTRO_RECLAMO_URLS = {
  CERTIFICACION: "https://ws2.sii.cl/WSREGISTRORECLAMODTECERT/registroreclamodteservice",
  PRODUCCION: "https://ws1.sii.cl/WSREGISTRORECLAMODTE/registroreclamodteservice",
} as const;

export const RPETC_API_URLS = {
  CERTIFICACION: "https://apicert.sii.cl",
  PRODUCCION: "https://api.sii.cl",
} as const;

export const RPETC_API_PATHS = {
  TOKEN: "/oauthsii-v1-ms/extauth/v1/token",
  TOKEN_REFRESH: "/oauthsii-v1-ms/authorization/v1/token",
} as const;

/** Scopes de la API-RPETC (certificados y cesiones por rol). */
export const RPETC_SCOPES = "RTC_TAR RTC_PRO_RES RTC_PRO_TOD RTC_PRO_PER RTC_PRO_EST";

// ---------------------------------------------------------------------------
// AEC — respuesta del upload
// ---------------------------------------------------------------------------

export interface AecEnvioResult {
  trackId: string;
  estado: "aceptado" | "rechazado" | "error";
  glosa: string;
  rutSender: string;
  rutCompany: string;
  archivo: string;
  timestamp: string;
}

export const AEC_STATUS_GLOSA: Record<number, string> = {
  0: "Envío recibido OK",
  1: "Rut usuario autenticado no tiene permiso para enviar en empresa Cedente",
  2: "Error en tamaño del archivo enviado",
  4: "Faltan parámetros de entrada",
  5: "Error de autenticación, TOKEN inválido, no existe o está expirado",
  6: "Empresa no es DTE",
  9: "Error Interno",
  10: "Error Interno",
};

/** Parsea la respuesta <RECEPCIONAEC> del upload de archivos de cesión. */
export function parseRecepcionAec(xml: string): AecEnvioResult {
  const tag = (name: string): string => {
    const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
    return match ? match[1]!.trim() : "";
  };
  const statusRaw = tag("STATUS");
  const status = statusRaw === "" ? -1 : parseInt(statusRaw, 10);
  return {
    trackId: tag("TRACKID"),
    estado: status === 0 ? "aceptado" : status > 0 ? "rechazado" : "error",
    glosa: AEC_STATUS_GLOSA[status] ?? (statusRaw === "" ? "Respuesta sin STATUS" : "Error desconocido"),
    rutSender: tag("RUTSENDER"),
    rutCompany: tag("RUTCOMPANY"),
    archivo: tag("FILE"),
    timestamp: tag("TIMESTAMP"),
  };
}

// ---------------------------------------------------------------------------
// wsRPETCConsulta — SOAP (namespace "http://DefaultNamespace")
// ---------------------------------------------------------------------------

const SOAP_HEAD = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>`;

const SOAP_TAIL = `  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

function buildSoap(namespace: string, method: string, params: string): string {
  return `${SOAP_HEAD}
    <m:${method} xmlns:m="${namespace}">
${params}
    </m:${method}>
${SOAP_TAIL}`;
}

function param(name: string, value: string): string {
  return `      <${name} xsi:type="xsd:string">${escapeXml(value)}</${name}>`;
}

export function buildGetEstEnvioEnvelope(namespace: string, token: string, trackId: string): string {
  return buildSoap(namespace, "getEstEnvio", [param("Token", token), param("TrackId", trackId)].join("\n"));
}

export function buildGetEstCesionEnvelope(
  namespace: string,
  token: string,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folioDoc: number,
  idCesion?: string,
): string {
  const params = [
    param("Token", token),
    param("RutEmisor", rutEmisor),
    param("DVEmisor", dvEmisor),
    param("TipoDoc", String(tipoDoc)),
    param("FolioDoc", String(folioDoc)),
  ];
  if (idCesion !== undefined) params.push(param("IdCesion", idCesion));
  return buildSoap(namespace, "getEstCesion", params.join("\n"));
}

export function buildGetEstCesionRelacEnvelope(
  namespace: string,
  token: string,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folioDoc: number,
  rutEmpresa: string,
  dvEmpresa: string,
): string {
  const params = [
    param("Token", token),
    param("RutEmisor", rutEmisor),
    param("DVEmisor", dvEmisor),
    param("TipoDoc", String(tipoDoc)),
    param("FolioDoc", String(folioDoc)),
    param("RutEmpresa", rutEmpresa),
    param("DVEmpresa", dvEmpresa),
  ];
  return buildSoap(namespace, "getEstCesionRelac", params.join("\n"));
}

/** Estados de ESTADO_ENVIO de getEstEnvio (UPL → EOK/EAN). */
export type RpetcEstadoEnvio =
  | "UPL" | "RCP" | "RSC" | "SOK" | "RFS" | "FSO" | "RCR"
  | "COK" | "VDC" | "RDC" | "VCS" | "RCS" | "EOK" | "EAN" | "Otros";

export interface RpetcEstEnvioResult {
  /** Estado de la operación (0 OK, 1..10, -15). */
  estado: string;
  glosa: string;
  trackId: string;
  estadoEnvio: RpetcEstadoEnvio;
  descEstado: string;
}

export interface RpetcEstCesionResult {
  estado: string;
  glosa: string;
  rutTenedor: string;
  fechaUltAnot: string;
  decJurada: string;
  rutCobranza: string;
  dirCobranza: string;
}

function parseCesionBody(soapXml: string, returnTag: string): RpetcEstCesionResult {
  const inner = decodeSoapReturn(soapXml, returnTag);
  if (!inner) {
    return { estado: "-1", glosa: `Respuesta SOAP sin ${returnTag}`, rutTenedor: "", fechaUltAnot: "", decJurada: "", rutCobranza: "", dirCobranza: "" };
  }
  const resp = parseSiiRespuesta(inner);
  return {
    estado: resp.estado || "-1",
    glosa: resp.glosa,
    rutTenedor: resp.body["RUT_TENEDOR"] ?? "",
    fechaUltAnot: resp.body["FECHA_ULT_ANOT"] ?? "",
    decJurada: resp.body["DEC_JURADA"] ?? "",
    rutCobranza: resp.body["RUT_COBRANZA"] ?? "",
    dirCobranza: resp.body["DIR_COBRANZA"] ?? "",
  };
}

export function parseGetEstEnvio(soapXml: string): RpetcEstEnvioResult {
  const inner = decodeSoapReturn(soapXml, "getEstEnvioReturn");
  if (!inner) {
    return { estado: "-1", glosa: "Respuesta SOAP sin getEstEnvioReturn", trackId: "", estadoEnvio: "Otros", descEstado: "" };
  }
  const resp = parseSiiRespuesta(inner);
  const estadoEnvio = resp.body["ESTADO_ENVIO"] ?? "";
  return {
    estado: resp.estado || "-1",
    glosa: resp.glosa,
    trackId: resp.body["TRACKID"] ?? "",
    estadoEnvio: (estadoEnvio || "Otros") as RpetcEstadoEnvio,
    descEstado: resp.body["DESC_ESTADO"] ?? "",
  };
}

export function parseGetEstCesion(soapXml: string): RpetcEstCesionResult {
  return parseCesionBody(soapXml, "getEstCesionReturn");
}

export function parseGetEstCesionRelac(soapXml: string): RpetcEstCesionResult {
  return parseCesionBody(soapXml, "getEstCesionRelacReturn");
}

// ---------------------------------------------------------------------------
// WSREGISTRORECLAMODTE — aceptación/reclamo de DTE recibido (Ley 20.956)
// ---------------------------------------------------------------------------

/** Acciones del documento (ingresarAceptacionReclamoDoc). */
export type AccionReclamoDoc = "ACD" | "RCD" | "ERM" | "RFP" | "RFT";

export const GLOSAS_REGISTRO_RECLAMO: Record<number, string> = {
  0: "Acción Completada OK",
  1: "Rut Emisor Erróneo",
  2: "Número de Folio Erróneo",
  3: "Tipo de documento no corresponde",
  4: "Acción inválida",
  5: "DTE ya está reclamado",
  6: "No se puede acusar recibo de mercadería de DTE previamente reclamado",
  7: "Evento registrado previamente",
  8: "Pasados 8 días después de la recepción no es posible registrar reclamos o eventos",
  9: "No existen registros de acuerdo a los parámetros ingresados",
  10: "Documento no emitido y/o recibido en el SII desde el 14 de Enero de 2017 en adelante",
  11: "No se puede reclamar DTE previamente aceptado",
  12: "No se puede dar por aceptado DTE previamente rechazado",
  13: "No se puede reclamar DTE previamente registrado como que acusó recibo mercadería",
  14: "Acción autorizada sólo para empresa receptora o emisora",
  15: "Listado de eventos del documento",
  16: "Documento no presenta eventos de reclamos o acuse de recibo",
  17: "Acción autorizada solo para empresa receptora",
  18: "Documento no ha sido recibido",
  19: "Reclamo de mercaderías ya realizado",
  "-1": "Error Interno",
};

export const GLOSAS_CEDIBILIDAD: Record<number, string> = {
  20: "Tipo de documento no es cedible",
  21: "DTE No cedible, referenciado por nota de crédito de anulación dentro de los primeros 8 días",
  22: "No existe registro de reclamo o de recepción de mercadería o servicios",
  23: "DTE Cedible, sin reclamos",
  24: "DTE No Cedible, DTE reclamado por el receptor",
  25: "DTE Cedible, habiendo pasado 8 días se entiende dado acuse de recibo",
};

function buildRegistroReclamo(namespace: string, method: string, params: string): string {
  return buildSoap(namespace, method, params);
}

function reclamoParams(token: string | undefined, rutEmisor: string, dvEmisor: string, tipoDoc: number, folio: number): string {
  const params = [
    param("RutEmisor", rutEmisor),
    param("DvEmisor", dvEmisor),
    param("TipoDoc", String(tipoDoc)),
    param("Folio", String(folio)),
  ];
  if (token !== undefined) params.unshift(param("Token", token));
  return params.join("\n");
}

export function buildIngresarAceptacionReclamoEnvelope(
  namespace: string,
  token: string | undefined,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folio: number,
  accionDoc: AccionReclamoDoc,
): string {
  const params = `${reclamoParams(token, rutEmisor, dvEmisor, tipoDoc, folio)}\n      ${param("AccionDoc", accionDoc)}`;
  return buildRegistroReclamo(namespace, "ingresarAceptacionReclamoDoc", params);
}

export function buildListarEventosHistDocEnvelope(
  namespace: string,
  token: string | undefined,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folio: number,
): string {
  return buildRegistroReclamo(namespace, "listarEventosHistDoc", reclamoParams(token, rutEmisor, dvEmisor, tipoDoc, folio));
}

export function buildConsultarDocDteCedibleEnvelope(
  namespace: string,
  token: string | undefined,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folio: number,
): string {
  return buildRegistroReclamo(namespace, "consultarDocDteCedible", reclamoParams(token, rutEmisor, dvEmisor, tipoDoc, folio));
}

export function buildConsultarFechaRecepcionSiiEnvelope(
  namespace: string,
  token: string | undefined,
  rutEmisor: string,
  dvEmisor: string,
  tipoDoc: number,
  folio: number,
): string {
  return buildRegistroReclamo(namespace, "consultarFechaRecepcionSii", reclamoParams(token, rutEmisor, dvEmisor, tipoDoc, folio));
}

export interface RegistroReclamoResult {
  /** Código de respuesta del WS (0..19, -1). */
  codigoRespuesta: string;
  descripcionRespuesta: string;
  /** Fecha de recepción del documento en el SII (consultarFechaRecepcionSii). */
  fechaRecepcionSii?: string;
  /** Eventos del documento (listarEventosHistDoc), mejor esfuerzo. */
  eventos: Record<string, string>[];
  /** XML interior decodificado (para diagnóstico). */
  rawXml: string;
}

/** Parsea la respuesta de los métodos de WSREGISTRORECLAMODTE. */
export function parseRegistroReclamoRespuesta(soapXml: string, returnTag: string): RegistroReclamoResult {
  const inner = decodeSoapReturn(soapXml, returnTag);
  if (!inner) {
    return { codigoRespuesta: "-1", descripcionRespuesta: `Respuesta SOAP sin ${returnTag}`, eventos: [], rawXml: "" };
  }

  const single = (names: string[]): string => {
    for (const name of names) {
      const match = inner.match(new RegExp(`<${name}>([^<]*)</${name}>`));
      if (match) return match[1]!.trim();
    }
    return "";
  };

  const codigoRespuesta = single(["COD_RESP", "CODIGO_RESPUESTA", "ESTADO", "COD_RESPUESTA"]) || "-1";
  const descripcionRespuesta = single(["DESC_RESP", "DESCRIPCION_RESPUESTA", "GLOSA", "DESC_RESPUESTA"]) || "";
  const fechaRecepcionSii = single(["FECHA_RECEPCION", "FCH_RECEPCION", "FECHA_RECEPCION_SII"]) || undefined;

  // Eventos: bloques repetidos <EventoHistDoc>…</EventoHistDoc> (mejor esfuerzo)
  const eventos: Record<string, string>[] = [];
  const bloquePattern = /<(?:EventoHistDoc|Evento|Reclamo)>([\s\S]*?)<\/(?:EventoHistDoc|Evento|Reclamo)>/g;
  let bloqueMatch: RegExpExecArray | null;
  while ((bloqueMatch = bloquePattern.exec(inner)) !== null) {
    const evento: Record<string, string> = {};
    const tagPattern = /<(?:SII:)?([A-Za-z_][A-Za-z0-9_]*)>([^<]*)<\/(?:SII:)?\1>/g;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagPattern.exec(bloqueMatch[1]!)) !== null) {
      evento[tagMatch[1]!] = tagMatch[2]!.trim();
    }
    if (Object.keys(evento).length > 0) eventos.push(evento);
  }

  return { codigoRespuesta, descripcionRespuesta, fechaRecepcionSii, eventos, rawXml: inner };
}

// ---------------------------------------------------------------------------
// API-RPETC (2025) — JWT RS256 + OAuth 2.0 cert_credentials
// ---------------------------------------------------------------------------

/** Base64url sin padding (JWT). Puro: TextEncoder + btoa (sin Buffer). */
export function base64urlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Convierte base64 estándar (DER del certificado) a base64url sin padding. */
export function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Header del JWT de la API-RPETC: alg RS256 y x5c con el certificado X.509
 * en DER codificado en base64 ESTÁNDAR (no base64url), sin encabezados.
 */
export function buildRpetcJwtHeader(certDerBase64Std: string): string {
  return JSON.stringify({ alg: "RS256", x5c: certDerBase64Std });
}

/**
 * Payload del JWT: aio = RUT del usuario sin dígito verificador, exp = ahora
 * + 600 s (10 min), aud = URL exacta del endpoint de token del ambiente.
 */
export function buildRpetcJwtPayload(aio: string, exp: number, aud: string): string {
  return JSON.stringify({ aio, exp, aud });
}

/** Concatena header.payload para firmar (RS256 sobre ese contenido). */
export function buildJwtSigningInput(headerB64url: string, payloadB64url: string): string {
  return `${headerB64url}.${payloadB64url}`;
}

/** Ensambla el JWT final: header.payload.firma (firma en base64url). */
export function assembleJwt(headerB64url: string, payloadB64url: string, signatureB64url: string): string {
  return `${headerB64url}.${payloadB64url}.${signatureB64url}`;
}

export interface RpetcTokenResponse {
  accessToken: string;
  tokenType: string;
  /** Timestamp Unix de expiración (expires_in de la respuesta). */
  expiresIn: number;
  refreshToken: string;
  scope: string;
  idToken?: string;
}

/** Valida y tipa la respuesta JSON del endpoint de token de la API-RPETC. */
export function parseRpetcTokenResponse(json: unknown): RpetcTokenResponse {
  if (typeof json !== "object" || json === null) {
    throw new Error("Respuesta de token RPETC inválida (no es JSON)");
  }
  const record = json as Record<string, unknown>;
  const accessToken = record["access_token"];
  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error(`Respuesta de token RPETC sin access_token: ${JSON.stringify(record)}`);
  }
  return {
    accessToken,
    tokenType: typeof record["token_type"] === "string" ? record["token_type"] : "Bearer",
    expiresIn: typeof record["expires_in"] === "number" ? record["expires_in"] : 0,
    refreshToken: typeof record["refresh_token"] === "string" ? record["refresh_token"] : "",
    scope: typeof record["scope"] === "string" ? record["scope"] : "",
    idToken: typeof record["id_token"] === "string" ? record["id_token"] : undefined,
  };
}

/** Ruta de tarea asincrónica de la API-RPETC. */
export function buildRpetcTareaPath(
  rut: string,
  dv: string,
  tipo: "cesiones" | "certificados",
  rol: "deudor" | "cedente" | "cesionario",
): string {
  const recurso = tipo === "cesiones" ? "cesiones" : "certificados.cesiones";
  return `/api/api-rpetc/recurso/v1/tarea/${rut}-${dv}/${recurso}.${rol}`;
}

export function buildRpetcResultadoPath(rut: string, dv: string, idTarea: string): string {
  return `/api/api-rpetc/recurso/v1/resultado/${rut}-${dv}/${idTarea}`;
}

export function buildRpetcEstadoTareaPath(rut: string, dv: string, idTarea: string): string {
  return `/api/api-rpetc/recurso/v1/estado/${rut}-${dv}/${idTarea}`;
}

export function buildRpetcEstadosPath(rut: string, dv: string, periodo?: string): string {
  const base = `/api/api-rpetc/recurso/v1/estados/${rut}-${dv}`;
  return periodo !== undefined ? `${base}/periodo/${periodo}` : base;
}
