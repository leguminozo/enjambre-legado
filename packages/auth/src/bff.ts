import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseKey, isSupabaseConfigured } from './supabase'

export function createSupabaseUserClient(accessToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
