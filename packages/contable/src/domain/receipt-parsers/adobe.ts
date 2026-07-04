import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from '../gasto-extranjero';
import { convertirALCLP } from '../gasto-extranjero';
import { buildMontos, extractDate, parseUsdAmount } from './parser-utils';

export const adobeParser: ReceiptParser = {
  id: 'adobe',

  detect(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('adobe') || lower.includes('creative cloud') || lower.includes('acrobat');
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const totalMatch =
      text.match(/(?:Total|Amount due|Total charged)\s*:?\s*(?:USD|US\$)?\s*([\d,]+\.?\d*)/i) ??
      text.match(/\$\s*([\d,]+\.\d{2})/);
    if (!totalMatch) return null;

    const montoOriginal = parseUsdAmount(totalMatch[1]);
    if (!Number.isFinite(montoOriginal) || montoOriginal <= 0) return null;

    const montoCLP = convertirALCLP(montoOriginal, 'USD', tasaCambio);
    const invoiceMatch = text.match(/(?:Invoice|Receipt)\s*(?:#|number|no\.?|:)?\s*([\w-]+)/i);
    const { montoNeto, montoExento, montoIva } = buildMontos(montoCLP, config.conIva);

    return {
      proveedorId: config.id,
      proveedorRut: config.rut,
      proveedorNombre: config.nombre,
      proveedorGiro: config.giro,
      montoOriginal,
      monedaOriginal: 'USD',
      montoCLP,
      tasaCambio,
      montoNeto,
      montoExento,
      montoIva,
      montoTotal: montoCLP,
      fechaEmision: extractDate(text),
      numeroDocumento: invoiceMatch?.[1] ?? '',
      concepto: 'Suscripción Adobe Creative Cloud',
      detalle: `Adobe${invoiceMatch ? ` · ${invoiceMatch[1]}` : ''}`,
    };
  },
};