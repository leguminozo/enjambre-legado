import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/reset-password';
  const next = rawNext.startsWith('/') ? rawNext.replace(/^\/\/+/, '/') : '/reset-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalHost = origin.startsWith('http://localhost');
      
      const targetOrigin = forwardedHost && !isLocalHost ? `https://${forwardedHost}` : origin;
      const redirectUrl = next.startsWith('/') ? `${targetOrigin}${next}` : `${targetOrigin}/reset-password`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
