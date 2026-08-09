import { escapeXml, formatDateSii, formatRutSii } from "./dte-xml";

/**
 * Mensaje de Respuesta a Documentos Tributarios Electrónicos (formato SII
 * 2005): acuse de recibo de envíos (RecepciónEnvio) o resultado de revisión
 * de documentos (ResultadoDTE). El mensaje se usa EXCLUYENTEMENTE para uno
 * de los dos usos. La firma raíz (root Signature) se aplica en apps/nucleo
 * con signNode sobre el tag "RespuestaDTE".
 */

export interface RespuestaDteCaratula {
  /** RUT del contribuyente que redacta la respuesta (DE). */
  rutResponde: string;
  /** RUT del contribuyente de quien se recibió el envío o los documentos (PARA). */
  rutRecibe: string;
  /** Identificador único de la respuesta asignado por el que responde. */
  nroRespuesta: number;
  contacto?: string;
  telefono?: string;
  correo?: string;
  /** AAAA-MM-DDTHH:MI:SS. Default: momento actual. */
  fchRespuesta?: string;
}

export interface DocumentoRecepcion {
  tipoDocumento: number;
  folio: number;
  fechaEmision: string;
  rutEmisor: string;
  rutReceptor: string;
  montoTotal: number;
  /** 0 OK · 1 Error de Firma · 2 Error RUT Emisor · 3 Error RUT Receptor · 4 DTE Repetido · 99 Otros. */
  estadoRecepcionDoc: number;
  glosaObservacion: string;
}

export interface RecepcionEnvio {
  nombreArchivo: string;
  /** Fecha y hora de recepción del envío (AAAA-MM-DDTHH:MI:SS). */
  fechaRecepcion: string;
  /** Código único asignado por el receptor para identificar el envío. */
  codigoEnvio: number;
  /** Valor del atributo ID del tag EnvioDTE recibido. */
  idEnvio: string;
  /** DigestValue de la firma del envío recibido (opcional). */
  digestEnvio?: string;
  rutEmisor: string;
  rutReceptor: string;
  /** 0 Conforme · 1 Error Schema · 2 Error Firma · 3 RUT Receptor · 90 Archivo Repetido · 91 Ilegible · 99 Otros. */
  estadoRecepcionEnvio: number;
  glosaEstadoRecepcionEnvio: string;
  /** Documentos del envío no recibidos (tabla opcional). */
  documentos?: DocumentoRecepcion[];
}

export interface ResultadoDte {
  tipoDte: number;
  folio: number;
  fechaEmision: string;
  rutEmisor: string;
  rutReceptor: string;
  montoTotal: number;
  /** Identificador del envío en que se recibió el documento. */
  codigoEnvio: string;
  /** 0 Aceptado OK · 1 Aceptado con Discrepancia · 2 Rechazado. */
  estado: number;
  glosa: string;
  /** Código numérico de rechazo o discrepancia (a futuro). */
  codigoMotivo?: number;
}

export const GLOSA_ESTADO_RECEPCION_ENVIO: Record<number, string> = {
  0: "Envío Recibido Conforme",
  1: "Envío Rechazado - Error de Schema",
  2: "Envío Rechazado - Error de Firma",
  3: "Envío Rechazado - RUT Receptor No Corresponde",
  90: "Envío Rechazado - Archivo Repetido",
  91: "Envío Rechazado - Archivo Ilegible",
  99: "Envío Rechazado - Otros",
};

export const GLOSA_ESTADO_RECEPCION_DOC: Record<number, string> = {
  0: "DTE Recibido OK",
  1: "DTE No Recibido - Error de Firma",
  2: "DTE No Recibido - Error en RUT Emisor",
  3: "DTE No Recibido - Error en RUT Receptor",
  4: "DTE No Recibido - DTE Repetido",
  99: "DTE No Recibido - Otros",
};

export const GLOSA_ESTADO_RESULTADO: Record<number, string> = {
  0: "ACEPTADO OK",
  1: "ACEPTADO CON DISCREPANCIAS",
  2: "RECHAZADO",
};

