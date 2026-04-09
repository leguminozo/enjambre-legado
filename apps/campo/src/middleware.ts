import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { isSupabaseConfigured } from '@/utils/supabase/env';

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (!isSupabaseConfigured()) {
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y clave pública en Vercel.' },
          { status: 503 },
        );
      }
      if (!path.startsWith('/setup-error')) {
        return NextResponse.rewrite(new URL('/setup-error', request.url));
      }
    }
    return await updateSession(request);
  } catch {
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
