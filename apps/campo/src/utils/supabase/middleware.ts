import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export interface AuthResult {
  response: NextResponse;
  user: { id: string; email: string } | null;
}

export async function updateSession(request: NextRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
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

    const { data: { user } } = await supabase.auth.getUser();

    return {
      response: supabaseResponse,
      user: user ? { id: user.id, email: user.email ?? '' } : null,
    };
  } catch {
    return { response: NextResponse.next({ request }), user: null };
  }
}
