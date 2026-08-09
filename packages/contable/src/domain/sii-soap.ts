import type {
  QueryEstDteAvResult,
  QueryEstUpResult,
  ReenvioCorreoResult,
  SiiAuthWsRespuesta,
  SiiUploadEstado,
} from "./sii-dte";
import { escapeXml } from "./dte-xml";

/**
 * Cliente SOAP 1.1 (rpc/encoded) de los WS del SII (DTEWS), según los
 * manuales de desarrollador externo (Autenticación Automática, QueryEstUp,
 * QueryEstDteAv, wsDTECorreo). Solo construcción de sobres y parseo de
 * respuestas: la firma de la semilla y el HTTP viven en apps/nucleo.
 */

export const DTEWS_PATHS = {
  CR_SEED: "/DTEWS/CrSeed.jws",
  GET_TOKEN_FROM_SEED: "/DTEWS/GetTokenFromSeed.jws",
  QUERY_EST_UP: "/DTEWS/QueryEstUp.jws",
  QUERY_EST_DTE_AV: "/DTEWS/QueryEstDteAv.jws",
  WS_DTE_CORREO: "/DTEWS/wsDTECorreo.jws",
} as const;

const SOAP_ENVELOPE_HEAD = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body>`;

const SOAP_ENVELOPE_TAIL = `  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

function buildEnvelope(namespace: string, method: string, params: string): string {
  return `${SOAP_ENVELOPE_HEAD}
    <m:${method} xmlns:m="${namespace}">
${params}
    </m:${method}>
${SOAP_ENVELOPE_TAIL}`;
}

function param(name: string, value: string): string {
  return `      <${name} xsi:type="xsd:string">${escapeXml(value)}</${name}>`;
}

/** CrSeed.getSeed — no lleva parámetros de entrada. */
export function buildGetSeedEnvelope(namespace: string): string {
  return `${SOAP_ENVELOPE_HEAD}
    <m:getSeed xmlns:m="${namespace}"/>
${SOAP_ENVELOPE_TAIL}`;
}

/** GetTokenFromSeed.getToken — pszXml es la semilla firmada (XML escapado). */
export function buildGetTokenEnvelope(namespace: string, signedSeedXml: string): string {
  return buildEnvelope(namespace, "getToken", param("pszXml", signedSeedXml));
}

/** QueryEstUp.getEstUp — estado de un envío (upload) por TrackId. */
export function buildQueryEstUpEnvelope(
  namespace: string,
  rutBase: string,
  dv: string,
  trackId: string,
  token: string,
): string {
  const params = [
    param("RutCompania", rutBase),
    param("DvCompania", dv),
    param("TrackId", trackId),
    param("Token", token),
  ].join("\n");
  return buildEnvelope(namespace, "getEstUp", params);
}

/**
 * QueryEstDteAv.getEstDteAv — consulta avanzada del estado de un DTE.
 * FechaEmisionDte en formato DD-MM-AAAA. FirmaDte = SignatureValue del DTE.
 */
export function buildQueryEstDteAvEnvelope(
  namespace: string,
  rutEmpresa: string,
  dvEmpresa: string,
  rutReceptor: string,
  dvReceptor: string,
  tipoDte: number,
  folio: number,
  fechaEmisionDdMmYyyy: string,
  montoDte: number,
  firmaDte: string,
  token: string,
): string {
  const params = [
    param("RutEmpresa", rutEmpresa),
    param("DvEmpresa", dvEmpresa),
    param("RutReceptor", rutReceptor),
    param("DvReceptor", dvReceptor),
    param("TipoDte", String(tipoDte)),
    param("FolioDte", String(folio)),
    param("FechaEmisionDte", fechaEmisionDdMmYyyy),
    param("MontoDte", String(montoDte)),
    param("FirmaDte", firmaDte),
    param("Token", token),
  ].join("\n");
  return buildEnvelope(namespace, "getEstDteAv", params);
}

/** wsDTECorreo.reenvioCorreo — solicita reenvío del correo de diagnóstico de un TrackId. */
export function buildReenvioCorreoEnvelope(
  namespace: string,
  token: string,
  rutBase: string,
  dv: string,
  trackId: string,
): string {
  const params = [
    param("Token", token),
    param("RutEmpresa", rutBase),
    param("DvEmpresa", dv),
    param("TrackId", trackId),
  ].join("\n");
  return buildEnvelope(namespace, "reenvioCorreo", params);
}

/** Convierte YYYY-MM-DD → DD-MM-AAAA (formato requerido por FechaEmisionDte). */
export function formatDateSiiDdMmYyyy(isoDate: string): string {
  const dateOnly = isoDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new Error(`Formato de fecha invalido para SII: ${dateOnly}`);
  }
  const [yyyy, mm, dd] = dateOnly.split("-");
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Extrae el string XML escapado del interior de <returnTag> de una respuesta
 * SOAP y lo decodifica (patrón getEstDteReturn de los WS del SII).
 */
