import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from '../gasto-extranjero';
import { convertirALCLP } from '../gasto-extranjero';
import { buildMontos, extractDate, parseEurAmount, parseUsdAmount } from './parser-utils';

function parseClpAmount(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? Math.round(value) : NaN;
}

function extractTotal(text: string): { amount: number; moneda: 'CLP' | 'USD' | 'EUR' } | null {
  const patterns: Array<{ regex: RegExp; moneda: 'CLP' | 'USD' | 'EUR'; parse: (raw: string) => number }> = [
    { regex: /(?:Total|Amount due|Total due|Total charge|Grand total)\s*:?\s*CLP\s*\$?\s*([\d.,]+)/i, moneda: 'CLP', parse: parseClpAmount },
    { regex: /(?:Total|Amount due|Total due|Total charge|Grand total)\s*:?\s*(?:USD|US\$)\s*([\d,]+\.?\d*)/i, moneda: 'USD', parse: parseUsdAmount },
    { regex: /(?:Total|Amount due|Total due|Total charge|Grand total)\s*:?\s*EUR\s*([\d.,]+)/i, moneda: 'EUR', parse: parseEurAmount },
    { regex: /(?:Total|Amount due|Total due|Total charge|Grand total)\s*:?\s*\$\s*([\d,]+\.?\d*)/i, moneda: 'USD', parse: parseUsdAmount },
    { regex: /(?:Total|Amount due|Total due|Total charge|Grand total)\s*:?\s*([\d,]+\.\d{2})/i, moneda: 'USD', parse: parseUsdAmount },
    { regex: /Total\s*\$?\s*([\d.,]+)/i, moneda: 'CLP', parse: parseClpAmount },
  ];

  for (const { regex, moneda, parse } of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    const amount = parse(match[1]);
    if (Number.isFinite(amount) && amount > 0) {
      return { amount, moneda };
    }
  }

  return null;
}

function extractDocumentNumber(text: string): string {
  const match = text.match(
    /(?:Invoice|Receipt|Transaction|Factura|Documento|Order|Trip|Referencia)\s*(?:#|No\.?|number|ID|:)?\s*([\w-]+)/i,
  );
  return match?.[1]?.trim() ?? '';
}

function inferFechaInferida(text: string, fecha: string): boolean {
  const hasExplicit =
    /\d{4}-\d{2}-\d{2}/.test(text) ||
    /\d{1,2}\/\d{1,2}\/\d{4}/.test(text) ||
    /\w{3,9}\s+\d{1,2},?\s+\d{4}/i.test(text);
  if (hasExplicit) return false;
  return fecha === new Date().toISOString().slice(0, 10);
}

export const genericParser: ReceiptParser = {
  id: 'generic',

  detect(): boolean {
    return false;
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const total = extractTotal(text);
    if (!total) return null;

    const moneda = total.moneda === 'CLP' ? config.moneda : total.moneda;
    const montoOriginal = total.amount;
    const montoCLP = convertirALCLP(montoOriginal, moneda, tasaCambio);
    const fechaEmision = extractDate(text);
    const numeroDocumento = extractDocumentNumber(text);
    const { montoNeto, montoExento, montoIva } = buildMontos(montoCLP, config.conIva);

    return {
      proveedorId: config.id,
      proveedorRut: config.rut,
      proveedorNombre: config.nombre,
      proveedorGiro: config.giro,
      montoOriginal,
      monedaOriginal: moneda,
      montoCLP,
      tasaCambio: moneda === 'CLP' ? 1 : tasaCambio,
      montoNeto,
      montoExento,
      montoIva,
      montoTotal: montoCLP,
      fechaEmision,
      numeroDocumento,
      concepto: `Servicio digital ${config.nombre}`,
      detalle: `Gasto ${config.nombre}${numeroDocumento ? ` · Doc ${numeroDocumento}` : ''}`,
    };
  },
};

export function genericParseHints(text: string, fechaEmision: string, monedaDetectada: 'CLP' | 'USD' | 'EUR', configMoneda: ProveedorConfig['moneda']) {
  return {
    fechaInferida: inferFechaInferida(text, fechaEmision),
    monedaInferida: monedaDetectada !== configMoneda && monedaDetectada !== 'CLP',
  };
}