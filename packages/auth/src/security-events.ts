export type SecurityEventType =
  | 'login_failed'
  | 'login_success'
  | 'password_reset_requested'
  | 'password_changed'
  | 'account_locked'
  | 'suspicious_activity'
  | 'role_change'
  | 'session_revoked'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'oauth_linked'
  | 'access_denied'
  | 'signup_success'

export type AppSource = 'tienda' | 'nucleo' | 'campo' | 'api'

interface SecurityEventPayload {
  eventType: SecurityEventType
  email: string
  userId?: string | null
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
  appSource: AppSource
}

interface SecurityEvent {
  id: string
  eventType: SecurityEventType
  email: string
  userId: string | null
  ipAddress: string | null
  userAgent: string | null
  details: Record<string, unknown>
  appSource: AppSource
  createdAt: string
}

function assertSupabaseClient(client: unknown): asserts client is {
  from(table: string): {
    insert(rows: Record<string, unknown>): Promise<{ error: { message: string } | null }>
  }
} {
  if (
    !client ||
    typeof client !== 'object' ||
    !('from' in client) ||
    typeof (client as Record<string, unknown>).from !== 'function'
  ) {
    throw new Error('[SecurityEvents] Invalid Supabase client: missing .from()')
  }
}

function assertQueryableClient(client: unknown): asserts client is {
  from(table: string): {
    select(cols: string): {
      eq(col: string, val: string): {
        order(col: string, opts: { ascending: boolean }): {
          limit(n: number): Promise<{
            data: Record<string, unknown>[] | null
            error: { message: string } | null
          }>
        }
      }
    }
  }
} {
  assertSupabaseClient(client)
}

export async function logSecurityEvent(
  supabaseClient: unknown,
  payload: SecurityEventPayload
): Promise<void> {
  assertSupabaseClient(supabaseClient)

  const { error } = await supabaseClient
    .from('security_events')
    .insert({
      event_type: payload.eventType,
      email: payload.email,
      user_id: payload.userId ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null,
      details: payload.details ?? {},
      app_source: payload.appSource,
    })

  if (error) {
    console.error('[SecurityEvents] Failed to log:', error.message)
  }
}

export function isRepeatedFailure(
  events: SecurityEvent[],
  withinMinutes: number = 15,
  maxAttempts: number = 5
): boolean {
  const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString()
  const recentFailures = events.filter(
    (e) => e.eventType === 'login_failed' && e.createdAt >= cutoff
  )
  return recentFailures.length >= maxAttempts
}

export async function fetchSecurityEvents(
  supabaseClient: unknown,
  email: string,
  limit: number = 10
): Promise<SecurityEvent[]> {
  assertQueryableClient(supabaseClient)

  const { data, error } = await supabaseClient
    .from('security_events')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    eventType: row.event_type as SecurityEventType,
    email: row.email as string,
    userId: row.user_id as string | null,
    ipAddress: row.ip_address as string | null,
    userAgent: row.user_agent as string | null,
    details: (row.details ?? {}) as Record<string, unknown>,
    appSource: row.app_source as AppSource,
    createdAt: row.created_at as string,
  }))
}

export type { SecurityEvent, SecurityEventPayload }