export function decodeSoapReturn(soapXml: string, returnTag: string): string {
  const match = soapXml.match(new RegExp(`<${returnTag}[^>]*>([\\s\\S]*?)</${returnTag}>`));
  if (!match) return "";
  return match[1]!
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

interface RespuestaBase {
  estado: string;
  glosa: string;
  trackId: string;
  recibido: string;
  numAtencion: string;
  errCode: string;
  glosaErr: string;
  body: Record<string, string>;
}

/**
 * Parseo genérico de un <SII:RESPUESTA>. Los tags pueden venir con o sin
 * prefijo de namespace (SII:ESTADO / ESTADO). Cuando un tag se repite
 * (ESTADO aparece en RESP_HDR y RESP_BODY), gana la última ocurrencia:
 * el estado del documento (RESP_BODY) prevalece sobre el de la operación.
 */
export function parseSiiRespuesta(innerXml: string): RespuestaBase {
  const body: Record<string, string> = {};
  const tagPattern = /<(?:SII:)?([A-Za-z_][A-Za-z0-9_]*)>([^<]*)<\/(?:SII:)?\1>/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(innerXml)) !== null) {
    body[match[1]!] = match[2]!.trim();
  }
  return {
    estado: body["ESTADO"] ?? "",
    glosa: body["GLOSA"] ?? body["GLOSA_ESTADO"] ?? "",
    trackId: body["TRACKID"] ?? "",
    recibido: body["RECIBIDO"] ?? "",
    numAtencion: body["NUM_ATENCION"] ?? "",
    errCode: body["ERR_CODE"] ?? "",
    glosaErr: body["GLOSA_ERR"] ?? "",
    body,
  };
}

function toInt(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function parseQueryEstUp(soapXml: string): QueryEstUpResult {
  const inner = decodeSoapReturn(soapXml, "getEstUpReturn");
  if (!inner) {
    return { estado: "Otros", glosa: "Respuesta SOAP sin getEstUpReturn", trackId: "", numAtencion: "" };
  }
  const resp = parseSiiRespuesta(inner);
  return {
    estado: (resp.estado || "Otros") as SiiUploadEstado,
    glosa: resp.glosa,
    trackId: resp.trackId,
    tipoDocto: resp.body["TIPO_DOCTO"] || undefined,
    informados: toInt(resp.body["INFORMADOS"]),
    aceptados: toInt(resp.body["ACEPTADOS"]),
    rechazados: toInt(resp.body["RECHAZADOS"]),
    reparos: toInt(resp.body["REPAROS"]),
    numAtencion: resp.numAtencion,
  };
}

export function parseQueryEstDteAv(soapXml: string): QueryEstDteAvResult {
  const inner = decodeSoapReturn(soapXml, "getEstDteAvReturn");
  if (!inner) {
    return { estado: "Otros", recibido: "", glosa: "Respuesta SOAP sin getEstDteAvReturn", trackId: "", numAtencion: "" };
  }
  const resp = parseSiiRespuesta(inner);
  return {
    estado: (resp.estado || "Otros") as QueryEstDteAvResult["estado"],
    recibido: (resp.recibido === "SI" || resp.recibido === "NO" ? resp.recibido : "") as QueryEstDteAvResult["recibido"],
    glosa: resp.glosa,
    trackId: resp.trackId,
    numAtencion: resp.numAtencion,
  };
}

export function parseReenvioCorreo(soapXml: string): ReenvioCorreoResult {
  const inner = decodeSoapReturn(soapXml, "reenvioCorreoReturn");
  if (!inner) {
    return { estado: "-1", glosa: "Respuesta SOAP sin reenvioCorreoReturn" };
  }
  const resp = parseSiiRespuesta(inner);
  return { estado: resp.estado || "-1", glosa: resp.glosa };
}

/**
 * Parseo de CrSeed.getSeed (SEMILLA/SEED) y GetTokenFromSeed.getToken (TOKEN).
 * returnTag: "getSeedReturn" | "getTokenReturn".
 */
export function parseAuthWsRespuesta(soapXml: string, returnTag: string): SiiAuthWsRespuesta {
  const inner = decodeSoapReturn(soapXml, returnTag);
  if (!inner) {
    return { estado: "-1", glosa: `Respuesta SOAP sin ${returnTag}` };
  }
  const resp = parseSiiRespuesta(inner);
  return {
    estado: resp.estado || "-1",
    glosa: resp.glosa,
    semilla: resp.body["SEMILLA"] || resp.body["SEED"] || undefined,
    token: resp.body["TOKEN"] || undefined,
  };
}
