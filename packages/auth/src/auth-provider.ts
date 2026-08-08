'use client'

import { useEffect } from 'react'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from './supabase'
import { useAuthStore } from './auth-store'

export function useAuthProvider() {
  const checkUser = useAuthStore((s) => s.checkUser)

  useEffect(() => {
    // checkUser nunca rechaza (el store se asienta en su catch interno);
    // el .catch es defensivo para no propagar unhandled rejections.
    checkUser().catch(() => undefined)

    const supabase = createClient()
    if (!supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        checkUser().catch(() => undefined)
      } else {
        useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [checkUser])
}
