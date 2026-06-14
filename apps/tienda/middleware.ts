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

    // Inject the OYZ role into headers so layouts/pages can read it securely
    // without making secondary database queries.
    if (user) {
      response.headers.set('x-oyz-role', user.oyz_role);
    }

    // Admin paths now belong to nucleo. Tienda has no (admin) routes anymore.
    // If we wanted to redirect /dashboard to nucleo, we could do it here, but 
    // for security we just don't match any admin routes locally unless explicitly defined.

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
