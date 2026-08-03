import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { guardMutation } from '@/lib/api-guard';

const loginRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const identifier = getClientIdentifier(request);
  const rateLimitResult = loginRateLimiter(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
      { 
        status: 429, 
        headers: { 
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitResult.resetTime),
        } 
      }
    );
  }

  const supabase = await createClient();

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Completa correo y contraseña' }, { status: 400 });
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    // email_not_confirmed es seguro de revelar (el usuario conoce su propio
    // correo) y evita un error engañoso tras registrarse sin confirmar.
    if (error.code === 'email_not_confirmed') {
      return NextResponse.json(
        { error: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime),
      },
    }
  );
}