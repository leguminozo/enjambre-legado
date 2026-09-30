'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BadgeDotColor, SidebarBadge } from '../config/sidebar-config'
import { supabase } from '../lib/supabase'

/** Claves reales de badges — una por módulo con estado operativo en vivo */
export interface SidebarBadgeValues {
  colmenas: SidebarBadge
  envios: SidebarBadge
  sii: SidebarBadge
  banco: SidebarBadge
  alambique: SidebarBadge
  'ciclo-bosque': SidebarBadge
  pipeline: SidebarBadge
  'monitor-feria': SidebarBadge
  invitaciones: SidebarBadge
  'creadores-admin': SidebarBadge
  'operadores-feria': SidebarBadge
  territorio: SidebarBadge
}

interface SidebarBadgesRpc {
  colmenas_risk: number
  envios_pending: number
  facturas_pendientes: number
  banco_enabled: number
  destilaciones_activas: number
  eventos_hoy: number
  leads_activos: number
  feria_en_curso: number
  invitaciones_activas: number
  creadores_pendientes: number
  arqueos_abiertos: number
}

const DEFAULT_BADGES: SidebarBadgeValues = {
  colmenas: null,
  envios: null,
  sii: null,
  banco: null,
  alambique: null,
  'ciclo-bosque': null,
  pipeline: null,
  'monitor-feria': null,
  invitaciones: null,
  'creadores-admin': null,
  'operadores-feria': null,
  territorio: null,
}

const CACHE_KEY = 'nucleo:sidebar-badges:v4'
// 5 min: el RPC tiene índices parciales para cada COUNT, pero sigue siendo el
// endpoint más pesado del admin (11 conteos con RLS). Poll-on-focus ya respeta
// este caché, así que un TTL largo es el único freno a la frecuencia.
const CACHE_TTL_MS = 300_000

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

function countBadge(value: number): SidebarBadge {
  return value > 0 ? { type: 'count', value } : null
}

function mapRpcToBadges(data: SidebarBadgesRpc): SidebarBadgeValues {
  return {
    ...DEFAULT_BADGES,
    colmenas: countBadge(data.colmenas_risk),
    envios: countBadge(data.envios_pending),
    sii: countBadge(data.facturas_pendientes),
    banco:
      data.banco_enabled === 0
        ? { type: 'dot', color: 'orange' as BadgeDotColor }
        : { type: 'dot', color: 'green' as BadgeDotColor },
    alambique: countBadge(data.destilaciones_activas),
    'ciclo-bosque': countBadge(data.eventos_hoy),
    pipeline: countBadge(data.leads_activos),
    'monitor-feria':
      data.feria_en_curso > 0
        ? { type: 'dot', color: 'green' as BadgeDotColor }
        : null,
    invitaciones: countBadge(data.invitaciones_activas),
    'creadores-admin': countBadge(data.creadores_pendientes),
    'operadores-feria': countBadge(data.arqueos_abiertos),
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

/** Fallback solo para entornos sin el RPC v2 (todas las tablas son RLS-accessible a admin) */
async function fetchBadgesLegacy(): Promise<SidebarBadgeValues> {
  if (!supabase) return DEFAULT_BADGES

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [
    colmenasRisk,
    enviosPending,
    facturasPendientes,
    integrationsConfig,
    destilacionesActivas,
    eventosHoy,
    leadsActivos,
    feriaEnCurso,
    invitacionesActivas,
    creadoresPendientes,
    arqueosAbiertos,
  ] = await Promise.all([
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
    safeCount(
      supabase
        .from('destilaciones')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['en_proceso', 'planificada']),
    ),
    safeCount(
      supabase
        .from('calendario_eventos')
        .select('id', { count: 'exact', head: true })
        .gte('starts_at', todayStart.toISOString())
        .lt('starts_at', tomorrowStart.toISOString()),
    ),
    safeCount(
      supabase
        .from('crm_leads')
        .select('id', { count: 'exact', head: true })
        .not('estado', 'in', '("cerrado_ganado","cerrado_perdido")'),
    ),
    safeCount(
      supabase
        .from('participante_evento')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'en_curso'),
    ),
    safeCount(
      supabase
        .from('invitation_codes')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`),
    ),
    safeCount(
      supabase
        .from('creadores')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
    ),
    safeCount(
      supabase
        .from('participante_arqueo')
        .select('id', { count: 'exact', head: true })
        .is('cerrado_at', null),
    ),
  ])

  return {
    ...DEFAULT_BADGES,
    colmenas: countBadge(colmenasRisk.count ?? 0),
    envios: countBadge(enviosPending.count ?? 0),
    sii: countBadge(facturasPendientes.count ?? 0),
    banco:
      (integrationsConfig.count ?? 0) === 0
        ? { type: 'dot', color: 'orange' as BadgeDotColor }
        : { type: 'dot', color: 'green' as BadgeDotColor },
    alambique: countBadge(destilacionesActivas.count ?? 0),
    'ciclo-bosque': countBadge(eventosHoy.count ?? 0),
    pipeline: countBadge(leadsActivos.count ?? 0),
    'monitor-feria':
      (feriaEnCurso.count ?? 0) > 0
        ? { type: 'dot', color: 'green' as BadgeDotColor }
        : null,
    invitaciones: countBadge(invitacionesActivas.count ?? 0),
    'creadores-admin': countBadge(creadoresPendientes.count ?? 0),
    'operadores-feria': countBadge(arqueosAbiertos.count ?? 0),
  }
}

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadgeValues>(() => readCache() ?? DEFAULT_BADGES)
  const [isLoading, setIsLoading] = useState(() => readCache() === null)

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

    let next: SidebarBadgeValues

    const { data, error } = await supabase.rpc('get_sidebar_badges')
    if (!error && data && typeof data === 'object') {
      next = mapRpcToBadges(data as SidebarBadgesRpc)
    } else {
      next = await fetchBadgesLegacy()
    }

    const { data: actorRow } = await supabase
      .from('actores_registro')
      .select('completo')
      .eq('user_id', user.id)
      .maybeSingle()
    if (actorRow && actorRow.completo === false) {
      next = { ...next, territorio: { type: 'dot', color: 'orange' as BadgeDotColor } }
    }

    setBadges(next)
    writeCache(next)
    setIsLoading(false)
  }, [])

  // Carga diferida inicial para no bloquear hidratación
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

  // Poll-on-focus y visibilidad (Constitution § II.6: Realtime solo feria/caja/carrito; dashboards hacen poll-on-focus)
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase) return

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        const cached = readCache()
        if (!cached) {
          void fetchBadges()
        }
      }
    }

    // Intervalo pasivo de 5 minutos solo si la pestaña está visible
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchBadges()
      }
    }, 5 * 60_000)

    window.addEventListener('focus', handleFocusOrVisible)
    document.addEventListener('visibilitychange', handleFocusOrVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocusOrVisible)
      document.removeEventListener('visibilitychange', handleFocusOrVisible)
    }
  }, [fetchBadges])

  return { badges, isLoading, refetch: fetchBadges }
}
