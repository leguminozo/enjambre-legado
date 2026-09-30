'use client'

import React, { useEffect } from 'react'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from './supabase'
import { useAuthStore } from './auth-store'
import { ensurePersistentStorage, initPwaLifecycleSync } from './pwa-lifecycle'
import type { AppSource } from './security-events'

export interface EnjambreAuthProviderProps {
  children: React.ReactNode
  appSource?: AppSource
  enablePwaPersistence?: boolean
  enableLifecycleSync?: boolean
}

export function useAuthProvider(options?: {
  appSource?: AppSource
  enablePwaPersistence?: boolean
  enableLifecycleSync?: boolean
}) {
  const checkUser = useAuthStore((s) => s.checkUser)
  const refreshSession = useAuthStore((s) => s.refreshSession)
  const signOut = useAuthStore((s) => s.signOut)

  useEffect(() => {
    // 0. Hidratación optimista desde la bóveda local (post-hidratación de React:
    // leerla en el estado inicial del store rompía server/client y tiraba #418)
    useAuthStore.getState().hydrateFromVault()

    if (options?.appSource) {
      useAuthStore.getState().setAppSource(options.appSource)
    }

    // 1. Verificación inicial
    void checkUser()

    // 2. Persistencia en PWA (iOS WebKit / Android) para evitar desalojo de almacenamiento
    if (options?.enablePwaPersistence !== false) {
      void ensurePersistentStorage()
    }

    // 3. Sincronización de ciclo de vida (pageshow, visibilitychange, online, multiventana)
    let cleanupLifecycle = () => {}
    if (options?.enableLifecycleSync !== false) {
      cleanupLifecycle = initPwaLifecycleSync({
        onRefreshRequest: () => {
          void refreshSession()
        },
        onRevokeSession: () => {
          void signOut()
        },
      })
    }

    // 4. Suscripción a cambios de autenticación en Supabase
    const supabase = createClient()
    if (!supabase) {
      return () => {
        cleanupLifecycle()
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          void checkUser()
        } else {
          // Solo si Supabase emite explícitamente signed out
          useAuthStore.setState({ user: null, session: null, isAuthenticated: false, isLoading: false })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      cleanupLifecycle()
    }
  }, [checkUser, refreshSession, signOut, options?.appSource, options?.enablePwaPersistence, options?.enableLifecycleSync])
}

export function EnjambreAuthProvider({
  children,
  appSource,
  enablePwaPersistence = true,
  enableLifecycleSync = true,
}: EnjambreAuthProviderProps) {
  useAuthProvider({ appSource, enablePwaPersistence, enableLifecycleSync })
  return React.createElement(React.Fragment, null, children)
}
