import { createClient as createAuthClient, isSupabaseConfigured } from '@enjambre/auth'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient | null {
if (!isSupabaseConfigured()) {
return null
}
return createAuthClient() as SupabaseClient
}
