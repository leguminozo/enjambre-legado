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

  // getUser() calls the Auth API to validate the JWT securely
  const { data: { user } } = await supabase.auth.getUser()

  // Default to comprador if claim is missing (fail-safe)
  const oyzRole = user?.app_metadata?.oyz_role ?? 'comprador';

  return {
    response,
    user: user ? { id: user.id, email: user.email ?? '', oyz_role: oyzRole } : null,
  }
}
