import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { validateCsrf } from './lib/csrf';

const ADMIN_PATHS = ['/dashboard', '/products', '/orders', '/customers', '/collections', '/integrations', '/content', '/settings'];

export async function proxy(request: NextRequest) {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      const csrfError = validateCsrf(request);
      if (csrfError) return csrfError;
    }

    const response = await updateSession(request);
    const path = request.nextUrl.pathname;

    const isAdmin = path.startsWith('/(admin)') || ADMIN_PATHS.some((p) => path.startsWith(p));
    if (isAdmin) {
      const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));
      if (!hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(loginUrl);
      }
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
