import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { validateCsrf } from './lib/csrf';

const ADMIN_PATHS = ['/dashboard', '/products', '/orders', '/customers', '/collections', '/integrations', '/content', '/settings'];

function logAccessDenied(request: NextRequest, email: string, path: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return;

  fetch(`${url}/rest/v1/security_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      event_type: 'access_denied',
      email,
      ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
      user_agent: request.headers.get('user-agent') ?? null,
      app_source: 'tienda',
      details: { path },
    }),
  }).catch(() => {});
}

export async function proxy(request: NextRequest) {
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
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
