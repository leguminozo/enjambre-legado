'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@enjambre/auth'
import { supabase } from '@/lib/supabase'

/** Cache membership por userId (JWT claim o usuarios_empresas). */
let empresaIdCache: { userId: string; empresaId: string } | null = null

async function resolveEmpresaId(user: {
  id: string
  app_metadata?: Record<string, unknown>
}): Promise<string> {
  const cached = empresaIdCache
  if (cached && cached.userId === user.id && cached.empresaId) {
    return cached.empresaId
  }

  const fromJwt =
    typeof user.app_metadata?.empresa_id === 'string'
      ? user.app_metadata.empresa_id.trim()
      : ''
  if (fromJwt) {
    empresaIdCache = { userId: user.id, empresaId: fromJwt }
    return fromJwt
  }

  const { data } = await supabase
    .from('usuarios_empresas')
    .select('empresa_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const id =
    data && typeof data.empresa_id === 'string' ? data.empresa_id : ''
  empresaIdCache = { userId: user.id, empresaId: id }
  return id
}

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
    const empresaId = user ? await resolveEmpresaId(user) : ''

    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (empresaId) headers.set('x-empresa-id', empresaId)
    if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(path, { ...init, headers })
  }, [session])
}
