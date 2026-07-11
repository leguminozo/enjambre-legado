'use client'

import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider, ToastProvider, useTheme, type Theme } from '@enjambre/ui'
import { useAuthProvider, useAuthStore, createClient } from '@enjambre/auth'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createNucleoPersister, shouldPersistQuery } from '@/lib/query-persist'

let _cachedClient: SupabaseClient | null = null

export function useSupabase(): SupabaseClient {
  if (!_cachedClient) {
    _cachedClient = createClient()
  }
  return _cachedClient!
}

export function useSession(): Session | null {
  return useAuthStore((s) => s.session)
}

function AuthSync() {
  useAuthProvider()
  return null
}

function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark' || v === 'system'
}

/**
 * Sincroniza tema local ↔ profiles.theme_preference sin pelear:
 * 1) Al login aplica preferencia de DB una sola vez
 * 2) Solo persiste cuando el usuario cambia el tema (no al hidratar)
 */
function ThemeSync() {
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const appliedUserId = useRef<string | null>(null)
  const lastPersisted = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  // next-themes hidrata en cliente
  useEffect(() => {
    setReady(true)
  }, [])

  // 1. DB → dispositivo (una vez por sesión de usuario)
  useEffect(() => {
    if (!ready || !user?.id) {
      if (!user?.id) appliedUserId.current = null
      return
    }
    if (appliedUserId.current === user.id) return

    appliedUserId.current = user.id
    const pref = user.theme_preference
    if (isTheme(pref)) {
      lastPersisted.current = pref
      if (pref !== theme) {
        setTheme(pref)
      }
    } else {
      lastPersisted.current = theme
    }
    // theme deliberadamente fuera: solo al entrar el user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.id, user?.theme_preference, setTheme])

  // 2. Dispositivo → DB (debounce; ignora si es el valor ya aplicado desde DB)
  useEffect(() => {
    if (!ready || !user?.id || !isTheme(theme)) return
    if (appliedUserId.current !== user.id) return
    if (lastPersisted.current === theme) return

    const handle = window.setTimeout(async () => {
      const supabase = createClient()
      if (!supabase) return

      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: theme })
        .eq('id', user.id)

      if (error) {
        console.error('[ThemeSync] Error updating theme preference:', error)
        return
      }

      lastPersisted.current = theme
      // Mantener store alineado para no re-aplicar la preferencia vieja
      const current = useAuthStore.getState().user
      if (current && current.id === user.id && current.theme_preference !== theme) {
        useAuthStore.setState({
          user: { ...current, theme_preference: theme },
        })
      }
    }, 450)

    return () => window.clearTimeout(handle)
  }, [ready, theme, user?.id])

  return null
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
          },
        },
      }),
  )

  const persister = createNucleoPersister()

  const content = (
    <ThemeProvider defaultTheme="dark" enableSystem storageKey="enjambre-nucleo-theme">
      <ToastProvider>
        <AuthSync />
        <ThemeSync />
        {children}
      </ToastProvider>
    </ThemeProvider>
  )

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 30 * 60 * 1000,
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersistQuery,
        },
      }}
    >
      {content}
    </PersistQueryClientProvider>
  )
}