function buildFchRespuesta(fchRespuesta?: string): string {
  if (fchRespuesta) return fchRespuesta;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function buildCaratula(caratula: RespuestaDteCaratula, nroDetalles: number): string {
  const contacto = caratula.contacto !== undefined ? `\n  <Contacto>${escapeXml(caratula.contacto)}</Contacto>` : "";
  const telefono = caratula.telefono !== undefined ? `\n  <Telefono>${escapeXml(caratula.telefono)}</Telefono>` : "";
  const correo = caratula.correo !== undefined ? `\n  <Correo>${escapeXml(caratula.correo)}</Correo>` : "";
  return `<Caratula version="1.0">
  <RutResponde>${formatRutSii(caratula.rutResponde)}</RutResponde>
  <RutRecibe>${formatRutSii(caratula.rutRecibe)}</RutRecibe>
  <NroRespuesta>${caratula.nroRespuesta}</NroRespuesta>
  <NroDetalles>${nroDetalles}</NroDetalles>${contacto}${telefono}${correo}
  <FchRespuesta>${buildFchRespuesta(caratula.fchRespuesta)}</FchRespuesta>
</Caratula>`;
}

function buildDocumentoRecepcion(d: DocumentoRecepcion): string {
  return `<Documento>
  <TipoDocumento>${d.tipoDocumento}</TipoDocumento>
  <Folio>${d.folio}</Folio>
  <FchEmis>${formatDateSii(d.fechaEmision)}</FchEmis>
  <RutEmisor>${formatRutSii(d.rutEmisor)}</RutEmisor>
  <RutReceptor>${formatRutSii(d.rutReceptor)}</RutReceptor>
  <MntTotal>${Math.round(d.montoTotal)}</MntTotal>
  <EstadoRecepDoc>${d.estadoRecepcionDoc}</EstadoRecepDoc>
  <GlosaObservacion>${escapeXml(d.glosaObservacion)}</GlosaObservacion>
</Documento>`;
}

function buildRecepcionEnvio(r: RecepcionEnvio): string {
  const digest = r.digestEnvio !== undefined ? `\n  <DigestEnvio>${r.digestEnvio}</DigestEnvio>` : "";
  const documentos = r.documentos?.map(buildDocumentoRecepcion).join("\n") ?? "";
  const zonaDocumentos = r.documentos && r.documentos.length > 0
    ? `\n  <Documentos>\n${documentos}\n  </Documentos>`
    : "";
  return `<RecepcionEnvio>
  <NmbArchivo>${escapeXml(r.nombreArchivo)}</NmbArchivo>
  <FchRecep>${r.fechaRecepcion}</FchRecep>
  <CodEnvio>${r.codigoEnvio}</CodEnvio>
  <IDEnvio>${escapeXml(r.idEnvio)}</IDEnvio>${digest}
  <RutEmisor>${formatRutSii(r.rutEmisor)}</RutEmisor>
  <RutReceptor>${formatRutSii(r.rutReceptor)}</RutReceptor>
  <EstadoRecepEnv>${r.estadoRecepcionEnvio}</EstadoRecepEnv>
  <GlosaEstadoRecepEnv>${escapeXml(r.glosaEstadoRecepcionEnvio)}</GlosaEstadoRecepEnv>
  <NroDocumentos>${r.documentos?.length ?? 0}</NroDocumentos>${zonaDocumentos}
</RecepcionEnvio>`;
}

function buildResultadoDte(r: ResultadoDte): string {
  const codigoMotivo = r.codigoMotivo !== undefined ? `\n  <CodRchDsc>${r.codigoMotivo}</CodRchDsc>` : "";
  return `<ResultadoDTE>
  <TipoDTE>${r.tipoDte}</TipoDTE>
  <Folio>${r.folio}</Folio>
  <FchEmis>${formatDateSii(r.fechaEmision)}</FchEmis>
  <RutEmisor>${formatRutSii(r.rutEmisor)}</RutEmisor>
  <RutReceptor>${formatRutSii(r.rutReceptor)}</RutReceptor>
  <MntTotal>${Math.round(r.montoTotal)}</MntTotal>
  <CodEnvio>${escapeXml(r.codigoEnvio)}</CodEnvio>
  <Estado>${r.estado}</Estado>
  <Glosa>${escapeXml(r.glosa)}</Glosa>${codigoMotivo}
</ResultadoDTE>`;
}

/**
 * Construye el mensaje de respuesta. El mensaje se usa excluyentemente como
 * acuse de recibo (recepciones) o como resultado de revisión (resultados);
 * al menos uno de los dos debe venir.
 */
export function buildRespuestaDteXml(
  caratula: RespuestaDteCaratula,
  opts: { recepciones?: RecepcionEnvio[]; resultados?: ResultadoDte[] } = {},
): string {
  const recepciones = opts.recepciones ?? [];
  const resultados = opts.resultados ?? [];

  if (recepciones.length > 0 && resultados.length > 0) {
    throw new Error("El mensaje de respuesta es excluyente: acuse de recibo o resultado de documentos, no ambos");
  }
  if (recepciones.length === 0 && resultados.length === 0) {
    throw new Error("El mensaje de respuesta requiere al menos un envío o un documento");
  }

  const nroDetalles = recepciones.length > 0 ? recepciones.length : resultados.length;
  const zonaRecepcion = recepciones.map(buildRecepcionEnvio).join("\n");
  const zonaResultado = resultados.map(buildResultadoDte).join("\n");

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RespuestaDTE xmlns="http://www.sii.cl/SiiDte" version="1.0">
  ${buildCaratula(caratula, nroDetalles)}
  ${zonaRecepcion}
  ${zonaResultado}
</RespuestaDTE>`;
}
