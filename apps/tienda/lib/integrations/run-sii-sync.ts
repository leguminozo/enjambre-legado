import { parseIntegrationsEnv } from '@/lib/integrations-env';
import { resolveSiiConnector } from './registry';
import type { RunSiiSyncJobResult, SiiSyncContext } from './types';

type RunOpts = {
  supabase: SiiSyncContext['supabase'];
  userId: string;
};

export async function runSiiSyncJob(opts: RunOpts): Promise<RunSiiSyncJobResult> {
  const { supabase, userId } = opts;

  const { data: row, error: loadError } = await supabase
    .from('integrations')
    .select('key, enabled, config')
    .eq('key', 'sii')
    .maybeSingle();

  if (loadError) {
    return { ok: false, error: 'db', message: loadError.message };
  }
  if (!row) {
    return { ok: false, error: 'not_found', message: 'Fila integrations(sii) no existe' };
  }
  if (!row.enabled) {
    return { ok: false, error: 'disabled', message: 'La integración SII está deshabilitada' };
  }

  const config =
    row.config && typeof row.config === 'object' && !Array.isArray(row.config)
      ? (row.config as Record<string, unknown>)
      : {};
  const provider = typeof config.provider === 'string' ? config.provider : 'manual';
  const connector = resolveSiiConnector(provider);
  const env = parseIntegrationsEnv();

  const startedAt = new Date().toISOString();
  const { data: job, error: insertError } = await supabase
    .from('integration_job_runs')
    .insert({
      integration_key: 'sii',
      status: 'running',
      trigger_type: 'manual',
      started_at: startedAt,
      payload: {
        connectorId: connector.id,
        provider,
        connectorVersion: '0-stub',
      },
      executed_by: userId,
      stats: {},
    })
    .select()
    .single();

  if (insertError || !job) {
    return {
      ok: false,
      error: 'db',
      message: insertError?.message ?? 'No se pudo crear integration_job_runs',
    };
  }

  const ctx: SiiSyncContext = { supabase, userId, integrationConfig: config, env };

  try {
    const outcome = await connector.sync(ctx);
    const finishedAt = new Date().toISOString();

    const prevPayload =
      typeof job.payload === 'object' && job.payload !== null && !Array.isArray(job.payload)
        ? (job.payload as Record<string, unknown>)
        : {};

    const { data: updated, error: updateError } = await supabase
      .from('integration_job_runs')
      .update({
        status: 'completed',
        finished_at: finishedAt,
        stats: { ...outcome.stats, mode: outcome.mode },
        payload: {
          ...prevPayload,
          outcome: outcome.detail,
          mode: outcome.mode,
        },
      })
      .eq('id', job.id)
      .select()
      .single();

    if (updateError || !updated) {
      return {
        ok: false,
        error: 'db',
        message: updateError?.message ?? 'No se pudo finalizar el job',
      };
    }

    const httpStatus = outcome.mode === 'live' ? 200 : 202;
    return { ok: true, mode: outcome.mode, jobRun: updated as Record<string, unknown>, httpStatus };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const finishedAt = new Date().toISOString();
    await supabase
      .from('integration_job_runs')
      .update({
        status: 'failed',
        finished_at: finishedAt,
        error_code: 'SYNC_EXCEPTION',
        error_message: msg,
      })
      .eq('id', job.id);

    return { ok: false, error: 'db', message: msg };
  }
}
