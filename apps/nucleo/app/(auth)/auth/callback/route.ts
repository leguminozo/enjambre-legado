import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerClientFromCookies as createClient } from '@enjambre/auth/server-index';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  const defaultNext = type === 'recovery' ? '/reset-password' : '/inicio';
  const rawNext = searchParams.get('next') ?? defaultNext;
  const next = rawNext.startsWith('/') ? rawNext.replace(/^\/\/+/, '/') : defaultNext;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const siteUrl = process.env.NEXT_PUBLIC_NUCLEO_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const isLocalHost = origin.startsWith('http://localhost');
  const targetOrigin = forwardedHost && !isLocalHost
    ? `${forwardedProto}://${forwardedHost}`
    : (siteUrl || origin);
  const redirectUrl = next.startsWith('/') ? `${targetOrigin}${next}` : `${targetOrigin}/reset-password`;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${targetOrigin}/login?error=supabase-not-configured`);
  }

  async function resolvePostAuthRedirect(client: NonNullable<typeof supabase>): Promise<NextResponse> {
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      const appSource = user.user_metadata?.app_source;
      const metaRole = user.app_metadata?.role;
      if (appSource === 'tienda' || (!metaRole && appSource !== 'nucleo_territorial')) {
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'cliente') {
          const tiendaUrl = process.env.NEXT_PUBLIC_URL_TIENDA || 'https://obrerayzangano.cl';
          return NextResponse.redirect(`${tiendaUrl.replace(/\/$/, '')}/perfil`);
        }
      }
    }
    return NextResponse.redirect(redirectUrl);
  }

  const effectiveType = (type ?? (tokenHash ? 'signup' : null)) as EmailOtpType | null;

  if (tokenHash && effectiveType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: effectiveType,
    });
    if (!error) {
      return resolvePostAuthRedirect(supabase);
    }
    console.error('[auth/callback] verifyOtp error:', error);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return resolvePostAuthRedirect(supabase);
    }
    console.error('[auth/callback] exchangeCodeForSession error:', error);
  }

  if (type === 'recovery' || next === '/reset-password') {
    return NextResponse.redirect(`${targetOrigin}/reset-password?error=recovery-failed`);
  }

  return NextResponse.redirect(`${targetOrigin}/login?error=auth-callback-failed`);
}
