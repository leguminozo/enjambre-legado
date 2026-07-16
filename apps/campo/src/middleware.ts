import { type NextRequest, NextResponse } from 'next/server';
import { getInternalApiSecret } from '@enjambre/auth/internal-api-secret';
import { updateSession } from '@/utils/supabase/middleware';
import { isSupabaseConfigured } from '@/utils/supabase/env';

import { LEGACY_ROLE_MAP, type RoleKey } from '@enjambre/auth/role-redirect';
import { isCampoProtectedPath } from '@/lib/navigation/paths';

const PUBLIC_PATHS = ['/', '/login', '/setup-error'];

function isProtected(path: string): boolean {
  if (PUBLIC_PATHS.some((p) => path === p)) return false;
  // POS + caja + feria + comisiones + ranking (no solo /pos)
  return isCampoProtectedPath(path);
}

function logAccessDenied(request: NextRequest, email: string) {
  const internalKey = getInternalApiSecret();
  if (!internalKey) return;

  const url = process.env.NEXT_PUBLIC_NUCLEO_API_URL;
  if (!url) return;

  fetch(`${url}/api/security-events/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
  body: JSON.stringify({
    eventType: 'access_denied',
    email,
    userId: null,
    ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
    userAgent: request.headers.get('user-agent') ?? null,
    details: { path: request.nextUrl.pathname },
    appSource: 'campo',
  }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    /**
     * Playwright CI: E2E_SKIP_AUTH=1 abre /pos sin sesión real.
     * Nunca en Vercel production aunque el env esté mal seteado.
     */
    const e2eAuthSkipAllowed =
      process.env.E2E_SKIP_AUTH === '1' &&
      process.env.VERCEL_ENV !== 'production';
    if (e2eAuthSkipAllowed && isProtected(path)) {
      return NextResponse.next({ request });
    }

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

    if (isProtected(path)) {
      if (!user) {
        logAccessDenied(request, '');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(loginUrl);
      }

      const rawRole = (user.app_metadata?.role as string) ?? 'cliente';
      const role = (LEGACY_ROLE_MAP[rawRole] ?? rawRole) as RoleKey;
      
      const allowedRoles = ['admin', 'rep_ventas'];
      if (!allowedRoles.includes(role)) {
        logAccessDenied(request, user.email ?? '');
        // Redirect unauthorized users (e.g. clientes) out of Campo
        const redirectUrl = process.env.NEXT_PUBLIC_URL_TIENDA || '/';
        return NextResponse.redirect(redirectUrl);
      }
    }

    return response;
  } catch (error) {
    console.error('[campo-middleware] error:', error);
    if (isProtected(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
