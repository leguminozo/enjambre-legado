import { create } from 'zustand'
import { createClient } from './supabase'
import { logSecurityEvent } from './security-events'
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
  checkUser: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setAppSource: (source: AppSource) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  appSource: 'nucleo',
  checkUser: async () => {
    const supabase = createClient()
    if (!supabase) {
      set({ user: null, session: null, isAuthenticated: false, isLoading: false })
      return
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      set({ user: null, session: null, isAuthenticated: false, isLoading: false })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, theme_preference')
      .eq('id', user.id)
      .maybeSingle()

    // role vacío en DB no debe quedar como "" (HomeView cuelga en !role)
    const resolvedRole =
      (typeof profile?.role === 'string' && profile.role.trim()) ||
      (typeof user.app_metadata?.role === 'string' && user.app_metadata.role) ||
      'cliente'

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

    if (profile) {
      const rawTheme = profile.theme_preference
      const theme_preference: AuthUser['theme_preference'] =
        rawTheme === 'light' || rawTheme === 'dark' || rawTheme === 'system'
          ? rawTheme
          : 'system'

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email ?? user.email ?? '',
        role: resolvedRole,
        territorial_rol,
        nivel_guardian: '',
        full_name: profile.full_name ?? '',
        avatar_url: '',
        theme_preference,
      }
      set({ user: authUser, session, isAuthenticated: true, isLoading: false })
      return
    }

    // Fallback: session exists but profile row is missing — keep authenticated
    // to avoid desync with middleware and allow app to self-heal.
    // Only trust app_metadata for role; use safe defaults for preferences.
    const fallbackUser: AuthUser = {
      id: user.id,
      email: user.email ?? '',
      role: (user.app_metadata?.role as string) ?? 'cliente',
      territorial_rol,
      nivel_guardian: '',
      full_name: '',
      avatar_url: '',
      theme_preference: 'system',
    }
    set({ user: fallbackUser, session, isAuthenticated: true, isLoading: false })
  },
  refreshSession: async () => {
    await get().checkUser()
  },
  signOut: async () => {
    const supabase = createClient()
    if (supabase) {
      const user = get().user
      if (user?.email) {
        try {
          await logSecurityEvent(supabase, { eventType: 'session_revoked', email: user.email, userId: user.id, appSource: get().appSource })
        } catch (error) {
          console.error('[auth-store] error logging session_revoked:', error)
        }
      }
      await supabase.auth.signOut()
    }
    set({ user: null, session: null, isAuthenticated: false })
  },
  setAppSource: (source: AppSource) => set({ appSource: source }),
}))
