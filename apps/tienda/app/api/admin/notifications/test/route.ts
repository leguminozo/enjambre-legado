import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

type Body = {
  channel?: string;
  recipient?: string;
  subject?: string;
  body?: string;
};

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

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase, profile } = guard;

  const body = (await request.json().catch(() => ({}))) as Body;
  const channel = body.channel?.trim() || 'email';
  const recipient = body.recipient?.trim() || 'admin@example.com';
  const subject = body.subject?.trim() || 'Notificación de prueba';
  const message = body.body?.trim() || 'Evento de prueba enviado desde Integraciones.';

  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      channel,
      recipient,
      subject,
      body: message,
      status: 'sent',
      provider_response: { mode: 'test', at: new Date().toISOString() },
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(
    {
      ok: true,
      mode: 'stub' as const,
      message:
        'Registro de prueba en notification_events; no se envió correo/SMS real hasta configurar NOTIFY_* en el servidor.',
      data,
    },
    { status: 202 },
  );
}

