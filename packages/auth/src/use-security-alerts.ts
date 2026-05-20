'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SecurityEvent, SecurityEventType } from './security-events'

interface UseSecurityAlertsOptions {
  supabaseClient: unknown
  limit?: number
  autoRefresh?: boolean
  refreshIntervalMs?: number
}

interface UseSecurityAlertsReturn {
  events: SecurityEvent[]
  recentFailures: SecurityEvent[]
  isLoading: boolean
  refresh: () => Promise<void>
  failureCountForEmail: (email: string, withinMinutes?: number) => number
}

export function useSecurityAlerts({
  supabaseClient,
  limit = 50,
  autoRefresh = true,
  refreshIntervalMs = 30000,
}: UseSecurityAlertsOptions): UseSecurityAlertsReturn {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    const supabase = supabaseClient as {
      from(table: string): {
        select(cols: string): {
          order(col: string, opts: { ascending: boolean }): {
            limit(n: number): Promise<{
              data: Record<string, unknown>[] | null
              error: { message: string } | null
            }>
          }
        }
      }
    }
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) {
      console.error('[useSecurityAlerts] Fetch error:', error?.message)
      return
    }

    const mapped: SecurityEvent[] = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      eventType: row.event_type as SecurityEventType,
      email: row.email as string,
      userId: row.user_id as string | null,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      details: (row.details ?? {}) as Record<string, unknown>,
      appSource: row.app_source as SecurityEvent['appSource'],
      createdAt: row.created_at as string,
    }))

    setEvents(mapped)
    setIsLoading(false)
  }, [supabaseClient, limit])

  useEffect(() => {
    void fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => void fetchEvents(), refreshIntervalMs)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshIntervalMs, fetchEvents])

  const recentFailures = events.filter((e) => {
    if (e.eventType !== 'login_failed') return false
    const cutoff = new Date(Date.now() - 15 * 60 * 1000)
    return new Date(e.createdAt) >= cutoff
  })

  const failureCountForEmail = useCallback(
    (email: string, withinMinutes: number = 15): number => {
      const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)
      return events.filter(
        (e) =>
          e.eventType === 'login_failed' &&
          e.email === email &&
          new Date(e.createdAt) >= cutoff
      ).length
    },
    [events]
  )

  return { events, recentFailures, isLoading, refresh: fetchEvents, failureCountForEmail }
}
