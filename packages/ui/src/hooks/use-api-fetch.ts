'use client'

import { useCallback, useRef } from 'react'

export type ApiFetchSession = { access_token?: string; user?: { id: string; app_metadata?: Record<string, unknown> } } | null

/** Mínimo estructural de SupabaseClient que usa el hook (sin dep del SDK). */
export type ApiFetchSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; app_metadata?: Record<string, unknown> } | null } }>
    getSession: () => Promise<{ data: { session: { access_token?: string; user?: { id: string; app_metadata?: Record<string, unknown> } } | null } }>
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

/** Cache membership por userId (JWT claim o usuarios_empresas). Map para soportar id vacío legítimo. */
const empresaIdCache = new Map<string, string>()
const inFlightEmpresaResolutions = new Map<string, Promise<string>>()

export function _clearEmpresaIdCacheForTesting(): void {
  empresaIdCache.clear()
  inFlightEmpresaResolutions.clear()
}

export async function resolveEmpresaId(
  supabase: ApiFetchSupabase,
  user: { id: string; app_metadata?: Record<string, unknown> },
): Promise<string> {
  if (empresaIdCache.has(user.id)) {
    return empresaIdCache.get(user.id)!
  }

  const fromJwt =
    typeof user.app_metadata?.empresa_id === 'string'
      ? user.app_metadata.empresa_id.trim()
      : ''
  if (fromJwt) {
    empresaIdCache.set(user.id, fromJwt)
    return fromJwt
  }

  const existingPromise = inFlightEmpresaResolutions.get(user.id)
  if (existingPromise) return existingPromise

  const promise = (async () => {
    try {
      const { data } = await supabase
        .from('usuarios_empresas')
        .select('empresa_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      const id =
        data && typeof data.empresa_id === 'string' ? data.empresa_id : ''
      empresaIdCache.set(user.id, id)
      return id
    } catch {
      return ''
    } finally {
      inFlightEmpresaResolutions.delete(user.id)
    }
  })()

  inFlightEmpresaResolutions.set(user.id, promise)
  return promise
}

/**
 * apiFetch canónico: JWT refrescado localmente (getSession con fallback store),
 * Bearer y x-empresa-id con cache de membership persistente.
 * Retorna una función con referencia 100% estable en memoria para proteger
 * a los consumidores contra re-render loops y cascadas de red.
 */
export function useApiFetch(
  supabase: ApiFetchSupabase,
  session: ApiFetchSession,
) {
  const sessionRef = useRef(session)
  sessionRef.current = session

  const supabaseRef = useRef(supabase)
  supabaseRef.current = supabase

  return useCallback(
    async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
      const sb = supabaseRef.current
      // getSession() es local (memoria/storage) sin sobrecarga de red en cada fetch.
      const { data } = await sb.auth.getSession()
      const currentSession = data.session ?? sessionRef.current
      const token = currentSession?.access_token ?? ''

      let user = (currentSession as { user?: { id: string; app_metadata?: Record<string, unknown> } } | null)?.user
      if (!user && token) {
        try {
          const userRes = await sb.auth.getUser()
          user = userRes.data.user ?? undefined
        } catch {
          /* red caída / offline: continuar sin user resolution */
        }
      }

      // JWT claim o membership (usuarios_empresas) — paridad con tenantMiddleware
      const empresaId = user ? await resolveEmpresaId(sb, user) : ''

      const headers = new Headers(init?.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (empresaId) headers.set('x-empresa-id', empresaId)
      if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
      }

      return fetch(path, { ...init, headers })
    },
    [],
  )
}
