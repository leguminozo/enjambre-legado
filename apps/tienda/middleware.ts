import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n-routing';
import { resolveRouteAccessForMiddleware } from '@/lib/shop/middleware-route-access';
import { mergeMiddlewareCookies } from '@/lib/shop/merge-middleware-cookies';
import { normalizeStorePath, safeStoreReturnPath } from '@/lib/shop/store-routes';
import { updateSession } from '@/utils/supabase/middleware';

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

/** Sin app/[locale], createIntlMiddleware reescribe / y /catalogo a /_not-found en Vercel. */
function detectLocaleFromHeaders(request: NextRequest): (typeof routing.locales)[number] {
  const cookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookie && routing.locales.includes(cookie as (typeof routing.locales)[number])) {
    return cookie as (typeof routing.locales)[number];
  }
  const accept = request.headers.get('accept-language')?.toLowerCase() ?? '';
  if (accept.startsWith('en') && !accept.includes('es')) return 'en';
  return routing.defaultLocale;
}

function withLocaleCookie(request: NextRequest, response: NextResponse): NextResponse {
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', detectLocaleFromHeaders(request), LOCALE_COOKIE_OPTS);
  }
  return response;
}

/**
 * Sanea returnTo entrante en /login y /register (defensa server-side contra
 * open redirect): si no es una ruta interna relativa, se limpia vía redirect
 * (cambia la URL visible; sin el parámetro no hay loop).
 */
function sanitizeAuthReturnTo(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (pathname !== '/login' && pathname !== '/register') return null;
  const raw = request.nextUrl.searchParams.get('returnTo');
  if (!raw?.trim()) return null;
  const safe = safeStoreReturnPath(raw);
  if (safe === raw) return null;
  const target = request.nextUrl.clone();
  if (safe) target.searchParams.set('returnTo', safe);
  else target.searchParams.delete('returnTo');
  return withLocaleCookie(request, NextResponse.redirect(target));
}

export default async function middleware(request: NextRequest) {
  const legacyRedirect = redirectLegacyLocalePath(request);
  if (legacyRedirect) {
    const { response: sessionResponse } = await updateSession(request);
    return mergeMiddlewareCookies(sessionResponse, legacyRedirect);
  }

  const sanitized = sanitizeAuthReturnTo(request);
  if (sanitized) {
    const { response: sessionResponse } = await updateSession(request);
    return mergeMiddlewareCookies(sessionResponse, sanitized);
  }

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

    const redirect = withLocaleCookie(request, NextResponse.redirect(target));
    return mergeMiddlewareCookies(sessionResponse, redirect);
  }

  const requestHeaders = new Headers(request.headers);
  if (request.nextUrl.searchParams.get('cms_preview') === '1') {
    requestHeaders.set('x-cms-preview', '1');
  }
  const passThrough = withLocaleCookie(
    request,
    NextResponse.next({ request: { headers: requestHeaders } }),
  );
  return mergeMiddlewareCookies(sessionResponse, passThrough);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};