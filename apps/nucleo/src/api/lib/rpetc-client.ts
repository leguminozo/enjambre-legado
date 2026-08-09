import { SII_ENV, RPETC_ENDPOINTS, REGISTRO_RECLAMO_URLS } from "@enjambre/contable";
import {
  parseRecepcionAec,
  buildGetEstEnvioEnvelope,
  buildGetEstCesionEnvelope,
  buildGetEstCesionRelacEnvelope,
  parseGetEstEnvio,
  parseGetEstCesion,
  parseGetEstCesionRelac,
  buildIngresarAceptacionReclamoEnvelope,
  buildListarEventosHistDocEnvelope,
  buildConsultarDocDteCedibleEnvelope,
  buildConsultarFechaRecepcionSiiEnvelope,
  parseRegistroReclamoRespuesta,
} from "@enjambre/contable";
import type {
  AecEnvioResult,
  RpetcEstEnvioResult,
  RpetcEstCesionResult,
  RegistroReclamoResult,
  AccionReclamoDoc,
  SiiEnvironment,
} from "@enjambre/contable";

const SOAP_HEADERS = {
  "Content-Type": "text/xml; charset=utf-8",
  "SOAPAction": "",
  "User-Agent": "EnjambreDTE/1.0",
};

const NS_DEFAULT = "http://DefaultNamespace";

function rutParts(rut: string): { base: string; dv: string } {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  return { base: clean.slice(0, -1), dv: clean.slice(-1) };
}

/**
 * Upload de Archivo Electrónico de Cesión (AEC) al Registro Público
 * Electrónico de Transferencia de Créditos (multipart RFC1867).
 */
export async function enviarAec(
  env: SiiEnvironment,
  token: string,
  aecXml: string,
  rutEmpresa: string,
  emailNotif: string,
): Promise<AecEnvioResult> {
  const baseUrl = SII_ENV[env];
  const { base, dv } = rutParts(rutEmpresa);

  const formData = new FormData();
  formData.append("emailNotif", emailNotif);
  formData.append("rutCompany", base);
  formData.append("dvCompany", dv);
  formData.append("archivo", new Blob([aecXml], { type: "application/xml" }), `aec_${base}-${dv}_${Date.now()}.xml`);

  const response = await fetch(`${baseUrl}${RPETC_ENDPOINTS.AEC_UPLOAD}`, {
    method: "POST",
    headers: {
      Cookie: `TOKEN=${token}`,
      "User-Agent": "EnjambreDTE/1.0",
    },
    body: formData,
  });

  if (!response.ok) {
    console.error('[RPETC] enviarAec HTTP error', { status: response.status, rutEmpresa });
    return { trackId: "", estado: "error", glosa: `HTTP ${response.status}`, rutSender: "", rutCompany: rutEmpresa, archivo: "", timestamp: "" };
  }

  return parseRecepcionAec(await response.text());
}

/** wsRPETCConsulta.getEstEnvio — estado de un envío de AEC por TrackId. */
export async function consultarEstadoEnvioRpetc(
  env: SiiEnvironment,
  token: string,
  trackId: string,
): Promise<RpetcEstEnvioResult> {
  const baseUrl = SII_ENV[env];
  const response = await fetch(`${baseUrl}${RPETC_ENDPOINTS.WS_RPETC_CONSULTA}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildGetEstEnvioEnvelope(NS_DEFAULT, token, trackId),
  });

  if (!response.ok) {
    console.error('[RPETC] consultarEstadoEnvioRpetc HTTP error', { status: response.status, trackId });
    return { estado: "-1", glosa: `HTTP ${response.status}`, trackId, estadoEnvio: "Otros", descEstado: "" };
  }

  return parseGetEstEnvio(await response.text());
}

/** wsRPETCConsulta.getEstCesion — estado de una cesión (IdCesion opcional). */
export async function consultarCesionRpetc(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  tipoDoc: number,
  folioDoc: number,
  idCesion?: string,
): Promise<RpetcEstCesionResult> {
  const baseUrl = SII_ENV[env];
  const { base, dv } = rutParts(rutEmisor);
  const response = await fetch(`${baseUrl}${RPETC_ENDPOINTS.WS_RPETC_CONSULTA}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildGetEstCesionEnvelope(NS_DEFAULT, token, base, dv, tipoDoc, folioDoc, idCesion),
  });

  if (!response.ok) {
    console.error('[RPETC] consultarCesionRpetc HTTP error', { status: response.status, rutEmisor, tipoDoc, folioDoc });
    return { estado: "-1", glosa: `HTTP ${response.status}`, rutTenedor: "", fechaUltAnot: "", decJurada: "", rutCobranza: "", dirCobranza: "" };
  }

  return parseGetEstCesion(await response.text());
}

