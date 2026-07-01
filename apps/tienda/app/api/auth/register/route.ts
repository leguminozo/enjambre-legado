import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';

const registerRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = registerRateLimiter(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { 
        status: 429, 
        headers: { 
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        } 
      }
    );
  }

  const supabase = await createClient();

  let body: { email?: string; password?: string; fullName?: string; referrerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { email, password, fullName, referrerId } = body;
  if (!email?.trim() || !password || !fullName?.trim()) {
    return NextResponse.json({ error: 'Completa todos los campos' }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });

  if (authError) {
    return NextResponse.json({ error: 'No se pudo crear la cuenta' }, { status: 400 });
  }
  if (!authData.user) {
    return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: authData.user.id, email: email.trim(), full_name: fullName.trim(), role: 'cliente' });

  if (profileError && profileError.code !== '23505') {
    return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 });
  }

  const nucleoUrl = getNucleoApiUrl();
  const internalKey = process.env.INTERNAL_API_SECRET;
  if (nucleoUrl && internalKey) {
    await fetch(`${nucleoUrl}/api/notifications/internal/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': internalKey },
      body: JSON.stringify({
        userId: authData.user.id,
        email: email.trim(),
        subject: 'Bienvenido al Legado',
        body: 'Gracias por unirte. Explora tus alertas de floración y el impacto de tu colmena.',
        source: 'tienda_signup',
      }),
    }).catch(() => {});
  }

  if (referrerId && referrerId !== authData.user.id) {
    await fetch(`${new URL(request.url).origin}/api/referrals/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerId }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}