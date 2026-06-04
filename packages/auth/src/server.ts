import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseKey, isSupabaseConfigured } from './supabase'

export async function createServerClientFromCookies() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          throw new Error('Supabase server client cannot set cookies in Server Component')
        }
      },
    },
  })
}
