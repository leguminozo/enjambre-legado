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
  // Protegido con timeout fail-soft (2.5s) para evitar 504 Gateway Timeout si Supabase Auth
  // experimenta latencia o límites de concurrencia en Edge/Serverless.
  let authUser: { id: string; email?: string; app_metadata?: Record<string, unknown> } | null = null
  try {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) => {
      timer = setTimeout(() => resolve({ data: { user: null } }), 2500)
    })
    const authPromise = Promise.resolve(supabase.auth.getUser()).finally(() => {
      if (timer) clearTimeout(timer)
    })
    const { data } = await Promise.race([authPromise, timeoutPromise])
    authUser = data.user
  } catch {
    authUser = null
  }

  const rawRole = authUser?.app_metadata?.oyz_role
  const oyzRole = typeof rawRole === 'string' ? rawRole : 'comprador'

  if (authUser) {
    requestHeaders.set('x-oyz-role', oyzRole)
  }

  return {
    response,
    user: authUser
      ? {
          id: authUser.id,
          email: authUser.email ?? '',
          oyz_role: oyzRole,
          app_metadata: authUser.app_metadata as Record<string, unknown> | undefined,
        }
      : null,
    supabase,
  }
}
