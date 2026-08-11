import { describe, expect, it } from 'vitest'
import {
  enforceAdminInviteConstraints,
  invitationIncludesAdmin,
  ADMIN_INVITE_MAX_USES,
} from '../invitation-policy'

describe('invitation-policy · admin codes', () => {
  const now = new Date('2026-08-10T12:00:00.000Z')

  it('no toca códigos sin admin', () => {
    const r = enforceAdminInviteConstraints({
      roles: ['apicultor'],
      max_uses: 50,
      expires_at: null,
      now,
    })
    expect(r.max_uses).toBe(50)
    expect(r.expires_at).toBeNull()
    expect(r.warnings).toHaveLength(0)
  })

  it('fuerza max_uses=1 y expires_at ≤7d para admin', () => {
    const r = enforceAdminInviteConstraints({
      roles: ['admin'],
      max_uses: 100,
      expires_at: '2026-12-01T00:00:00.000Z',
      now,
    })
    expect(invitationIncludesAdmin(['admin'])).toBe(true)
    expect(r.max_uses).toBe(ADMIN_INVITE_MAX_USES)
    expect(r.expires_at).toBe('2026-08-17T12:00:00.000Z')
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('default expires_at si admin sin fecha', () => {
    const r = enforceAdminInviteConstraints({
      roles: ['admin', 'apicultor'],
      now,
    })
    expect(r.max_uses).toBe(1)
    expect(r.expires_at).toBe('2026-08-17T12:00:00.000Z')
  })
})
