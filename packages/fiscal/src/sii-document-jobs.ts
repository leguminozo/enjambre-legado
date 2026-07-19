import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiiDocumentJobSourceType, SiiJobStatus } from './types';

const MAX_ATTEMPTS = 5;

export type EnqueueSiiJobInput = {
  empresaId: string;
  sourceType: SiiDocumentJobSourceType;
  sourceId: string;
  tipoDte: number;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  scheduledAt?: Date;
};

export type EnqueueSiiJobResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type EmitJobResult = {
  ok: boolean;
  code?: string;
  message?: string;
  trackId?: string;
  estadoSii?: string;
  folio?: number;
};

export type ProcessSiiJobDeps = {
  emitFacturaCompra: (empresaId: string, facturaId: string) => Promise<EmitJobResult>;
  /** Emisión boleta post-venta (checkout). Opcional: si falta, jobs `venta` van a dead_letter. */
  emitBoletaVenta?: (
    empresaId: string,
    input: {
      facturaEmitidaId: string;
      ventaId: string;
      receptorNombre: string;
      detalleLineas?: Array<{ nombre: string; cantidad: number; precioUnitario: number }>;
    },
  ) => Promise<EmitJobResult>;
};

function gastoEstadoFromEmission(estadoSii: string | undefined): string {
  if (estadoSii === 'aceptado') return 'aceptado_sii';
  if (estadoSii === 'rechazado') return 'rechazado_sii';
  return 'enviado_sii';
}

async function syncGastoEstadoFromJob(
  supabase: SupabaseClient,
  sourceType: string,
  sourceId: string,
  estado: string,
): Promise<void> {
  if (sourceType !== 'gasto_extranjero') return;
  await supabase
    .from('gastos_extranjeros')
    .update({ estado })
    .eq('id', sourceId);
}

export async function enqueueSiiDocumentJob(
  supabase: SupabaseClient,
  input: EnqueueSiiJobInput,
): Promise<EnqueueSiiJobResult> {
  const { data, error } = await supabase
    .from('sii_document_jobs')
    .upsert(
      {
        empresa_id: input.empresaId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        tipo_dte: input.tipoDte,
        idempotency_key: input.idempotencyKey,
        status: 'pending' as SiiJobStatus,
        payload: input.payload ?? {},
        scheduled_at: (input.scheduledAt ?? new Date()).toISOString(),
      },
      { onConflict: 'empresa_id,idempotency_key', ignoreDuplicates: true },
    )
    .select('id')
    .single();

  if (data?.id) {
    return { ok: true, id: data.id as string };
  }

  // ignoreDuplicates: existing row may not be returned — resolve by idempotency key
  const { data: existing, error: findErr } = await supabase
    .from('sii_document_jobs')
    .select('id')
    .eq('empresa_id', input.empresaId)
    .eq('idempotency_key', input.idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, id: existing.id as string };
  }

  return {
    ok: false,
    error: error?.message ?? findErr?.message ?? 'No se pudo encolar el job',
  };
}

