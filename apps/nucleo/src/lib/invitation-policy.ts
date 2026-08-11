/**
 * Política de seguridad de invitaciones (ops + BFF).
 * docs/ROLES_Y_ACCESO.md · hardening post-PR4
 */

export const ADMIN_INVITE_MAX_USES = 1
/** Caducidad máxima de un código que eleva a admin (días). */
export const ADMIN_INVITE_MAX_TTL_DAYS = 7

export function invitationIncludesAdmin(roles: readonly string[]): boolean {
  return roles.includes('admin')
}

/**
 * Normaliza max_uses / expires_at cuando el código incluye `admin`.
 * - max_uses forzado a 1
 * - expires_at obligatorio: si falta, default +7 días; si es >7 días, se acorta
 */
export function enforceAdminInviteConstraints(input: {
  roles: readonly string[]
  max_uses?: number | null
  expires_at?: string | null
  now?: Date
}): {
  max_uses: number | null
  expires_at: string | null
  warnings: string[]
} {
  const now = input.now ?? new Date()
  const warnings: string[] = []

  if (!invitationIncludesAdmin(input.roles)) {
    return {
      max_uses: input.max_uses ?? null,
      expires_at: input.expires_at ?? null,
      warnings,
    }
  }

  const max_uses = ADMIN_INVITE_MAX_USES
  if (input.max_uses !== 1 && input.max_uses != null) {
    warnings.push('Código con rol admin: max_uses forzado a 1')
  } else if (input.max_uses == null) {
    warnings.push('Código con rol admin: max_uses = 1 (obligatorio)')
  }

  const maxExpiry = new Date(now.getTime() + ADMIN_INVITE_MAX_TTL_DAYS * 24 * 60 * 60 * 1000)
  let expires_at: string

  if (!input.expires_at) {
    expires_at = maxExpiry.toISOString()
    warnings.push(`Código con rol admin: expires_at default ${ADMIN_INVITE_MAX_TTL_DAYS}d`)
  } else {
    const requested = new Date(input.expires_at)
    if (Number.isNaN(requested.getTime()) || requested <= now) {
      expires_at = maxExpiry.toISOString()
      warnings.push('Código con rol admin: expires_at inválido o pasado → default 7d')
    } else if (requested > maxExpiry) {
      expires_at = maxExpiry.toISOString()
      warnings.push(`Código con rol admin: expires_at acotado a ${ADMIN_INVITE_MAX_TTL_DAYS}d`)
    } else {
      expires_at = requested.toISOString()
    }
  }

  return { max_uses, expires_at, warnings }
}
