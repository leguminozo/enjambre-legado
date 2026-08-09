import type { DteDocumento, DteEncabezado, DteDetalle, DteReferencia } from "./sii-dte";
import { DTE_TIPO } from "./sii-dte";

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatRutSii(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

export function formatDateSii(isoDate: string): string {
  const dateOnly = isoDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    throw new Error(`Formato de fecha invalido para SII: ${dateOnly}`);
  }
  return dateOnly;
}

export const DTE_NOMBRES: Record<number, string> = {
  [DTE_TIPO.FACTURA_ELECTRONICA]: "FACTURA ELECTRONICA",
  [DTE_TIPO.FACTURA_NO_AFECTA]: "FACTURA NO AFECTA O EXENTA ELECTRONICA",
  [DTE_TIPO.BOLETA_ELECTRONICA]: "BOLETA ELECTRONICA",
  [DTE_TIPO.BOLETA_NO_AFECTA]: "BOLETA NO AFECTA O EXENTA ELECTRONICA",
  [DTE_TIPO.FACTURA_COMPRA]: "FACTURA DE COMPRA",
  [DTE_TIPO.NOTA_CREDITO]: "NOTA DE CREDITO ELECTRONICA",
  [DTE_TIPO.NOTA_DEBITO]: "NOTA DE DEBITO ELECTRONICA",
  [DTE_TIPO.GUIA_DESPACHO]: "GUIA DE DESPACHO ELECTRONICA",
  [DTE_TIPO.BOLETA_HONORARIOS]: "BOLETA DE HONORARIOS ELECTRONICA",
};

function getIndServicio(tipo: number): string | null {
  if (tipo === DTE_TIPO.FACTURA_COMPRA) return "3";
  if (tipo === DTE_TIPO.FACTURA_ELECTRONICA || tipo === DTE_TIPO.FACTURA_NO_AFECTA) return "3";
  if (tipo === DTE_TIPO.BOLETA_ELECTRONICA || tipo === DTE_TIPO.BOLETA_NO_AFECTA) return "3";
  return null;
}

function buildIdDoc(enc: DteEncabezado): string {
  const parts: string[] = [
    `<TipoDTE>${enc.tipoDte}</TipoDTE>`,
    `<Folio>${enc.folio}</Folio>`,
    `<FchEmis>${formatDateSii(enc.fechaEmision)}</FchEmis>`,
  ];

  const indServicio = getIndServicio(enc.tipoDte);
  if (indServicio !== null) {
    parts.push(`<IndServicio>${indServicio}</IndServicio>`);
  }

  parts.push(`<FmaPago>1</FmaPago>`);

  if (enc.tipoDte === DTE_TIPO.GUIA_DESPACHO) {
    parts.push(`<IndTraslado>1</IndTraslado>`);
  }

  return `<IdDoc>\n${parts.join("\n")}\n</IdDoc>`;
}

function buildEncabezado(enc: DteEncabezado): string {
  const esVenta = enc.tipoDte !== DTE_TIPO.FACTURA_COMPRA;
  const emisorLabel = esVenta ? "Emisor" : "Emisor";
  const receptorLabel = esVenta ? "Receptor" : "Receptor";

  return `<Encabezado>
  ${buildIdDoc(enc)}
  <${emisorLabel}>
    <RUTEmisor>${formatRutSii(enc.emisor.rut)}</RUTEmisor>
    <RznSoc>${escapeXml(enc.emisor.razonSocial)}</RznSoc>
    <GiroEmis>${escapeXml(enc.emisor.giro)}</GiroEmis>
    <Acteco>${enc.emisor.actividadEconomica}</Acteco>
    <DirEmisor>${escapeXml(enc.emisor.direccion)}</DirEmisor>
    <CmnaEmisor>${escapeXml(enc.emisor.comuna)}</CmnaEmisor>
    <CiudadEmisor>${escapeXml(enc.emisor.ciudad)}</CiudadEmisor>
  </${emisorLabel}>
  <${receptorLabel}>
    <RUTRecep>${formatRutSii(enc.receptor.rut)}</RUTRecep>
    <RznSocRecep>${escapeXml(enc.receptor.razonSocial)}</RznSocRecep>
    <GiroRecep>${escapeXml(enc.receptor.giro)}</GiroRecep>
    <DirRecep>${escapeXml(enc.receptor.direccion)}</DirRecep>
    <CmnaRecep>${escapeXml(enc.receptor.comuna)}</CmnaRecep>
    <CiudadRecep>${escapeXml(enc.receptor.ciudad)}</CiudadRecep>
  </${receptorLabel}>
  <Totales>
    ${enc.montoNeto > 0 ? `<MntNeto>${Math.round(enc.montoNeto)}</MntNeto>` : ""}
    ${enc.montoExento > 0 ? `<MntExe>${Math.round(enc.montoExento)}</MntExe>` : ""}
    ${enc.montoNeto > 0 ? `<TasaIVA>${enc.tasaIva < 1 ? enc.tasaIva * 100 : enc.tasaIva}</TasaIVA>` : ""}
    ${enc.montoIva > 0 ? `<IVA>${Math.round(enc.montoIva)}</IVA>` : ""}
    ${enc.tasaImp !== undefined ? `<TasaImp>${enc.tasaImp < 1 ? enc.tasaImp * 100 : enc.tasaImp}</TasaImp>` : ""}
    ${enc.montoImp !== undefined ? `<MontoImp>${Math.round(enc.montoImp)}</MontoImp>` : ""}
    <MntTotal>${Math.round(enc.montoTotal)}</MntTotal>
  </Totales>
</Encabezado>`;
}

