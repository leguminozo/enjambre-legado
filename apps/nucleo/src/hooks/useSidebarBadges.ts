'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BadgeDotColor, SidebarBadge } from '../config/sidebar-config'
import { supabase } from '../lib/supabase'

interface SidebarBadgeValues {
  territorio: SidebarBadge
  colmenas: SidebarBadge
  bosque: SidebarBadge
  productos: SidebarBadge
  despacho: SidebarBadge
  comunidad: SidebarBadge
  contabilidad: SidebarBadge
  sii: SidebarBadge
  banco: SidebarBadge
  conciliacion: SidebarBadge
}

interface SidebarBadgesRpc {
  colmenas_risk: number
  envios_pending: number
  facturas_pendientes: number
  banco_enabled: number
}

const DEFAULT_BADGES: SidebarBadgeValues = {
  territorio: { type: 'dot', color: 'green' },
  colmenas: null,
  bosque: null,
  productos: null,
  despacho: null,
  comunidad: null,
  contabilidad: null,
  sii: null,
  banco: null,
  conciliacion: null,
}

const CACHE_KEY = 'nucleo:sidebar-badges:v2'
const CACHE_TTL_MS = 60_000

type CountResult = { count: number | null; error: unknown }

function readCache(): SidebarBadgeValues | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { at, badges } = JSON.parse(raw) as { at: number; badges: SidebarBadgeValues }
    if (Date.now() - at > CACHE_TTL_MS) return null
    return badges
  } catch {
    return null
  }
}

function writeCache(badges: SidebarBadgeValues) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), badges }))
  } catch {
    /* quota */
  }
}

function mapRpcToBadges(data: SidebarBadgesRpc): SidebarBadgeValues {
  return {
    ...DEFAULT_BADGES,
    colmenas:
      data.colmenas_risk > 0 ? { type: 'count', value: data.colmenas_risk } : null,
    despacho:
      data.envios_pending > 0 ? { type: 'count', value: data.envios_pending } : null,
    sii:
      data.facturas_pendientes > 0
        ? { type: 'count', value: data.facturas_pendientes }
        : null,
    banco:
      data.banco_enabled === 0
        ? { type: 'dot', color: 'orange' as BadgeDotColor }
        : { type: 'dot', color: 'green' as BadgeDotColor },
  }
}

