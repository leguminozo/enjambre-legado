import { create } from 'zustand'
import { createClient } from './supabase'
import { logSecurityEvent } from './security-events'
import type { AppSource } from './security-events'
import type { Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: string
  nivel_guardian: string
  full_name: string
  avatar_url: string
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

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        set({ user: profile as AuthUser, session, isAuthenticated: true, isLoading: false })
        return
      }
    }

    set({ user: null, session: null, isAuthenticated: false, isLoading: false })
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
