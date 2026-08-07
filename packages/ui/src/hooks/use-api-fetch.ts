'use client'

import { useCallback } from 'react'

export type ApiFetchSession = { access_token?: string } | null

/** Mínimo estructural de SupabaseClient que usa el hook (sin dep del SDK). */
export type ApiFetchSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; app_metadata?: Record<string, unknown> } | null } }>
    getSession: () => Promise<{ data: { session: { access_token?: string } | null } }>
  }
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        limit: (n: number) => {
          maybeSingle: () => Promise<{ data: { empresa_id?: string | null } | null }>
        }
      }
    }
  }
}

/** Cache membership por userId (JWT claim o usuarios_empresas). */
let empresaIdCache: { userId: string; empresaId: string } | null = null

async function resolveEmpresaId(
  supabase: ApiFetchSupabase,
  user: { id: string; app_metadata?: Record<string, unknown> },
): Promise<string> {
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

/**
 * apiFetch canónico: JWT refrescado (getUser → getSession), Bearer y
 * x-empresa-id con cache de membership. Los apps aportan su cliente Supabase
 * y la sesión del store vía wrapper local (evita dependencia ui → auth).
 */
export function useApiFetch(
  supabase: ApiFetchSupabase,
  session: ApiFetchSession,
) {
  return useCallback(
    async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
      // getUser() valida el JWT con Supabase Auth (y refresca si expiró).
      const { data: { user } } = await supabase.auth.getUser()
      // Tras getUser(), getSession() devuelve la sesión ya refrescada (local, sin red).
      // Preferirla al snapshot del store evita enviar un Bearer expirado (401 en BFF).
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session ?? session
      const token = currentSession?.access_token ?? ''
      // JWT claim o membership (usuarios_empresas) — paridad con tenantMiddleware
      const empresaId = user ? await resolveEmpresaId(supabase, user) : ''

      const headers = new Headers(init?.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (empresaId) headers.set('x-empresa-id', empresaId)
      if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }

      return fetch(path, { ...init, headers })
    },
    [session, supabase],
  )
}
