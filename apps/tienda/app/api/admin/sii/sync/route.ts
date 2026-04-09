import { runSiiSyncJob } from '@/lib/integrations/run-sii-sync';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || (profile.role !== 'tienda_admin' && profile.role !== 'gerente')) {
    return { error: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }
  return { supabase, profile };
}

export async function POST() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase, profile } = guard;

  const result = await runSiiSyncJob({ supabase, userId: profile.id });

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