function buildDetalle(detalle: DteDetalle, index: number): string {
  const codigoItem = detalle.codigoItem
    ? `<CdgItem>\n    <TpoCodigo>${escapeXml(detalle.codigoItem.tipoCodigo)}</TpoCodigo>\n    <VlrCodigo>${escapeXml(detalle.codigoItem.valorCodigo)}</VlrCodigo>\n  </CdgItem>\n  `
    : "";
  // Orden según schema EnvioDTE_v10: NroLinDet, CdgItem, NmbItem, DscItem, QtyRef, IndAgente, UnmdItem, QtyItem, PrcItem, MontoItem, CodImpAdic
  const qtyRef = detalle.cantidadReferencia !== undefined ? `\n  <QtyRef>${detalle.cantidadReferencia}</QtyRef>` : "";
  const indAgente = detalle.indAgente ? `\n  <IndAgente>R</IndAgente>` : "";
  const unmdItem = detalle.unidadMedida ? `\n  <UnmdItem>${escapeXml(detalle.unidadMedida)}</UnmdItem>` : "";
  const unmdRef = detalle.unidadMedidaReferencia ? `\n  <UnmdRef>${escapeXml(detalle.unidadMedidaReferencia)}</UnmdRef>` : "";
  const codImpAdic = detalle.codigoImpuestoAdicional !== undefined
    ? `\n  <CodImpAdic>${detalle.codigoImpuestoAdicional}</CodImpAdic>`
    : "";
  return `<Detalle>
  <NroLinDet>${index + 1}</NroLinDet>
  ${codigoItem}<NmbItem>${escapeXml(detalle.nombre)}</NmbItem>${qtyRef}${indAgente}${unmdItem}${unmdRef}
  <QtyItem>${detalle.cantidad}</QtyItem>
  <PrcItem>${Math.round(detalle.precioUnitario)}</PrcItem>
  <MontoItem>${Math.round(detalle.montoItem)}</MontoItem>${codImpAdic}
</Detalle>`;
}

function buildReferencia(ref: DteReferencia, index: number): string {
  const folio = ref.folio !== undefined ? `\n  <FolioRef>${ref.folio}</FolioRef>` : "";
  const fecha = ref.fecha !== undefined ? `\n  <FchRef>${formatDateSii(ref.fecha)}</FchRef>` : "";
  return `<Referencia>
  <NroLinRef>${index + 1}</NroLinRef>
  <TpoDocRef>${ref.tipoDocumento}</TpoDocRef>${folio}${fecha}
  <RazonRef>${escapeXml(ref.razonReferencia)}</RazonRef>
</Referencia>`;
}

export function buildDteXml(doc: DteDocumento): string {
  const encabezado = buildEncabezado(doc.encabezado);
  const detalles = doc.detalles.map((d, i) => buildDetalle(d, i)).join("\n");
  const referencias = doc.referencias
    ? doc.referencias.map((r, i) => buildReferencia(r, i)).join("\n")
    : "";

  const tipo = doc.encabezado.tipoDte;

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE xmlns="http://www.sii.cl/SiiDte" version="1.0">
  <Documento ID="DTE_${tipo}_${doc.encabezado.folio}">
    ${encabezado}
    ${detalles}
    ${referencias}
  </Documento>
</DTE>`;
}

function extractTipoDte(dteXml: string): number | null {
  const match = dteXml.match(/<TipoDTE>([^<]+)<\/TipoDTE>/);
  return match ? parseInt(match[1]!, 10) : null;
}

function buildSubTotDte(dteXmlList: string[]): string {
  const counts = new Map<number, number>();
  for (const dteXml of dteXmlList) {
    const tipo = extractTipoDte(dteXml);
    if (tipo === null) continue;
    counts.set(tipo, (counts.get(tipo) ?? 0) + 1);
  }
  const subtotales: string[] = [];
  for (const [tipo, count] of counts) {
    subtotales.push(`    <SubTotDTE>\n      <TpoDTE>${tipo}</TpoDTE>\n      <NroDTE>${count}</NroDTE>\n    </SubTotDTE>`);
  }
  return subtotales.join("\n");
}

function buildTmstFirmaEnv(tmstFirmaEnv?: string): string {
  if (tmstFirmaEnv) return tmstFirmaEnv;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function buildEnvioDteXml(
  dteXmlList: string[],
  rutEmisor: string,
  nroResol: number,
  fchResol: string,
  opts: { rutEnvia?: string; tmstFirmaEnv?: string } = {},
): string {
  const rut = formatRutSii(rutEmisor);
  const rutEnvia = formatRutSii(opts.rutEnvia ?? rutEmisor);
  const tmstFirmaEnv = buildTmstFirmaEnv(opts.tmstFirmaEnv);
  const documentos = dteXmlList.join("\n");
  const subTotDte = buildSubTotDte(dteXmlList);

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<EnvioDTE xmlns="http://www.sii.cl/SiiDte" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sii.cl/SiiDte EnvioDTE_v10.xsd" version="1.0">
  <SetDTE ID="SetDoc">
    <Caratula version="1.0">
      <RutEmisor>${rut}</RutEmisor>
      <RutEnvia>${rutEnvia}</RutEnvia>
      <RutReceptor>60803000-K</RutReceptor>
      <FchResol>${fchResol}</FchResol>
      <NroResol>${nroResol}</NroResol>
      <TmstFirmaEnv>${tmstFirmaEnv}</TmstFirmaEnv>
${subTotDte}
    </Caratula>
    ${documentos}
  </SetDTE>
</EnvioDTE>`;
}
