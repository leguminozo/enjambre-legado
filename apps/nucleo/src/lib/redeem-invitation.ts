/**
 * Canje de código de invitación + refresh de sesión.
 * Obligatorio tras cambiar profiles.role para alinear JWT/middleware.
 */

import { createClient, useAuthStore } from '@enjambre/auth'

export type RedeemInvitationResult = {
  ok: boolean
  roles_asignados?: string[]
  message?: string
}

/**
 * POST /api/invitations/redeem y refresca auth store + sesión Supabase.
 */
export async function redeemInvitationCode(code: string): Promise<RedeemInvitationResult> {
  const supabase = createClient()
  if (!supabase) {
    return { ok: false, message: 'Cliente auth no disponible' }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return { ok: false, message: 'No autenticado' }
  }

  const res = await fetch('/api/invitations/redeem', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code: code.trim() }),
  })

  const json = (await res.json().catch(() => ({}))) as {
    data?: { exito?: boolean; roles_asignados?: string[] }
    message?: string
    code?: string
  }

  if (!res.ok || !json.data?.exito) {
    return {
      ok: false,
      message: json.message ?? 'Código inválido, expirado o ya usado',
    }
  }

  // Re-leer profiles + app_metadata (trigger sync role → JWT en próximo refresh)
  await supabase.auth.refreshSession()
  await useAuthStore.getState().checkUser()

  return {
    ok: true,
    roles_asignados: json.data.roles_asignados,
    message: 'Rol actualizado. Sesión refrescada.',
  }
}
