/**
 * Solicitud de Folios (CAF) al SII — builder del XML canónico.
 * Formato: SolicitudDeFolios v1.0 (http://www.sii.cl/XMLSchema).
 * El SII responde con un XML AUTORIZACION que contiene el CAF (parseable con
 * parseCafXml en nucleo).
 */

export interface SolicitudFoliosInput {
  /** RUT del solicitante (la misma empresa, formato 11111111-1 sin puntos) */
  rutSolicitante: string;
  rutEmpresa: string;
  /** DTE_TIPO (39 boleta, 33 factura, etc.) */
  tipoDte: number;
  /** Cantidad de folios a solicitar (SII permite según tipo/tamaño) */
  cantidad: number;
  /** Folios reutilizables (lista separada por comas, vacío = ninguno) */
  foliosReutilizar?: string;
  observaciones?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Genera el XML de SolicitudDeFolios canónico. El elemento raíz se firma
 * después con xmldsig (signXmlRoot en nucleo, reutiliza el P12 del DTE).
 */
export function buildSolicitudFoliosXml(input: SolicitudFoliosInput): string {
  const cantidad = Math.max(1, Math.floor(input.cantidad));
  const foliosReutilizar = input.foliosReutilizar?.trim()
    ? `<FoliosReutilizar>${escapeXml(input.foliosReutilizar.trim())}</FoliosReutilizar>`
    : '<FoliosReutilizar/>';
  const observaciones = input.observaciones?.trim()
    ? `<Observaciones>${escapeXml(input.observaciones.trim())}</Observaciones>`
    : '<Observaciones/>';

  return [
    '<?xml version="1.0" encoding="ISO-8859-1"?>',
    '<SolicitudDeFolios xmlns="http://www.sii.cl/XMLSchema" version="1.0">',
    `  <RutSolicitante>${escapeXml(input.rutSolicitante)}</RutSolicitante>`,
    `  <RutEmpresa>${escapeXml(input.rutEmpresa)}</RutEmpresa>`,
    '  <TipoSolicitud>0</TipoSolicitud>',
    `  <TipoDte>${input.tipoDte}</TipoDte>`,
    `  <Cantidad>${cantidad}</Cantidad>`,
    `  ${foliosReutilizar}`,
    `  ${observaciones}`,
    '</SolicitudDeFolios>',
  ].join('\n');
}
