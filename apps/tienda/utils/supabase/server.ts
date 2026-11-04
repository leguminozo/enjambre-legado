import { cache } from 'react'
import { createServerClientFromCookies } from '@enjambre/auth/server-index'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Firma no-null memoizada por request: los consumidores de tienda asumen cliente configurado. */
export const createClient = cache(async function createClient(): Promise<SupabaseClient> {
  const client = await createServerClientFromCookies()
  if (!client) {
    throw new Error('Supabase no configurado')
  }
  return client
})
