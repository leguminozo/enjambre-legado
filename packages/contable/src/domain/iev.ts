import { escapeXml, formatDateSii, formatRutSii } from "./dte-xml";

/**
 * Información Electrónica de Compras y Ventas (IEV/IEC) según el formato
 * oficial v3.0 (marzo 2016): libros ESPECIAL de ventas (LibroVentaElectronico)
 * y de compras (LibroCompraElectronico), envío TOTAL. Tags y obligatoriedad
 * según el documento "Información Electrónica de Compras y Ventas" del SII.
 */

export interface IevCaratula {
  /** RUT del contribuyente emisor del libro (<RutEmisorLibro>). */
  rutEmisor: string;
  /** RUT del usuario autorizado que hace el envío (<RutEnvia>). */
  rutEnvia?: string;
  nroResol: number;
  fchResol: string;
  /** Período tributario AAAA-MM (los documentos del set deben ser del mismo período). */
  periodoTributario: string;
  /** 1 = ventas, 2 = compras. Obligatorio si el libro es ESPECIAL. */
  folioNotificacion: 1 | 2;
}

export interface IevTotalesPeriodo {
  tipoDoc: number;
  totDoc: number;
  totMntExe: number;
  totMntNeto: number;
  totMntIva: number;
  totMntTotal: number;
}

export interface IevDetalleVenta {
  tipoDoc: number;
  folio: number;
  fechaEmision: string;
  rutDoc: string;
  razonSocialDoc: string;
  montoExento: number;
  montoNeto: number;
  montoIva: number;
  tasaIva: number;
  montoTotal: number;
}

export interface IevDetalleCompra {
  tipoDoc: number;
  folio: number;
  fechaEmision: string;
  rutDoc: string;
  razonSocialDoc: string;
  montoExento: number;
  montoNeto: number;
  montoIva: number;
  tasaIva: number;
  montoTotal: number;
}

function formatTasaImp(tasaIva: number): string {
  return String(tasaIva < 1 ? Math.round(tasaIva * 100) : Math.round(tasaIva));
}

function buildCaratula(caratula: IevCaratula, tipoOperacion: "VENTA" | "COMPRA"): string {
  const periodo = caratula.periodoTributario;
  if (!/^\d{4}-\d{2}$/.test(periodo)) {
    throw new Error(`Formato de periodo tributario invalido para IEV: ${periodo}`);
  }
  const rutEnvia = formatRutSii(caratula.rutEnvia ?? caratula.rutEmisor);
  return `<Caratula version="1.0">
  <RutEmisorLibro>${formatRutSii(caratula.rutEmisor)}</RutEmisorLibro>
  <RutEnvia>${rutEnvia}</RutEnvia>
  <PeriodoTributario>${periodo}</PeriodoTributario>
  <FchResol>${formatDateSii(caratula.fchResol)}</FchResol>
  <NroResol>${caratula.nroResol}</NroResol>
  <TipoOperacion>${tipoOperacion}</TipoOperacion>
  <TipoLibro>ESPECIAL</TipoLibro>
  <TipoEnvio>TOTAL</TipoEnvio>
  <FolioNotificacion>${caratula.folioNotificacion}</FolioNotificacion>
</Caratula>`;
}

function buildTotalesPeriodo(totales: IevTotalesPeriodo): string {
  return `<TotalesPeriodo>
  <TpoDoc>${totales.tipoDoc}</TpoDoc>
  <TotDoc>${totales.totDoc}</TotDoc>
  <TotMntExe>${Math.round(totales.totMntExe)}</TotMntExe>
  <TotMntNeto>${Math.round(totales.totMntNeto)}</TotMntNeto>
  <TotMntIVA>${Math.round(totales.totMntIva)}</TotMntIVA>
  <TotMntTotal>${Math.round(totales.totMntTotal)}</TotMntTotal>
</TotalesPeriodo>`;
}

