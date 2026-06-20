import type { GastoExtranjeroResult } from '@enjambre/contable';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertCafAvailable } from './caf-guard';
import { buildGastoIdempotencyKey, findDuplicateGasto } from './gasto-idempotency';
import { periodoFromFecha } from './periodo';
import { enqueueSiiDocumentJob } from './sii-document-jobs';

export type EmitFacturaResult =
  | {
      ok: true;
      trackId: string;
      estadoSii: 'aceptado' | 'rechazado' | 'enviado';
    }
  | { ok: false; code: string; message: string };

export type SyncRcvResult =
  | { ok: true; syncId: string; reconciledCount: number }
  | { ok: false; code: string; message: string };

export type FiscalPipelineDeps = {
  createFacturaCompra: (
    empresaId: string,
    gasto: GastoExtranjeroResult,
  ) => Promise<{ id: string }>;
  emitFacturaCompra: (
    empresaId: string,
    facturaId: string,
  ) => Promise<EmitFacturaResult>;
  syncRcv?: (
    empresaId: string,
    periodo: string,
    tipo: 'compras',
  ) => Promise<SyncRcvResult>;
};

export type ProcessGastoInput = {
  gasto: GastoExtranjeroResult;
  receiptRaw?: string;
  fiscalDocumentId?: string;
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
      encolado?: boolean;
      jobId?: string;
      rcv?: { periodo: string; reconciledCount: number };
      warnings?: string[];
    }
  | { ok: false; code: string; message: string; details?: Record<string, unknown> };

export function isAsyncEmitEnabled(): boolean {
  return process.env.SII_ASYNC_EMIT !== 'false';
}

async function persistGasto(
  supabase: SupabaseClient,
  empresaId: string,
  gasto: GastoExtranjeroResult,
  options: {
    receiptRaw?: string;
    facturaCompraId?: string;
    fiscalDocumentId?: string;
    idempotencyKey: string;
  },
): Promise<{ id: string }> {
  const { receiptRaw, facturaCompraId, fiscalDocumentId, idempotencyKey } = options;

  const { data, error } = await supabase
    .from('gastos_extranjeros')
    .insert({
      empresa_id: empresaId,
      factura_compra_id: facturaCompraId ?? null,
      fiscal_document_id: fiscalDocumentId ?? null,
      idempotency_key: idempotencyKey,
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

  if (fiscalDocumentId) {
    await supabase
      .from('fiscal_documents')
      .update({ gasto_extranjero_id: data.id })
      .eq('id', fiscalDocumentId)
      .eq('empresa_id', empresaId);
  }

  return { id: data.id };
}

async function enqueueEmissionJob(
  supabase: SupabaseClient,
  empresaId: string,
  gastoId: string,
  facturaCompraId: string,
  idempotencyKey?: string,
): Promise<
  | { ok: true; jobId: string }
  | { ok: false; code: string; message: string }
> {
  const enqueue = await enqueueSiiDocumentJob(supabase, {
    empresaId,
    sourceType: 'gasto_extranjero',
    sourceId: gastoId,
    tipoDte: 46,
    idempotencyKey: idempotencyKey ?? `emit-fc46-${facturaCompraId}`,
    payload: { facturaCompraId },
  });

  if (!enqueue.ok) {
    return { ok: false, code: 'enqueue_failed', message: enqueue.error };
  }

  return { ok: true, jobId: enqueue.id };
}

export async function processGastoExtranjero(
  supabase: SupabaseClient,
  empresaId: string,
  input: ProcessGastoInput,
  deps: FiscalPipelineDeps,
): Promise<ProcessGastoResult> {
  const { gasto, receiptRaw, fiscalDocumentId, emitToSii = true, syncRcv = true } = input;
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
    const factura = await deps.createFacturaCompra(empresaId, gasto);
    facturaCompraId = factura.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error creando factura de compra';
    return { ok: false, code: 'factura_create_failed', message, details: { idempotencyKey } };
  }

  const { id: gastoId } = await persistGasto(supabase, empresaId, gasto, {
    receiptRaw,
    facturaCompraId,
    fiscalDocumentId,
    idempotencyKey,
  });

  if (!emitToSii) {
    return {
      ok: true,
      alreadyProcessed: false,
      gastoId,
      facturaCompraId,
      idempotencyKey,
    };
  }

  if (isAsyncEmitEnabled()) {
    const queued = await enqueueEmissionJob(
      supabase,
      empresaId,
      gastoId,
      facturaCompraId,
      `emit-fc46-${facturaCompraId}`,
    );

    if (!queued.ok) {
      return {
        ok: false,
        code: queued.code,
        message: queued.message,
        details: { gastoId, facturaCompraId, idempotencyKey },
      };
    }

    return {
      ok: true,
      alreadyProcessed: false,
      gastoId,
      facturaCompraId,
      idempotencyKey,
      encolado: true,
      jobId: queued.jobId,
      warnings: ['Emisión encolada; el cron fiscal enviará el DTE al SII'],
    };
  }

  const emission = await deps.emitFacturaCompra(empresaId, facturaCompraId);

  if (!emission.ok) {
    const queued = await enqueueEmissionJob(
      supabase,
      empresaId,
      gastoId,
      facturaCompraId,
      `emit-fc46-${facturaCompraId}`,
    );

    return {
      ok: false,
      code: emission.code,
      message: emission.message,
      details: {
        gastoId,
        facturaCompraId,
        idempotencyKey,
        encolado: queued.ok,
        jobId: queued.ok ? queued.jobId : undefined,
        enqueueError: queued.ok ? undefined : queued.message,
      },
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

  if (syncRcv && deps.syncRcv && emission.estadoSii === 'aceptado') {
    try {
      const periodo = periodoFromFecha(gasto.fechaEmision);
      const synced = await deps.syncRcv(empresaId, periodo, 'compras');
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