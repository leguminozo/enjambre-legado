import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { validateCsrf } from './lib/csrf';

export async function middleware(request: NextRequest) {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      const csrfError = validateCsrf(request);
      if (csrfError) return csrfError;
    }

    const { response, user } = await updateSession(request);
    const path = request.nextUrl.pathname;

    if (!user && path.startsWith('/perfil')) {
      const login = new URL('/login', request.url);
      login.searchParams.set('redirect', path);
      return NextResponse.redirect(login);
    }

    return response;
  } catch (error) {
    console.error('[tienda-middleware] error:', error);
    const path = request.nextUrl.pathname;
    if (path.startsWith('/perfil')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
