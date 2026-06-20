import type { GastoExtranjeroResult } from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createFacturaCompraFromGasto } from '@/api/routes/sii/helpers';
import { assertCafAvailable } from './caf-guard';
import { buildGastoIdempotencyKey, findDuplicateGasto } from './gasto-idempotency';
import { emitFacturaCompraToSii } from './emit-factura-compra';
import { periodoFromFecha, syncRcvPeriod } from './rcv-sync';

export type ProcessGastoInput = {
  gasto: GastoExtranjeroResult;
  receiptRaw?: string;
  emitToSii?: boolean;
  syncRcv?: boolean;
};

export type ProcessGastoResult =
  | {
      ok: true;
      alreadyProcessed: boolean;
      gastoId: string;
      facturaCompraId: string;
      idempotencyKey: string;
      emission?: {
        trackId: string;
        estadoSii: string;
      };
      rcv?: { periodo: string; reconciledCount: number };
      warnings?: string[];
    }
  | { ok: false; code: string; message: string; details?: Record<string, unknown> };

async function persistGasto(
  supabase: SupabaseClient,
  empresaId: string,
  gasto: GastoExtranjeroResult,
  receiptRaw?: string,
  facturaCompraId?: string,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('gastos_extranjeros')
    .insert({
      empresa_id: empresaId,
      factura_compra_id: facturaCompraId ?? null,
      proveedor_id: gasto.proveedorId,
      proveedor_rut: gasto.proveedorRut,
      proveedor_nombre: gasto.proveedorNombre,
      monto_original: gasto.montoOriginal,
      moneda_original: gasto.monedaOriginal,
      monto_clp: gasto.montoCLP,
      tasa_cambio: gasto.tasaCambio,
      monto_neto: gasto.montoNeto,
      monto_exento: gasto.montoExento,
      monto_iva: gasto.montoIva,
      monto_total: gasto.montoTotal,
      fecha_emision: gasto.fechaEmision,
      numero_documento: gasto.numeroDocumento || null,
      concepto: gasto.concepto,
      detalle: gasto.detalle || null,
      receipt_raw: receiptRaw ?? null,
      estado: facturaCompraId ? 'facturado' : 'parseado',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo guardar el gasto');
  }

  return { id: data.id };
}

export async function processGastoExtranjero(
  supabase: SupabaseClient,
  empresaId: string,
  input: ProcessGastoInput,
): Promise<ProcessGastoResult> {
  const { gasto, receiptRaw, emitToSii = true, syncRcv = true } = input;
  const idempotencyKey = buildGastoIdempotencyKey(empresaId, gasto);
  const warnings: string[] = [];

  const duplicate = await findDuplicateGasto(supabase, empresaId, gasto);
  if (duplicate?.factura_compra_id) {
    return {
      ok: true,
      alreadyProcessed: true,
      gastoId: duplicate.id,
      facturaCompraId: duplicate.factura_compra_id,
      idempotencyKey,
      warnings: ['Gasto ya procesado anteriormente'],
    };
  }

  try {
    await assertCafAvailable(supabase, empresaId, 46);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'caf_exhausted') {
      return {
        ok: false,
        code: 'caf_exhausted',
        message: err.message,
        details: { idempotencyKey },
      };
    }
    throw err;
  }

  let facturaCompraId: string;
  try {
    const { data: factura } = await createFacturaCompraFromGasto(empresaId, supabase, gasto);
    facturaCompraId = (factura as { id: string }).id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error creando factura de compra';
    return { ok: false, code: 'factura_create_failed', message, details: { idempotencyKey } };
  }

  const { id: gastoId } = await persistGasto(supabase, empresaId, gasto, receiptRaw, facturaCompraId);

  if (!emitToSii) {
    return {
      ok: true,
      alreadyProcessed: false,
      gastoId,
      facturaCompraId,
      idempotencyKey,
    };
  }

  const emission = await emitFacturaCompraToSii(supabase, empresaId, facturaCompraId);

  if (!emission.ok) {
    await supabase
      .from('gastos_extranjeros')
      .update({ estado: 'facturado' })
      .eq('id', gastoId);

    return {
      ok: false,
      code: emission.code,
      message: emission.message,
      details: { gastoId, facturaCompraId, idempotencyKey },
    };
  }

  const gastoEstado =
    emission.estadoSii === 'aceptado' ? 'aceptado_sii' :
    emission.estadoSii === 'rechazado' ? 'rechazado_sii' :
    'enviado_sii';

  await supabase
    .from('gastos_extranjeros')
    .update({ estado: gastoEstado })
    .eq('id', gastoId);

  let rcvResult: ProcessGastoResult extends { ok: true; rcv?: infer R } ? R : never | undefined;

  if (syncRcv && emission.estadoSii === 'aceptado') {
    try {
      const periodo = periodoFromFecha(gasto.fechaEmision);
      const synced = await syncRcvPeriod(supabase, empresaId, periodo, 'compras');
      if (synced.ok) {
        rcvResult = { periodo, reconciledCount: synced.reconciledCount };
      } else {
        warnings.push(`RCV no sincronizado: ${synced.message}`);
      }
    } catch (err) {
      warnings.push(`RCV sync error: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else if (syncRcv && emission.estadoSii === 'enviado') {
    warnings.push('DTE enviado; RCV se sincronizará cuando el cron confirme aceptación en SII');
  }

  return {
    ok: true,
    alreadyProcessed: false,
    gastoId,
    facturaCompraId,
    idempotencyKey,
    emission: {
      trackId: emission.trackId,
      estadoSii: emission.estadoSii,
    },
    rcv: rcvResult,
    warnings: warnings.length ? warnings : undefined,
  };
}