'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ThemeProvider, ToastProvider, useTheme } from '@enjambre/ui'
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

function ThemeSync() {
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((s) => s.user)

  // 1. Sync from DB to device on load
  useEffect(() => {
    if (user?.theme_preference && user.theme_preference !== theme) {
      setTheme(user.theme_preference)
    }
  }, [user?.theme_preference])

  // 2. Sync from device to DB on change
  useEffect(() => {
    if (user?.id && theme) {
      const supabase = createClient()
      if (supabase) {
        const updateTheme = async () => {
          const { error } = await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('id', user.id)
          if (error) {
            console.error('[ThemeSync] Error updating theme preference:', error)
          }
        }
        updateTheme()
      }
    }
  }, [theme, user?.id])

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
    <ThemeProvider defaultTheme="dark">
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