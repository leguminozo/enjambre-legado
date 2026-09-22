import type { Session } from '@supabase/supabase-js'
import type { AppSource } from './security-events'

export interface VaultUser {
  id: string
  email: string
  role: string
  territorial_rol: string | null
  nivel_guardian: string
  full_name: string
  avatar_url: string
  theme_preference: 'light' | 'dark' | 'system'
}

export interface VaultSessionMeta {
  expiresAt: number | null
  lastVerifiedAt: number
  tokenSnippet: string
}

export interface CachedVaultData {
  version: number
  user: VaultUser
  sessionMeta: VaultSessionMeta
  appSource: AppSource
}

const VAULT_STORAGE_KEY = 'enjambre_auth_vault_v1'
const CURRENT_VAULT_VERSION = 1
// 30 días de vigencia máxima para la bóveda local sin verificación
const MAX_VAULT_AGE_MS = 30 * 24 * 60 * 60 * 1000

function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const testKey = '__enj_vault_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const SessionVault = {
  loadVault(): CachedVaultData | null {
    if (!isLocalStorageAvailable()) return null

    try {
      const raw = window.localStorage.getItem(VAULT_STORAGE_KEY)
      if (!raw) return null

      const parsed = JSON.parse(raw) as unknown
      if (!SessionVault.isVaultValid(parsed)) {
        SessionVault.clearVault()
        return null
      }

      return parsed
    } catch {
      SessionVault.clearVault()
      return null
    }
  },

  saveVault(user: VaultUser, session: Session | null, appSource: AppSource): void {
    if (!isLocalStorageAvailable()) return

    try {
      const expiresAt = session?.expires_at ? session.expires_at * 1000 : null
      const tokenSnippet = session?.access_token ? session.access_token.slice(-10) : ''

      const data: CachedVaultData = {
        version: CURRENT_VAULT_VERSION,
        user,
        sessionMeta: {
          expiresAt,
          lastVerifiedAt: Date.now(),
          tokenSnippet,
        },
        appSource,
      }

      window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('[SessionVault] Failed to save session vault:', e)
    }
  },

  clearVault(): void {
    if (!isLocalStorageAvailable()) return
    try {
      window.localStorage.removeItem(VAULT_STORAGE_KEY)
    } catch {
      // Ignorar errores en private browsing
    }
  },

  isVaultValid(data: unknown): data is CachedVaultData {
    if (!data || typeof data !== 'object') return false

    const record = data as Record<string, unknown>
    if (record.version !== CURRENT_VAULT_VERSION) return false
    if (!record.user || typeof record.user !== 'object') return false

    const user = record.user as Record<string, unknown>
    if (typeof user.id !== 'string' || !user.id) return false
    if (typeof user.email !== 'string') return false
    if (typeof user.role !== 'string') return false

    if (!record.sessionMeta || typeof record.sessionMeta !== 'object') return false
    const meta = record.sessionMeta as Record<string, unknown>
    if (typeof meta.lastVerifiedAt !== 'number') return false

    // Si pasaron más de 30 días sin validar, expira
    const age = Date.now() - meta.lastVerifiedAt
    if (age > MAX_VAULT_AGE_MS || age < 0) return false

    return true
  },
}
