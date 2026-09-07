import { createAdminClient as createAdminClientCanonical } from '@enjambre/auth/server-index'

/**
 * Fail-soft: null si falta SUPABASE_SERVICE_ROLE_KEY (el factory canónico de
 * @enjambre/auth lanza; los consumidores de tienda esperan null).
 */
export function createAdminClient(): ReturnType<typeof createAdminClientCanonical> | null {
  try {
    return createAdminClientCanonical()
  } catch {
    return null
  }
}
