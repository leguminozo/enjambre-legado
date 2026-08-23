import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';
import { guardMutation } from '@/lib/api-guard';
import { logSecurityEvent } from '@enjambre/auth/security-events';

const PasswordResetSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

const resetRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

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
        {
          error: 'No pudimos enviar el correo. Intenta de nuevo en unos minutos.',
          code: 'reset_failed',
        },
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

    // Evento de seguridad canónico (antes vivía en el sheet del login; ahora
    // la recuperación es una sola pantalla: /recuperar → este handler).
    try {
      await logSecurityEvent(supabase, {
        eventType: 'password_reset_requested',
        email: email.trim(),
        appSource: 'tienda',
      });
    } catch (logErr) {
      console.error('[password-reset] failed to log security event:', logErr);
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