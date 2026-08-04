'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@enjambre/auth'
import { supabase } from '@/lib/supabase'

export function useApiFetch() {
  const session = useAuthStore((s) => s.session)

  return useCallback(async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    // getUser() validates JWT with Supabase Auth server (and refreshes if expired).
    const { data: { user } } = await supabase.auth.getUser()
    // After getUser(), getSession() returns the already-refreshed session (local, no network).
    // Preferring it over the store snapshot avoids sending an expired Bearer (401 in BFF).
    const { data } = await supabase.auth.getSession()
    const currentSession = data.session ?? session
    const token = currentSession?.access_token ?? ''
    const empresaId = user?.app_metadata?.empresa_id ?? ''

    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (empresaId) headers.set('x-empresa-id', empresaId)
    if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(path, { ...init, headers })
  }, [session])
}
