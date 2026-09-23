import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { guardMutation } from '@/lib/api-guard';

const newsletterRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = newsletterRateLimiter(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.' },
      { status: 429 },
    );
  }

  let body: { email?: string; hp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Honeypot anti-bot: si el campo trampa viene relleno, responder éxito silenciosamente
  if (body.hp && typeof body.hp === 'string' && body.hp.trim().length > 0) {
    return NextResponse.json({ ok: true, lead: false });
  }

  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
  if (!email || !email.includes('@') || email.length > 254) {
    return NextResponse.json({ error: 'Dirección de correo inválida' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    // Si la clave de servicio no está presente, permitir que el cliente continúe con signInWithOtp
    return NextResponse.json({ ok: true });
  }

  try {
    // Resolver usuario propietario de la empresa para la clave foránea user_id
    const { data: ownerRow } = await admin
      .from('usuarios_empresas')
      .select('user_id')
      .limit(1)
      .maybeSingle();

    let ownerId = ownerRow?.user_id;

    if (!ownerId) {
      // Fallback a cualquier usuario administrativo en profiles
      const { data: adminProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      ownerId = adminProfile?.id;
    }

    if (ownerId) {
      // Verificar si ya existe en clientes
      const { data: existing } = await admin
        .from('clientes')
        .select('id, status')
        .eq('email', email)
        .maybeSingle();

      if (!existing) {
        await admin.from('clientes').insert({
          user_id: ownerId,
          name: email.split('@')[0],
          email,
          type: 'D2C',
          status: 'prospecto',
          fuente: 'web',
          notes: 'Suscripción pie de página: registro y bienvenida iniciados',
        });
      }
    }
  } catch (err) {
    // No romper el flujo si el registro en CRM falla: registrar el error y continuar
    console.error('[newsletter/subscribe] Error registrando prospecto en CRM:', err);
  }

  return NextResponse.json({ ok: true });
}
