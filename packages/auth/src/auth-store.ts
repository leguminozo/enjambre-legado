import { create } from 'zustand'
import { createClient } from './supabase'
import { logSecurityEvent } from './security-events'
import { resolvePlatformRole } from './role-redirect'
import { SessionVault } from './session-vault'
import { broadcastSessionRevoke, broadcastSessionUpdate } from './pwa-lifecycle'
import type { AppSource } from './security-events'
import type { Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: string
  /**
   * Eje B territorial: actores_registro.rol o user_metadata.territorial_rol.
   * Solo aplica si role === 'territorial'. Null si no hay sub-rol.
   * docs/ROLES_Y_ACCESO.md · PR5
   */
  territorial_rol: string | null
  nivel_guardian: string
  full_name: string
  avatar_url: string
  theme_preference: 'light' | 'dark' | 'system'
}

interface AuthState {
  user: AuthUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  appSource: AppSource
  hydrateFromVault: () => void
  checkUser: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setAppSource: (source: AppSource) => void
}

let checkUserInFlight: Promise<void> | null = null

export function isNetworkOrOfflineError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }
  if (!error) return false
  if (typeof error !== 'object') return false

  const err = error as Record<string, unknown>
  const msg = String(err.message ?? '').toLowerCase()
  const name = String(err.name ?? '')

  if (name === 'AuthRetryableFetchError') return true
  if (
    msg.includes('fetch') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('load failed') ||
    msg.includes('abort')
  ) {
    return true
  }
  return false
}

// Hidratación optimista 0ms desde la bóveda local si existe en navegador
const initialVault = typeof window !== 'undefined' ? SessionVault.loadVault() : null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialVault?.user ?? null,
  session: null,
  isAuthenticated: Boolean(initialVault?.user),
  isLoading: initialVault?.user ? false : true,
  appSource: initialVault?.appSource ?? 'nucleo',

  hydrateFromVault: () => {
    const vault = SessionVault.loadVault()
    if (vault?.user) {
      set({
        user: vault.user,
        isAuthenticated: true,
        isLoading: false,
        appSource: vault.appSource ?? get().appSource,
      })
    }
  },

  checkUser: async () => {
    if (checkUserInFlight) return checkUserInFlight

    checkUserInFlight = (async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          const vault = SessionVault.loadVault()
          if (vault?.user) {
            set({ user: vault.user, isAuthenticated: true, isLoading: false })
          } else {
            set({ user: null, session: null, isAuthenticated: false, isLoading: false })
          }
          return
        }

        let userResult: { data: { user: { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null }; error: unknown }
        try {
          userResult = await supabase.auth.getUser()
        } catch (fetchErr) {
          userResult = { data: { user: null }, error: fetchErr }
        }

        const { data: { user }, error: userError } = userResult

        if (userError || !user) {
          if (userError && isNetworkOrOfflineError(userError)) {
            // Error de conectividad / offline: salvaguardar la sesión local sin expulsar
            const vault = SessionVault.loadVault()
            if (vault?.user || get().user) {
              set({
                user: get().user ?? vault?.user ?? null,
                isAuthenticated: true,
                isLoading: false,
              })
              return
            }
          }

          // Error de autenticación genuino (401, token revocado, o sesión no existente)
          SessionVault.clearVault()
          set({ user: null, session: null, isAuthenticated: false, isLoading: false })
          return
        }

        let session: Session | null = null
        try {
          const sessionResult = await supabase.auth.getSession()
          session = sessionResult.data?.session ?? null
        } catch {
          // Ignorar fallo de getSession en red inestable
        }

        let profile: { id: string; email: string | null; full_name: string | null; role: string | null; theme_preference: string | null } | null = null
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, theme_preference')
            .eq('id', user.id)
            .maybeSingle()
          profile = data
        } catch {
          profile = null
        }

        // role vacío en DB no debe quedar como "" (HomeView cuelga en !role).
        // Si el alta fue territorial y el perfil quedó cliente, no expulsar a tienda.
        const resolvedRole = resolvePlatformRole({
          profileRole: profile?.role,
          jwtRole: typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null,
          userMetadata: user.user_metadata as Record<string, unknown> | undefined,
        })

        // Eje B: actor inscrito (SoT) → metadata de signup (pre-inscripción)
        let territorial_rol: string | null = null
        if (resolvedRole === 'territorial') {
          const metaRol = user.user_metadata?.territorial_rol
          const metaFallback =
            typeof metaRol === 'string' && metaRol.trim() ? metaRol.trim() : null
          try {
            const { data: actor } = await supabase
              .from('actores_registro')
              .select('rol')
              .eq('user_id', user.id)
              .maybeSingle()
            const actorRol =
              actor && typeof (actor as { rol?: string }).rol === 'string'
                ? (actor as { rol: string }).rol.trim()
                : null
            territorial_rol = actorRol || metaFallback
          } catch {
            territorial_rol = metaFallback
          }
        }

        const prev = get()
        const existingUser = prev.user?.id === user.id ? prev.user : null

        const targetUser: AuthUser = {
          id: user.id,
          email: profile?.email ?? user.email ?? existingUser?.email ?? '',
          role: resolvedRole,
          territorial_rol,
          nivel_guardian: existingUser?.nivel_guardian ?? '',
          full_name: profile?.full_name ?? existingUser?.full_name ?? '',
          avatar_url: existingUser?.avatar_url ?? '',
          theme_preference:
            profile?.theme_preference === 'light' ||
            profile?.theme_preference === 'dark' ||
            profile?.theme_preference === 'system'
              ? profile.theme_preference
              : existingUser?.theme_preference ?? 'system',
        }

        // Guardar en la bóveda de sesión profunda y sincronizar multiventana
        SessionVault.saveVault(targetUser, session, get().appSource)
        broadcastSessionUpdate(targetUser.id, targetUser.role)

        const isSameUser =
          prev.user &&
          prev.user.id === targetUser.id &&
          prev.user.email === targetUser.email &&
          prev.user.role === targetUser.role &&
          prev.user.territorial_rol === targetUser.territorial_rol &&
          prev.user.full_name === targetUser.full_name &&
          prev.user.theme_preference === targetUser.theme_preference
        const isSameToken = prev.session?.access_token === session?.access_token

        if (isSameUser && isSameToken && prev.isAuthenticated && !prev.isLoading) {
          return
        }

        set({ user: targetUser, session, isAuthenticated: true, isLoading: false })
      } finally {
        checkUserInFlight = null
      }
    })()

    return checkUserInFlight
  },

  refreshSession: async () => {
    await get().checkUser()
  },

  signOut: async () => {
    const supabase = createClient()
    const currentUser = get().user
    const currentAppSource = get().appSource

    // 1. Limpiar bóveda local y notificar a todas las ventanas
    SessionVault.clearVault()
    broadcastSessionRevoke()

    // 2. Optimistic UI update to remove lag feel
    set({ user: null, session: null, isAuthenticated: false })

    if (supabase) {
      if (currentUser?.email) {
        try {
          await logSecurityEvent(supabase, { eventType: 'session_revoked', email: currentUser.email, userId: currentUser.id, appSource: currentAppSource })
        } catch (error) {
          console.error('[auth-store] error logging session_revoked:', error)
        }
      }
      try {
        // 3. Call API, but don't let network errors prevent local logout
        await supabase.auth.signOut()
      } catch (error) {
        console.error('[auth-store] error during supabase.auth.signOut:', error)
      }
    }
  },

  setAppSource: (source: AppSource) => {
    set({ appSource: source })
    const user = get().user
    if (user) {
      SessionVault.saveVault(user, get().session, source)
    }
  },
}))
