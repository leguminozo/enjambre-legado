import { type NextRequest, NextResponse } from 'next/server';
import { resolveRouteAccessForMiddleware } from '@/lib/shop/middleware-route-access';
import { mergeMiddlewareCookies } from '@/lib/shop/merge-middleware-cookies';
import { normalizeStorePath } from '@/lib/shop/store-routes';
import { updateSession } from '@/utils/supabase/middleware';

export default async function middleware(request: NextRequest) {
  const { response: sessionResponse, user, supabase } = await updateSession(request);
  const pathname = normalizeStorePath(request.nextUrl.pathname);

  const access = await resolveRouteAccessForMiddleware(pathname, user, supabase);

  if (!access.allowed) {
    if (access.external) {
      const redirect = NextResponse.redirect(access.redirectTo);
      return mergeMiddlewareCookies(sessionResponse, redirect);
    }

    const target = request.nextUrl.clone();
    target.pathname = access.redirectTo;
    target.search = '';

    if (access.code === 'auth_required') {
      target.pathname = '/login';
      target.searchParams.set('returnTo', pathname);
    }

    const redirect = NextResponse.redirect(target);
    return mergeMiddlewareCookies(sessionResponse, redirect);
  }

  return mergeMiddlewareCookies(sessionResponse, NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};