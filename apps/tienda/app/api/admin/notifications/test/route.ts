import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const NotificationTestSchema = z.object({
  channel: z.enum(['email', 'sms', 'push']).optional(),
  recipient: z.string().max(200).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().max(5000).optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase, userId } = guard;

  const raw = await request.json().catch(() => ({}));
  const parsed = NotificationTestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;
  const channel = body.channel || 'email';
  const recipient = body.recipient || 'admin@example.com';
  const subject = body.subject || 'Notificación de prueba';
  const message = body.body || 'Evento de prueba enviado desde Integraciones.';

  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      channel,
      recipient,
      subject,
      body: message,
      status: 'sent',
      provider_response: { mode: 'test', at: new Date().toISOString() },
      created_by: userId,
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
