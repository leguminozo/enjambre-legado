import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export interface AuthResult {
  response: NextResponse;
  user: { id: string; email: string; app_metadata?: Record<string, unknown> } | null;
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

export async function updateSession(request: NextRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !hasSessionCookie(request)) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500),
    );
    const { data: { user } } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);

    return {
      response: supabaseResponse,
      user: user ? { id: user.id, email: user.email ?? '', app_metadata: user.app_metadata } : null,
    };
  } catch (error) {
    console.error('[campo-supabase-middleware] error:', error);
    return { response: NextResponse.next({ request }), user: null };
  }
}
