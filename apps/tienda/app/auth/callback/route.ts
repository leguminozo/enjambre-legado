import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const defaultNext = type === 'recovery' ? '/reset-password' : '/';
  const rawNext = searchParams.get('next') ?? defaultNext;
  const next = rawNext.startsWith('/') ? rawNext.replace(/^\/\/+/, '/') : defaultNext;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalHost = origin.startsWith('http://localhost');
  const targetOrigin = forwardedHost && !isLocalHost ? `https://${forwardedHost}` : origin;
  const redirectUrl = next.startsWith('/') ? `${targetOrigin}${next}` : `${targetOrigin}/reset-password`;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
    console.error('[auth/callback] verifyOtp error:', error);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error);
  }

  // Si es un flujo de recuperación que falló en servidor, enviar a /reset-password para intento client-side
  if (type === 'recovery' || next === '/reset-password') {
    return NextResponse.redirect(`${targetOrigin}/reset-password?error=recovery-failed`);
  }

  return NextResponse.redirect(`${targetOrigin}/login?error=auth-callback-failed`);
}
