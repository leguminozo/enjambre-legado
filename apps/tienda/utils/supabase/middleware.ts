import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
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
  user: { id: string; email: string; oyz_role: string; app_metadata?: Record<string, unknown> } | null
  supabase: SupabaseClient
}

export async function updateSession(request: NextRequest): Promise<AuthResult> {
  const requestHeaders = new Headers(request.headers)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

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

  // getUser() validates the user JWT with the Supabase Auth server on every request.
  const { data: { user } } = await supabase.auth.getUser()

  const oyzRole = user?.app_metadata?.oyz_role ?? 'comprador'

  if (user) {
    requestHeaders.set('x-oyz-role', oyzRole)
  }

  return {
    response,
    user: user
      ? {
          id: user.id,
          email: user.email ?? '',
          oyz_role: oyzRole,
          app_metadata: user.app_metadata as Record<string, unknown> | undefined,
        }
      : null,
    supabase,
  }
}
