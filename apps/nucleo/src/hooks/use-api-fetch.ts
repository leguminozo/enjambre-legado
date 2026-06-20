'use client'

import { createClient } from '@enjambre/auth'
import { useAuthStore } from '@enjambre/auth'
import { supabase } from '@/lib/supabase'

export function useApiFetch() {
  const session = useAuthStore((s) => s.session)

  return async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    const { data: { user } } = await supabase.auth.getUser()
    const currentSession = session ?? (await supabase.auth.getSession())?.data?.session ?? null
    const token = currentSession?.access_token ?? ''
    const empresaId = user?.app_metadata?.empresa_id ?? ''

    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (empresaId) headers.set('x-empresa-id', empresaId)
    if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(path, { ...init, headers })
  }
}
