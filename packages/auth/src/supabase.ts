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
  return getSupabaseUrl().length > 0 && key.startsWith('eyJ')
}

let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (!_browserClient) {
    _browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseKey())
  }
  return _browserClient
}

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createSupabaseClient(getSupabaseUrl(), serviceRoleKey)
}
