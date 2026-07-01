import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';

const PasswordResetSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

const resetRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = resetRateLimiter(identifier);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes de restablecimiento. Intenta de nuevo más tarde.', code: 'rate_limited' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = PasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email inválido', code: 'invalid_input' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { email, redirectTo } = parsed.data;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { 
          status: 400,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      );
    }

    return NextResponse.json(
      { message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.' },
      {
        headers: {
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'internal_error' },
      { status: 500 }
    );
  }
}