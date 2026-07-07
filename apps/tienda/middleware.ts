import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n-routing';
import { resolveRouteAccessForMiddleware } from '@/lib/shop/middleware-route-access';
import { mergeMiddlewareCookies } from '@/lib/shop/merge-middleware-cookies';
import { normalizeStorePath } from '@/lib/shop/store-routes';
import { updateSession } from '@/utils/supabase/middleware';

const handleI18nRouting = createIntlMiddleware(routing);

const LOCALE_COOKIE_OPTS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax' as const,
};

/** Redirige URLs legacy /es o /en (sin segmento [locale] en app/) hacia rutas canónicas. */
function redirectLegacyLocalePath(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/(es|en)(\/.*)?$/);
  if (!match) return null;

  const locale = match[1];
  const rest = match[2] ?? '';
  const target = request.nextUrl.clone();
  target.pathname = rest === '' ? '/' : rest;

  const redirect = NextResponse.redirect(target);
  redirect.cookies.set('NEXT_LOCALE', locale, LOCALE_COOKIE_OPTS);
  return redirect;
}

export default async function middleware(request: NextRequest) {
  const legacyRedirect = redirectLegacyLocalePath(request);
  if (legacyRedirect) {
    const { response: sessionResponse } = await updateSession(request);
    return mergeMiddlewareCookies(sessionResponse, legacyRedirect);
  }

  const intlResponse = handleI18nRouting(request);

  if (intlResponse.headers.get('location')) {
    const { response: sessionResponse } = await updateSession(request);
    return mergeMiddlewareCookies(sessionResponse, intlResponse);
  }

  const { response: sessionResponse, user, supabase } = await updateSession(request);
  const pathname = normalizeStorePath(request.nextUrl.pathname);

  const access = await resolveRouteAccessForMiddleware(pathname, user, supabase);

  if (!access.allowed) {
    if (access.external) {
      const redirect = NextResponse.redirect(access.redirectTo);
      return mergeMiddlewareCookies(mergeMiddlewareCookies(sessionResponse, intlResponse), redirect);
    }

    const target = request.nextUrl.clone();
    target.pathname = access.redirectTo;
    target.search = '';

    if (access.code === 'auth_required') {
      target.pathname = '/login';
      target.searchParams.set('returnTo', pathname);
    }

    const redirect = NextResponse.redirect(target);
    return mergeMiddlewareCookies(mergeMiddlewareCookies(sessionResponse, intlResponse), redirect);
  }

  return mergeMiddlewareCookies(sessionResponse, intlResponse);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};