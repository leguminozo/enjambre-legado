'use client'

import { useState, useEffect, useCallback } from 'react'
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

const DEFAULT_BADGES: SidebarBadgeValues = {
  territorio: null,
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

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadgeValues>(DEFAULT_BADGES)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBadges = useCallback(async () => {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const [colmenasRisk, enviosPending, facturasPendientes, integrationsConfig] = await Promise.all([
        supabase.from('varroa_records').select('colmena_id', { count: 'exact', head: true }).gt('level', 3),
        supabase.from('logistica_envios').select('id', { count: 'exact', head: true }).eq('status', 'pendiente'),
        supabase.from('facturas_emitidas').select('id', { count: 'exact', head: true }).eq('estado_sii', 'pendiente'),
        supabase.from('integrations').select('id', { count: 'exact', head: true }).eq('key', 'banco_chile').eq('enabled', true),
      ])

      setBadges(prev => ({
        ...prev,
        territorio: { type: 'dot', color: 'green' as BadgeDotColor },
        colmenas: (colmenasRisk.count ?? 0) > 0
          ? { type: 'count', value: colmenasRisk.count ?? 0 }
          : null,
        despacho: (enviosPending.count ?? 0) > 0
          ? { type: 'count', value: enviosPending.count ?? 0 }
          : null,
        sii: (facturasPendientes.count ?? 0) > 0
          ? { type: 'count', value: facturasPendientes.count ?? 0 }
          : null,
        banco: (integrationsConfig.count ?? 0) === 0
          ? { type: 'dot', color: 'orange' as BadgeDotColor }
          : { type: 'dot', color: 'green' as BadgeDotColor },
      }))
} catch (error) {
    console.error('[sidebar-badges] fetch error:', error)
    setBadges(DEFAULT_BADGES)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  useEffect(() => {
    if (!supabase) return

  const channels = [
    supabase
      .channel('sidebar-varroa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'varroa_records' }, () => {
        fetchBadges()
      })
.subscribe((status: string) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('[Realtime] sidebar-varroa channel error')
    }
  }),
  supabase
  .channel('sidebar-envios')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'logistica_envios' }, () => {
    fetchBadges()
  })
  .subscribe((status: string) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('[Realtime] sidebar-envios channel error')
    }
  }),
  supabase
  .channel('sidebar-facturas')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas_emitidas' }, () => {
    fetchBadges()
  })
  .subscribe((status: string) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('[Realtime] sidebar-facturas channel error')
    }
  }),
  ]

  return () => {
    channels.forEach(ch => supabase.removeChannel(ch))
  }
  }, [fetchBadges])

  return { badges, isLoading, refetch: fetchBadges }
}
