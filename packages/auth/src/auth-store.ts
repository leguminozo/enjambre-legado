import { create } from 'zustand'
import { createClient } from './supabase'

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
  isAuthenticated: boolean
  isLoading: boolean
  checkUser: () => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  checkUser: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        set({ user: profile as AuthUser, isAuthenticated: true, isLoading: false })
        return
      }
    }
    
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
  refreshSession: async () => {
    get().checkUser()
  },
  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  }
}))
