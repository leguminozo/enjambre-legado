import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './env'

export function createAdminClient(): ReturnType<typeof createSupabaseClient> | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return null
  }

  return createSupabaseClient(getSupabaseUrl(), serviceRoleKey)
}
