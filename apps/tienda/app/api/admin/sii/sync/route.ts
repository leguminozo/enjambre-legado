import { runSiiSyncJob } from '@/lib/integrations/run-sii-sync';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';

export async function POST() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase, userId } = guard;

  const result = await runSiiSyncJob({ supabase, userId });

  if (!result.ok) {
    if (result.error === 'disabled') {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    if (result.error === 'not_found') {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      mode: result.mode,
      message:
        result.mode === 'stub'
          ? 'Stub: no hubo llamada real al SII; se registró el job en integration_job_runs.'
          : 'Sincronización completada.',
      data: result.jobRun,
    },
    { status: result.httpStatus },
  );
}
