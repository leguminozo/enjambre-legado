import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSupabaseKey, getSupabaseUrl } from './env'

// Augment Supabase JWT App Metadata type
declare module '@supabase/supabase-js' {
  interface UserAppMetadata {
    oyz_role?: string;
  }
}

export interface AuthResult {
  response: NextResponse
  user: { id: string; email: string; oyz_role: string } | null
}

export async function updateSession(request: NextRequest): Promise<AuthResult> {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // getSession() decodes the JWT locally unless it's expired (in which case it refreshes it).
  // This avoids a 100-300ms network penalty on every page load compared to getUser().
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null;

  // Default to comprador if claim is missing (fail-safe)
  const oyzRole = user?.app_metadata?.oyz_role ?? 'comprador';

  return {
    response,
    user: user ? { id: user.id, email: user.email ?? '', oyz_role: oyzRole } : null,
  }
}