/** wsRPETCConsulta.getEstCesionRelac — estado de la cesión para tenedor/receptor vinculado. */
export async function consultarCesionRelacionadaRpetc(
  env: SiiEnvironment,
  token: string,
  rutEmisor: string,
  tipoDoc: number,
  folioDoc: number,
  rutEmpresa: string,
): Promise<RpetcEstCesionResult> {
  const baseUrl = SII_ENV[env];
  const { base, dv } = rutParts(rutEmisor);
  const { base: rutEmpresaBase, dv: dvEmpresa } = rutParts(rutEmpresa);
  const response = await fetch(`${baseUrl}${RPETC_ENDPOINTS.WS_RPETC_CONSULTA}`, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildGetEstCesionRelacEnvelope(NS_DEFAULT, token, base, dv, tipoDoc, folioDoc, rutEmpresaBase, dvEmpresa),
  });

  if (!response.ok) {
    console.error('[RPETC] consultarCesionRelacionadaRpetc HTTP error', { status: response.status, rutEmisor, tipoDoc, folioDoc });
    return { estado: "-1", glosa: `HTTP ${response.status}`, rutTenedor: "", fechaUltAnot: "", decJurada: "", rutCobranza: "", dirCobranza: "" };
  }

  return parseGetEstCesionRelac(await response.text());
}

/**
 * Llamada genérica a WSREGISTRORECLAMODTE (ws1/ws2.sii.cl). El token de la
 * Autenticación Automática se envía como primer parámetro cuando está
 * disponible (el manual autentica con certificado digital).
 */
async function callRegistroReclamo(
  env: SiiEnvironment,
  method: "ingresarAceptacionReclamoDoc" | "listarEventosHistDoc" | "consultarDocDteCedible" | "consultarFechaRecepcionSii",
  buildEnvelope: (ns: string) => string,
  returnTag: string,
): Promise<RegistroReclamoResult> {
  const url = REGISTRO_RECLAMO_URLS[env];
  const response = await fetch(url, {
    method: "POST",
    headers: SOAP_HEADERS,
    body: buildEnvelope(NS_DEFAULT),
  });

  if (!response.ok) {
    console.error(`[RPETC] ${method} HTTP error`, { status: response.status });
    return { codigoRespuesta: "-1", descripcionRespuesta: `HTTP ${response.status}`, eventos: [], rawXml: "" };
  }

  return parseRegistroReclamoRespuesta(await response.text(), returnTag);
}

/** Registra aceptación o reclamo de un DTE recibido (Ley 20.956, 8 días). */
export function ingresarAceptacionReclamo(
  env: SiiEnvironment,
  token: string | undefined,
  rutEmisor: string,
  tipoDoc: number,
  folio: number,
  accionDoc: AccionReclamoDoc,
): Promise<RegistroReclamoResult> {
  const { base, dv } = rutParts(rutEmisor);
  return callRegistroReclamo(
    env,
    "ingresarAceptacionReclamoDoc",
    (ns) => buildIngresarAceptacionReclamoEnvelope(ns, token, base, dv, tipoDoc, folio, accionDoc),
    "ingresarAceptacionReclamoDocReturn",
  );
}

/** Lista los eventos históricos (reclamos/acuses) de un DTE recibido. */
export function listarEventosHistDoc(
  env: SiiEnvironment,
  token: string | undefined,
  rutEmisor: string,
  tipoDoc: number,
  folio: number,
): Promise<RegistroReclamoResult> {
  const { base, dv } = rutParts(rutEmisor);
  return callRegistroReclamo(
    env,
    "listarEventosHistDoc",
    (ns) => buildListarEventosHistDocEnvelope(ns, token, base, dv, tipoDoc, folio),
    "listarEventosHistDocReturn",
  );
}

/** Consulta si el DTE es cedible (RPETC). */
export function consultarDocDteCedible(
  env: SiiEnvironment,
  token: string | undefined,
  rutEmisor: string,
  tipoDoc: number,
  folio: number,
): Promise<RegistroReclamoResult> {
  const { base, dv } = rutParts(rutEmisor);
  return callRegistroReclamo(
    env,
    "consultarDocDteCedible",
    (ns) => buildConsultarDocDteCedibleEnvelope(ns, token, base, dv, tipoDoc, folio),
    "consultarDocDteCedibleReturn",
  );
}

/** Consulta la fecha de recepción del DTE en el SII. */
export function consultarFechaRecepcionSii(
  env: SiiEnvironment,
  token: string | undefined,
  rutEmisor: string,
  tipoDoc: number,
  folio: number,
): Promise<RegistroReclamoResult> {
  const { base, dv } = rutParts(rutEmisor);
  return callRegistroReclamo(
    env,
    "consultarFechaRecepcionSii",
    (ns) => buildConsultarFechaRecepcionSiiEnvelope(ns, token, base, dv, tipoDoc, folio),
    "consultarFechaRecepcionSiiReturn",
  );
}
