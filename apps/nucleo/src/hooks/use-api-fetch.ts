'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@enjambre/auth'
import { supabase } from '@/lib/supabase'
import { getEmpresaId } from '@/lib/api'

export function useApiFetch() {
  const session = useAuthStore((s) => s.session)

  return useCallback(async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    // getUser() valida el JWT con Supabase Auth (y refresca si expiró).
    const { data: { user } } = await supabase.auth.getUser()
    // Tras getUser(), getSession() devuelve la sesión ya refrescada (local, sin red).
    // Preferirla al snapshot del store evita enviar un Bearer expirado (401 en BFF).
    const { data } = await supabase.auth.getSession()
    const currentSession = data.session ?? session
    const token = currentSession?.access_token ?? ''
    // JWT claim o membership (usuarios_empresas) — paridad con tenantMiddleware
    const empresaId = user ? await getEmpresaId() : ''

    const headers = new Headers(init?.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (empresaId) headers.set('x-empresa-id', empresaId)
    if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    return fetch(path, { ...init, headers })
  }, [session])
}
