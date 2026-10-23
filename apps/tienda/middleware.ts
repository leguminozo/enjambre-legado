import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n-routing';
import { resolveRouteAccessForMiddleware } from '@/lib/shop/middleware-route-access';
import { mergeMiddlewareCookies } from '@/lib/shop/merge-middleware-cookies';
import { normalizeStorePath, safeStoreReturnPath } from '@/lib/shop/store-routes';
import { isAuthorizedPreviewValue } from '@/lib/cms-preview';
import {
  isPaymentReturnPath,
  normalizeReturnPath,
  parseProviderReturn,
} from '@enjambre/shop-chrome/provider-return';
import { updateSession } from '@/utils/supabase/middleware';

const PAYMENT_RETURN_MAX_BODY_BYTES = 64 * 1024;

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
  target.searchParams.set('locale', locale);

  const redirect = NextResponse.redirect(target);
  redirect.cookies.set('NEXT_LOCALE', locale, LOCALE_COOKIE_OPTS);
  return redirect;
}

/** Sin app/[locale], createIntlMiddleware reescribe / y /catalogo a /_not-found en Vercel. */
function detectLocaleFromHeaders(request: NextRequest): (typeof routing.locales)[number] {
  const param = request.nextUrl.searchParams.get('locale')?.toLowerCase();
  if (param && routing.locales.includes(param as (typeof routing.locales)[number])) {
    return param as (typeof routing.locales)[number];
  }
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

/**
 * Flow vuelve con POST a la URL de retorno; sin este puente Next responde 405
 * antes de que la página pueda leer token_ws/token.
 */
async function handleProviderReturnPost(request: NextRequest): Promise<NextResponse | null> {
  if (request.method !== 'POST' || !isPaymentReturnPath(request.nextUrl.pathname)) {
    return null;
  }

  const target = request.nextUrl.clone();
  target.pathname = normalizeReturnPath(request.nextUrl.pathname);
  target.search = '';

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > PAYMENT_RETURN_MAX_BODY_BYTES) {
    target.searchParams.set('status', 'failed');
    return NextResponse.redirect(target, 303);
  }

  let form: FormData | null = null;
  try {
    form = await request.formData();
  } catch {
    // Un body ilegible equivale a un retorno fallido, nunca a un 500.
  }

  const parsed = parseProviderReturn(form, request.nextUrl.searchParams);
  if (parsed.token) target.searchParams.set('token', parsed.token);
  if (parsed.buyOrder) target.searchParams.set('buyOrder', parsed.buyOrder);
  if (parsed.provider) target.searchParams.set('provider', parsed.provider);
  if (parsed.failed) target.searchParams.set('status', 'failed');

  return NextResponse.redirect(target, 303);
}

export default async function middleware(request: NextRequest) {
  const providerReturn = await handleProviderReturnPost(request);
  if (providerReturn) return providerReturn;

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
  requestHeaders.set('x-next-intl-locale', detectLocaleFromHeaders(request));
  // Preview de borradores solo con token válido: sin él, la tienda ignora el
  // flag y sirve contenido publicado. Toda URL con el parámetro se marca
  // noindex para que ningún borrador llegue a buscadores.
  const previewParam = request.nextUrl.searchParams.get('cms_preview');
  if (previewParam && isAuthorizedPreviewValue(previewParam)) {
    requestHeaders.set('x-cms-preview', '1');
  }
  const passThrough = withLocaleCookie(
    request,
    NextResponse.next({ request: { headers: requestHeaders } }),
  );
  if (previewParam) {
    passThrough.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return mergeMiddlewareCookies(sessionResponse, passThrough);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};