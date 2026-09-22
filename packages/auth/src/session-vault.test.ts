import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SessionVault, type VaultUser } from './session-vault'
import type { Session } from '@supabase/supabase-js'

describe('SessionVault', () => {
  const mockStorage: Record<string, string> = {}

  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k])

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value
        },
        removeItem: (key: string) => {
          delete mockStorage[key]
        },
      },
    })
  })

  const testUser: VaultUser = {
    id: 'usr-123',
    email: 'guardiana@enjambrelegado.cl',
    role: 'territorial',
    territorial_rol: 'recolector',
    nivel_guardian: 'guardiana_mayor',
    full_name: 'Elena Cárdenas',
    avatar_url: '',
    theme_preference: 'dark',
  }

  const testSession: Partial<Session> = {
    access_token: 'header.payload.signature_xyz123',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  }

  it('saves and loads user session correctly from local vault', () => {
    SessionVault.saveVault(testUser, testSession as Session, 'campo')

    const loaded = SessionVault.loadVault()
    expect(loaded).not.toBeNull()
    expect(loaded?.user.id).toBe('usr-123')
    expect(loaded?.user.role).toBe('territorial')
    expect(loaded?.user.full_name).toBe('Elena Cárdenas')
    expect(loaded?.appSource).toBe('campo')
    expect(loaded?.sessionMeta.tokenSnippet).toBe('ure_xyz123')
  })

  it('clears vault on clearVault()', () => {
    SessionVault.saveVault(testUser, testSession as Session, 'nucleo')
    expect(SessionVault.loadVault()).not.toBeNull()

    SessionVault.clearVault()
    expect(SessionVault.loadVault()).toBeNull()
  })

  it('discards corrupted JSON gracefully without throwing', () => {
    mockStorage['enjambre_auth_vault_v1'] = 'INVALID_JSON{[['
    expect(SessionVault.loadVault()).toBeNull()
  })

  it('discards stale vault data older than 30 days', () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000
    const staleData = {
      version: 1,
      user: testUser,
      sessionMeta: {
        expiresAt: null,
        lastVerifiedAt: thirtyOneDaysAgo,
        tokenSnippet: '',
      },
      appSource: 'tienda',
    }
    mockStorage['enjambre_auth_vault_v1'] = JSON.stringify(staleData)

    expect(SessionVault.loadVault()).toBeNull()
  })

  it('returns null when window or localStorage is undefined (SSR safe)', () => {
    vi.stubGlobal('window', undefined)
    expect(SessionVault.loadVault()).toBeNull()
  })
})
