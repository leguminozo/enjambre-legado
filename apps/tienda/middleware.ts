import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { validateCsrf } from './lib/csrf';

const ADMIN_PATHS = ['/dashboard', '/products', '/orders', '/customers', '/collections', '/integrations', '/content', '/settings'];

function logAccessDenied(request: NextRequest, email: string, path: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  const origin = request.nextUrl.origin;

  fetch(`${origin}/api/security-events/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': serviceRoleKey,
    },
    body: JSON.stringify({
      eventType: 'access_denied',
      email,
      userId: null,
      ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
      userAgent: request.headers.get('user-agent') ?? null,
      details: { path },
      appSource: 'tienda',
    }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      const csrfError = validateCsrf(request);
      if (csrfError) return csrfError;
    }

    const { response, user } = await updateSession(request);
    const path = request.nextUrl.pathname;

    const isAdmin = path.startsWith('/(admin)') || ADMIN_PATHS.some((p) => path.startsWith(p));
    if (isAdmin && !user) {
      logAccessDenied(request, '', path);

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (error) {
    console.error('[tienda-middleware] error:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
