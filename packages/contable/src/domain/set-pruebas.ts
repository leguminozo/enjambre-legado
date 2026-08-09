import type { DteDetalle, DteDocumento, DteEmisor, DteReceptor, DteReferencia, DteTipo } from "./sii-dte";
import { DTE_TIPO } from "./sii-dte";
import { buildDteXml, buildEnvioDteXml, formatDateSii, formatRutSii } from "./dte-xml";

/**
 * Generador de DTEs del Set de Pruebas de certificación SII.
 * Reglas aplicadas (documento "Instrucciones para la construcción de
 * documentos tributarios electrónicos con los datos del set de pruebas"):
 * - Referencia obligatoria en línea 1: TpoDocRef = "SET", RazonRef = "CASO xxxxx-x".
 * - RUT receptor distinto para cada factura del set.
 * - Líneas de detalle en el orden especificado, sin líneas adicionales.
 * - Tasa de IVA según la fecha de emisión.
 */

export interface SetPruebasCaso {
  /** Número del caso tal como lo entrega el SII (ej. "1062-1"). */
  numero: string;
  tipoDte: DteTipo;
  /** Folio autorizado asignado a este documento. */
  folio: number;
  fechaEmision: string;
  receptor: DteReceptor;
  /** Glosa exacta, cantidad y precio unitario indicados en el caso (en orden). */
  detalles: DteDetalle[];
  montoExento?: number;
  /** Referencias adicionales (se emiten desde la línea 2 en adelante). */
  referenciasAdicionales?: DteReferencia[];
}

export interface SetPruebasEnvioOptions {
  rutEnvia?: string;
  tmstFirmaEnv?: string;
  tasaIVA?: number;
}

/**
 * Tasa de IVA vigente en Chile según la fecha de emisión: 18% hasta el
 * 30/09/2003 y 19% desde el 01/10/2003 (instrucción: usar la tasa que
 * corresponda a la fecha de emisión del DTE).
 */
export function tasaIvaParaFecha(isoDate: string): number {
  const date = formatDateSii(isoDate);
  return date >= "2003-10-01" ? 0.19 : 0.18;
}

export function buildDteSetPruebas(
  caso: SetPruebasCaso,
  emisor: DteEmisor,
  options: SetPruebasEnvioOptions = {},
): DteDocumento {
  if (caso.detalles.length === 0) {
    throw new Error(`Caso ${caso.numero}: el detalle no puede estar vacio`);
  }

  const montoNeto = caso.detalles.reduce((acc, d) => acc + Math.round(d.montoItem), 0);
  const tasaIva = options.tasaIVA ?? tasaIvaParaFecha(caso.fechaEmision);
  // El SII trunca el IVA (ej. manual: 426226 × 18% = 76720.68 → 76720)
  const montoIva = Math.floor(montoNeto * tasaIva);
  const montoExento = caso.montoExento ?? 0;
  const montoTotal = montoNeto + montoIva + montoExento;

  const referenciaSet: DteReferencia = {
    tipoDocumento: "SET",
    razonReferencia: `CASO ${caso.numero}`,
  };

  return {
    encabezado: {
      tipoDte: caso.tipoDte,
      folio: caso.folio,
      fechaEmision: formatDateSii(caso.fechaEmision),
      emisor,
      receptor: caso.receptor,
      montoNeto,
      montoExento,
      tasaIva,
      montoIva,
      montoTotal,
    },
    detalles: caso.detalles,
    referencias: [referenciaSet, ...(caso.referenciasAdicionales ?? [])],
  };
}

/**
 * Nota de Crédito por devolución de mercaderías: el precio unitario debe
 * corresponder al precio de la Factura original.
 */
export function calcularMontoNotaCreditoDevolucion(
  cantidadDevuelta: number,
  precioUnitarioFacturaOriginal: number,
): number {
  return Math.round(cantidadDevuelta * precioUnitarioFacturaOriginal);
}

/**
 * Nota de Crédito por diferencia de precio: la diferencia se aplica a todas
 * las unidades del ítem (nuevoPrecio menor al original).
 */
export function calcularMontoNotaCreditoDiferencia(
  cantidad: number,
  precioUnitarioOriginal: number,
  nuevoPrecioUnitario: number,
): number {
  return Math.round(cantidad * (precioUnitarioOriginal - nuevoPrecioUnitario));
}

export function assertRutsReceptorDistintos(documentos: DteDocumento[]): void {
  const vistos = new Map<string, number>();
  for (const doc of documentos) {
    const rut = formatRutSii(doc.encabezado.receptor.rut);
    const duplicado = vistos.get(rut);
    if (duplicado !== undefined) {
      throw new Error(`RUT receptor ${rut} repetido en los documentos ${duplicado} y ${doc.encabezado.folio}`);
    }
    vistos.set(rut, doc.encabezado.folio);
  }
}

/**
 * Construye el EnvioDTE único del set: todos los documentos, en el mismo
 * orden en que fueron entregados por el SII. El firmado y timbrado de cada
 * DTE se hace aguas abajo (apps/nucleo) antes de llamar a esta función.
 */
export function buildSetPruebasEnvio(
  dteXmlList: string[],
  rutEmisor: string,
  nroResol: number,
  fchResol: string,
  options: SetPruebasEnvioOptions = {},
): string {
  return buildEnvioDteXml(dteXmlList, rutEmisor, nroResol, fchResol, {
    rutEnvia: options.rutEnvia,
    tmstFirmaEnv: options.tmstFirmaEnv,
  });
}

/** RUT del SII como receptor de los envíos de certificación. */
export const RUT_RECEPTOR_SII = "60803000-K";

export { DTE_TIPO };
