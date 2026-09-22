import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
}

export function getSupabaseKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  )
}

export function isSupabaseConfigured(): boolean {
  const key = getSupabaseKey()
  const isValidKey = key.startsWith('eyJ') || key.startsWith('sb_publishable_')
  return getSupabaseUrl().length > 0 && isValidKey
}

let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (!_browserClient) {
    const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
    _browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseKey(), {
      cookieOptions: {
        maxAge: 31536000,
        sameSite: 'lax',
        path: '/',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    })
  }
  return _browserClient
}

export function createAdminClient(options?: { persistSession?: boolean }) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  // persistSession:false para workers server-side (no guardar sesión en storage).
  const auth = options?.persistSession === false ? { persistSession: false } : undefined
  return createSupabaseClient(getSupabaseUrl(), serviceRoleKey, auth ? { auth } : undefined)
}
