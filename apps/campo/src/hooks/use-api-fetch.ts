'use client'

import { useAuthStore } from '@enjambre/auth'
import { supabase } from '@/lib/supabase'
import {
  useApiFetch as useApiFetchCanonical,
  type ApiFetchSession,
  type ApiFetchSupabase,
} from '@enjambre/ui'

/**
 * Wrapper: aporta el cliente Supabase y la sesión del store al apiFetch
 * canónico. Cast estructural: SupabaseClient tipado tiene tipos recursivos que
 * TS no puede verificar contra el mínimo del package (excessively deep).
 */
export function useApiFetch() {
  const session = useAuthStore((s) => s.session)
  return useApiFetchCanonical(
    supabase as unknown as ApiFetchSupabase,
    session as unknown as ApiFetchSession,
  )
}
