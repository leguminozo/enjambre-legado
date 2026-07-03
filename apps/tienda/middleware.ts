import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n-routing';
import { updateSession } from '@/utils/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

function mergeSupabaseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value);
  });
}

export default async function middleware(request: NextRequest) {
  const { response: supabaseResponse } = await updateSession(request);
  const intlResponse = intlMiddleware(request);
  mergeSupabaseCookies(supabaseResponse, intlResponse);
  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};