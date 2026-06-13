import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { validateCsrf } from './lib/csrf';

function logAccessDenied(request: NextRequest, email: string, path: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const nucleoBffUrl = process.env.NUCLEO_BFF_URL;
  if (!serviceRoleKey || !nucleoBffUrl) return;

  fetch(`${nucleoBffUrl}/api/security-events/internal`, {
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

    // Admin paths now belong to nucleo. Tienda has no (admin) routes anymore.
    // If we wanted to redirect /dashboard to nucleo, we could do it here, but 
    // for security we just don't match any admin routes locally unless explicitly defined.

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
