import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { isSupabaseConfigured } from '@/utils/supabase/env';

const PROTECTED_PREFIXES = ['/pos'];
const PUBLIC_PATHS = ['/', '/login', '/register', '/setup-error'];

function isProtected(path: string): boolean {
  if (PUBLIC_PATHS.some((p) => path === p)) return false;
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function logAccessDenied(request: NextRequest, email: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  const url = process.env.NEXT_PUBLIC_NUCLEO_API_URL;
  if (!url) return;

  fetch(`${url}/api/security-events/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': serviceRoleKey,
    },
    body: JSON.stringify({
      event_type: 'access_denied',
      email,
      ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
      app_source: 'campo',
      details: { path: request.nextUrl.pathname },
    }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    if (!isSupabaseConfigured()) {
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'El sistema no está configurado. Contacta al administrador.' },
          { status: 503 },
        );
      }
      if (!path.startsWith('/setup-error')) {
        return NextResponse.rewrite(new URL('/setup-error', request.url));
      }
    }

    const { response, user } = await updateSession(request);

    if (isProtected(path) && !user) {
      logAccessDenied(request, '');

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (error) {
    console.error('[campo-middleware] error:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