async function safeCount(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<CountResult> {
  try {
    const result = await query
    if (result.error) return { count: null, error: result.error }
    return { count: result.count, error: null }
  } catch (error) {
    return { count: null, error }
  }
}

async function fetchBadgesLegacy(): Promise<SidebarBadgeValues> {
  if (!supabase) return DEFAULT_BADGES

  const [colmenasRisk, enviosPending, facturasPendientes, integrationsConfig] =
    await Promise.all([
      safeCount(
        supabase
          .from('varroa_records')
          .select('colmena_id', { count: 'exact', head: true })
          .gt('level', 3),
      ),
      safeCount(
        supabase
          .from('logistica_envios')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendiente'),
      ),
      safeCount(
        supabase
          .from('facturas_emitidas')
          .select('id', { count: 'exact', head: true })
          .eq('estado_sii', 'pendiente'),
      ),
      safeCount(
        supabase
          .from('integrations')
          .select('id', { count: 'exact', head: true })
          .eq('key', 'banco_chile')
          .eq('enabled', true),
      ),
    ])

  return {
    ...DEFAULT_BADGES,
    colmenas:
      (colmenasRisk.count ?? 0) > 0
        ? { type: 'count', value: colmenasRisk.count ?? 0 }
        : null,
    despacho:
      (enviosPending.count ?? 0) > 0
        ? { type: 'count', value: enviosPending.count ?? 0 }
        : null,
    sii:
      (facturasPendientes.count ?? 0) > 0
        ? { type: 'count', value: facturasPendientes.count ?? 0 }
        : null,
    banco:
      (integrationsConfig.count ?? 0) === 0
        ? { type: 'dot', color: 'orange' as BadgeDotColor }
        : { type: 'dot', color: 'green' as BadgeDotColor },
  }
}

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadgeValues>(() => readCache() ?? DEFAULT_BADGES)
  const [isLoading, setIsLoading] = useState(() => readCache() === null)

  // Debounce para colapsar bursts de eventos realtime en una sola fetch.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchBadges = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    let next = DEFAULT_BADGES

    const { data, error } = await supabase.rpc('get_sidebar_badges')
    if (!error && data && typeof data === 'object') {
      next = mapRpcToBadges(data as SidebarBadgesRpc)
    } else {
      next = await fetchBadgesLegacy()
    }

    setBadges(next)
    writeCache(next)
    setIsLoading(false)
  }, [])

  // Trailing-edge ~300ms. El fetch inicial (Effect #1, idle-deferred) llama directo;
  // solo los handlers de realtime usan esta versión para no thrashhear RPC + getUser.
  const fetchBadgesDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchBadges()
    }, 300)
  }, [fetchBadges])

  useEffect(() => {
    const defer =
      typeof requestIdleCallback !== 'undefined'
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: 3000 })
        : (cb: () => void) => window.setTimeout(cb, 800)

    const id = defer(() => {
      void fetchBadges()
    })

    return () => {
      if (typeof cancelIdleCallback !== 'undefined' && typeof id === 'number') {
        cancelIdleCallback(id)
      } else {
        window.clearTimeout(id as number)
      }
    }
  }, [fetchBadges])

  useEffect(() => {
    if (!supabase) return

    // Refs vivos a lo largo del ciclo del efecto: canal activo, timer de backoff,
    // contador de reintentos y flag de desmonte para no reconectar tras cleanup.
    const channelRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null }
    const reconnectRef = { current: null as ReturnType<typeof setTimeout> | null }
    const attemptsRef = { current: 0 }
    let disposed = false

    // Crea (o recrea) el canal. Solo se suscribe si hay sesión activa; sin sesión,
    // RLS descarta silenciosamente los payloads, así que esperamos a onAuthStateChange.
    const setupChannel = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (disposed || !session) return

      // Un solo canal + todos los .on() ANTES de subscribe().
      // Nombre único: evita reutilizar un canal ya suscrito (Strict Mode / remount)
      // que lanza "cannot add postgres_changes callbacks after subscribe()".
      const channelName = `sidebar-badges-${Math.random().toString(36).slice(2, 10)}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'varroa_records' },
          () => fetchBadgesDebounced(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'logistica_envios' },
          () => fetchBadgesDebounced(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'facturas_emitidas' },
          () => fetchBadgesDebounced(),
        )
        .subscribe((status: string, err?: Error) => {
          if (status === 'SUBSCRIBED') {
            attemptsRef.current = 0
            return
          }
          // TIMED_OUT | CLOSED | CHANNEL_ERROR: heartbeat muerto o JWT expirado.
          // Tear down + backoff exponencial (1s, 2s, 4s, ... capped 30s, ~5 intentos).
          // Cada reintento re-resuelve getSession() para usar un token ya refrescado.
          if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error('[useSidebarBadges] realtime error', status, err)
            if (channelRef.current) {
              const old = channelRef.current
              channelRef.current = null
              void supabase.removeChannel(old)
            }
            if (attemptsRef.current >= 5 || disposed) return
            const delay = Math.min(1000 * 2 ** attemptsRef.current, 30_000)
            attemptsRef.current += 1
            if (reconnectRef.current) clearTimeout(reconnectRef.current)
            reconnectRef.current = setTimeout(() => {
              void setupChannel()
            }, delay)
          }
        })

      channelRef.current = channel
    }

    // Re-subscribe en cambios de sesión. Crítico para sesiones largas p.ej. admin
    // creando cuentas en el Panel de Identidades: el token vence en mitad de la
    // operación y hay que reenganchar el canal con el token refrescado.
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (disposed) return
      if (event === 'SIGNED_OUT') {
        if (channelRef.current) {
          const old = channelRef.current
          channelRef.current = null
          void supabase.removeChannel(old)
        }
        return
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (channelRef.current) {
          const old = channelRef.current
          channelRef.current = null
          void supabase.removeChannel(old)
        }
        attemptsRef.current = 0
        void setupChannel()
      }
    })

    void setupChannel()

    return () => {
      disposed = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      if (channelRef.current) {
        const old = channelRef.current
        channelRef.current = null
        void supabase.removeChannel(old)
      }
      authSub.unsubscribe()
    }
  }, [fetchBadgesDebounced])

  return { badges, isLoading, refetch: fetchBadges }
}