export function buildIevResumen(
  registros: Pick<IevDetalleVenta, "tipoDoc" | "montoExento" | "montoNeto" | "montoIva" | "montoTotal">[],
): IevTotalesPeriodo[] {
  const acumulado = new Map<number, IevTotalesPeriodo>();
  for (const reg of registros) {
    const actual = acumulado.get(reg.tipoDoc) ?? {
      tipoDoc: reg.tipoDoc,
      totDoc: 0,
      totMntExe: 0,
      totMntNeto: 0,
      totMntIva: 0,
      totMntTotal: 0,
    };
    actual.totDoc += 1;
    actual.totMntExe += reg.montoExento;
    actual.totMntNeto += reg.montoNeto;
    actual.totMntIva += reg.montoIva;
    actual.totMntTotal += reg.montoTotal;
    acumulado.set(reg.tipoDoc, actual);
  }
  return [...acumulado.values()];
}

/** Línea de detalle de ventas (orden de tags según la tabla v3.0). */
function buildDetalleVenta(d: IevDetalleVenta): string {
  return `<DetalleVenta>
  <TpoDoc>${d.tipoDoc}</TpoDoc>
  <NroDoc>${d.folio}</NroDoc>
  <TasaImp>${formatTasaImp(d.tasaIva)}</TasaImp>
  <FchDoc>${formatDateSii(d.fechaEmision)}</FchDoc>
  <RUTDoc>${formatRutSii(d.rutDoc)}</RUTDoc>
  <RznSoc>${escapeXml(d.razonSocialDoc)}</RznSoc>
  <MntExe>${Math.round(d.montoExento)}</MntExe>
  <MntNeto>${Math.round(d.montoNeto)}</MntNeto>
  <MntIVA>${Math.round(d.montoIva)}</MntIVA>
  <MntTotal>${Math.round(d.montoTotal)}</MntTotal>
</DetalleVenta>`;
}

/** Línea de detalle de compras (mismos tags centrales que ventas, v3.0). */
function buildDetalleCompra(d: IevDetalleCompra): string {
  return `<DetalleCompra>
  <TpoDoc>${d.tipoDoc}</TpoDoc>
  <NroDoc>${d.folio}</NroDoc>
  <TasaImp>${formatTasaImp(d.tasaIva)}</TasaImp>
  <FchDoc>${formatDateSii(d.fechaEmision)}</FchDoc>
  <RUTDoc>${formatRutSii(d.rutDoc)}</RUTDoc>
  <RznSoc>${escapeXml(d.razonSocialDoc)}</RznSoc>
  <MntExe>${Math.round(d.montoExento)}</MntExe>
  <MntNeto>${Math.round(d.montoNeto)}</MntNeto>
  <MntIVA>${Math.round(d.montoIva)}</MntIVA>
  <MntTotal>${Math.round(d.montoTotal)}</MntTotal>
</DetalleCompra>`;
}

export function buildIevVentasXml(
  caratula: IevCaratula,
  resumen: IevTotalesPeriodo[],
  detalles: IevDetalleVenta[],
): string {
  const resumenXml = resumen.map(buildTotalesPeriodo).join("\n");
  const detalleXml = detalles.map(buildDetalleVenta).join("\n");

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<LibroVentaElectronico xmlns="http://www.sii.cl/SiiDte" version="1.0">
  ${buildCaratula(caratula, "VENTA")}
  <ResumenPeriodo>
${resumenXml}
  </ResumenPeriodo>
  <Detalle>
${detalleXml}
  </Detalle>
</LibroVentaElectronico>`;
}

export function buildIevComprasXml(
  caratula: IevCaratula,
  resumen: IevTotalesPeriodo[],
  detalles: IevDetalleCompra[],
): string {
  const resumenXml = resumen.map(buildTotalesPeriodo).join("\n");
  const detalleXml = detalles.map(buildDetalleCompra).join("\n");

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<LibroCompraElectronico xmlns="http://www.sii.cl/SiiDte" version="1.0">
  ${buildCaratula(caratula, "COMPRA")}
  <ResumenPeriodo>
${resumenXml}
  </ResumenPeriodo>
  <Detalle>
${detalleXml}
  </Detalle>
</LibroCompraElectronico>`;
}
