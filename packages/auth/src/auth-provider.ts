'use client'

import { useEffect } from 'react'
import { createClient } from './supabase'
import { useAuthStore } from './auth-store'

export function useAuthProvider() {
  const checkUser = useAuthStore((s) => s.checkUser)

  useEffect(() => {
    checkUser()

    const supabase = createClient()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkUser()
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [checkUser])
}