function nextScheduledAt(attempts: number): string {
  const delayMinutes = Math.min(60, 2 ** attempts);
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

async function markJob(
  supabase: SupabaseClient,
  jobId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await supabase.from('sii_document_jobs').update(patch).eq('id', jobId);
}

const STALE_PROCESSING_MS = 15 * 60_000;

export async function processSiiDocumentJobs(
  supabase: SupabaseClient,
  deps: ProcessSiiJobDeps,
  limit = 10,
): Promise<{ processed: number; completed: number; failed: number; deadLetter: number }> {
  const nowIso = new Date().toISOString();
  const staleIso = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();

  const [dueRes, staleRes] = await Promise.all([
    supabase
      .from('sii_document_jobs')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('scheduled_at', nowIso)
      .lt('attempts', MAX_ATTEMPTS)
      .order('scheduled_at', { ascending: true })
      .limit(limit),
    // Reclaim workers that died mid-flight (status stuck on processing)
    supabase
      .from('sii_document_jobs')
      .select('*')
      .eq('status', 'processing')
      .lt('updated_at', staleIso)
      .lt('attempts', MAX_ATTEMPTS)
      .order('updated_at', { ascending: true })
      .limit(Math.min(5, limit)),
  ]);

  const seen = new Set<string>();
  const jobs: Record<string, unknown>[] = [];
  for (const row of [...(staleRes.data ?? []), ...(dueRes.data ?? [])]) {
    const id = String((row as { id: string }).id);
    if (seen.has(id)) continue;
    seen.add(id);
    jobs.push(row as Record<string, unknown>);
    if (jobs.length >= limit) break;
  }

  if (dueRes.error && !jobs.length) {
    return { processed: 0, completed: 0, failed: 0, deadLetter: 0 };
  }
  if (!jobs.length) {
    return { processed: 0, completed: 0, failed: 0, deadLetter: 0 };
  }

  let completed = 0;
  let failed = 0;
  let deadLetter = 0;

  for (const job of jobs) {
    const jobId = job.id as string;
    const empresaId = job.empresa_id as string;
    const sourceType = job.source_type as string;
    const sourceId = job.source_id as string;
    const attempts = Number(job.attempts ?? 0) + 1;

    await markJob(supabase, jobId, { status: 'processing', attempts });

    const payload = (job.payload ?? {}) as Record<string, unknown>;
    let result: EmitJobResult;

    if (sourceType === 'venta') {
      const facturaEmitidaId = String(payload.facturaEmitidaId ?? '');
      const ventaId = String(payload.ventaId ?? sourceId);
      const receptorNombre = String(payload.receptorNombre ?? 'Consumidor Final');
      if (!facturaEmitidaId || !deps.emitBoletaVenta) {
        await markJob(supabase, jobId, {
          status: 'dead_letter',
          last_error: !deps.emitBoletaVenta
            ? 'emitBoletaVenta no configurado en worker'
            : 'payload.facturaEmitidaId ausente',
          completed_at: new Date().toISOString(),
        });
        deadLetter += 1;
        continue;
      }
      const detalleLineas = Array.isArray(payload.detalleLineas)
        ? (payload.detalleLineas as Array<{
            nombre: string;
            cantidad: number;
            precioUnitario: number;
          }>)
        : undefined;
      result = await deps.emitBoletaVenta(empresaId, {
        facturaEmitidaId,
        ventaId,
        receptorNombre,
        detalleLineas,
      });
    } else {
      const facturaId = String(payload.facturaCompraId ?? '');
      if (!facturaId) {
        await markJob(supabase, jobId, {
          status: 'dead_letter',
          last_error: 'payload.facturaCompraId ausente',
          completed_at: new Date().toISOString(),
        });
        await syncGastoEstadoFromJob(supabase, sourceType, sourceId, 'facturado');
        deadLetter += 1;
        continue;
      }
      result = await deps.emitFacturaCompra(empresaId, facturaId);
    }

    if (result.ok) {
      await markJob(supabase, jobId, {
        status: 'completed',
        last_error: null,
        completed_at: new Date().toISOString(),
        payload: {
          ...payload,
          trackId: result.trackId,
          estadoSii: result.estadoSii,
          folio: result.folio,
        },
      });
      await syncGastoEstadoFromJob(
        supabase,
        sourceType,
        sourceId,
        gastoEstadoFromEmission(result.estadoSii),
      );
      completed += 1;
    } else if (attempts >= MAX_ATTEMPTS) {
      await markJob(supabase, jobId, {
        status: 'dead_letter',
        last_error: result.message ?? result.code ?? 'Emisión fallida',
        completed_at: new Date().toISOString(),
      });
      await syncGastoEstadoFromJob(supabase, sourceType, sourceId, 'rechazado_sii');
      deadLetter += 1;
    } else {
      await markJob(supabase, jobId, {
        status: 'failed',
        last_error: result.message ?? result.code ?? 'Emisión fallida',
        scheduled_at: nextScheduledAt(attempts),
      });
      failed += 1;
    }
  }

  return { processed: jobs.length, completed, failed, deadLetter };
}
