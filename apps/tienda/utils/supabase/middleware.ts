import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSupabaseKey, getSupabaseUrl } from './env'

export interface AuthResult {
  response: NextResponse
  user: { id: string; email: string } | null
}

export async function updateSession(request: NextRequest): Promise<AuthResult> {
  let response = NextResponse.next({ request })

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

  const { data: { user } } = await supabase.auth.getUser()

  return {
    response,
    user: user ? { id: user.id, email: user.email ?? '' } : null,
  }
}
