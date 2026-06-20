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

export type ProcessSiiJobDeps = {
  emitFacturaCompra: (empresaId: string, facturaId: string) => Promise<{
    ok: boolean;
    code?: string;
    message?: string;
    trackId?: string;
    estadoSii?: string;
  }>;
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

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo encolar el job' };
  }
  return { ok: true, id: data.id as string };
}

function nextScheduledAt(attempts: number): string {
  const delayMinutes = Math.min(60, 2 ** attempts);
  return new Date(Date.now() + delayMinutes * 60_000).toISOString();
}

export async function processSiiDocumentJobs(
  supabase: SupabaseClient,
  deps: ProcessSiiJobDeps,
  limit = 10,
): Promise<{ processed: number; completed: number; failed: number; deadLetter: number }> {
  const { data: jobs, error } = await supabase
    .from('sii_document_jobs')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lte('scheduled_at', new Date().toISOString())
    .lt('attempts', MAX_ATTEMPTS)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error || !jobs?.length) {
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

    await supabase
      .from('sii_document_jobs')
      .update({ status: 'processing', attempts })
      .eq('id', jobId);

    const payload = (job.payload ?? {}) as Record<string, unknown>;
    const facturaId = String(payload.facturaCompraId ?? '');

    if (!facturaId) {
      await supabase
        .from('sii_document_jobs')
        .update({
          status: 'dead_letter',
          last_error: 'payload.facturaCompraId ausente',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      await syncGastoEstadoFromJob(supabase, sourceType, sourceId, 'facturado');
      deadLetter += 1;
      continue;
    }

    const result = await deps.emitFacturaCompra(empresaId, facturaId);

    if (result.ok) {
      await supabase
        .from('sii_document_jobs')
        .update({
          status: 'completed',
          last_error: null,
          completed_at: new Date().toISOString(),
          payload: { ...payload, trackId: result.trackId, estadoSii: result.estadoSii },
        })
        .eq('id', jobId);
      await syncGastoEstadoFromJob(
        supabase,
        sourceType,
        sourceId,
        gastoEstadoFromEmission(result.estadoSii),
      );
      completed += 1;
    } else if (attempts >= MAX_ATTEMPTS) {
      await supabase
        .from('sii_document_jobs')
        .update({
          status: 'dead_letter',
          last_error: result.message ?? result.code ?? 'Emisión fallida',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);
      await syncGastoEstadoFromJob(supabase, sourceType, sourceId, 'rechazado_sii');
      deadLetter += 1;
    } else {
      await supabase
        .from('sii_document_jobs')
        .update({
          status: 'failed',
          last_error: result.message ?? result.code ?? 'Emisión fallida',
          scheduled_at: nextScheduledAt(attempts),
        })
        .eq('id', jobId);
      failed += 1;
    }
  }

  return { processed: jobs.length, completed, failed, deadLetter };
}