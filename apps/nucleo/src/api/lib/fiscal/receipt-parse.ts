import {
  fetchTasaDolar,
  fetchTasaEuro,
  parseReceiptOrchestrated,
  resolveProveedorForParse,
  type ParsedReceipt,
  type ProveedorConfig,
} from '@enjambre/contable';
import { loadProveedorCatalog } from '@enjambre/fiscal';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ReceiptParseRequest = {
  receiptText: string;
  proveedorId?: string;
  catalog?: ProveedorConfig[];
};

export type ReceiptParseFailure = {
  ok: false;
  code: string;
  message: string;
  detectado: string | null;
};

export function isReceiptParseFailure(
  result: ParsedReceipt | ReceiptParseFailure,
): result is ReceiptParseFailure {
  return 'ok' in result && result.ok === false;
}

export async function parseReceiptForEmpresa(
  supabase: SupabaseClient,
  empresaId: string,
  input: ReceiptParseRequest,
): Promise<ParsedReceipt | ReceiptParseFailure> {
  const catalog = input.catalog ?? (await loadProveedorCatalog(supabase, empresaId));
  const proveedor = resolveProveedorForParse(input.receiptText, catalog, input.proveedorId);

  if (!proveedor) {
    return {
      ok: false,
      code: 'proveedor_not_detected',
      message: 'No se detectó proveedor. Selecciona uno del catálogo e intenta de nuevo.',
      detectado: null,
    };
  }

  let tasaCambio = 1;
  if (proveedor.moneda === 'USD') {
    tasaCambio = await fetchTasaDolar();
  } else if (proveedor.moneda === 'EUR') {
    tasaCambio = await fetchTasaEuro();
  }

  const parsed = parseReceiptOrchestrated(input.receiptText, {
    catalog,
    proveedorOverride: proveedor,
    tasaCambio,
  });

  if (!parsed) {
    return {
      ok: false,
      code: 'receipt_parse_failed',
      message: 'No se pudieron extraer montos del documento',
      detectado: proveedor.id,
    };
  }

  return parsed;
}