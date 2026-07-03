import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// v1: sin segmento app/[locale]/ — el middleware de next-intl reescribe a /es/... y rompe rutas.
export default async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};