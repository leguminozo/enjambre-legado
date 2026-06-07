'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@enjambre/ui'
import { useAuthProvider, useAuthStore, createClient } from '@enjambre/auth'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

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

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthSync />
        {children}
        <Toaster position="bottom-right" richColors closeButton duration={4000} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
