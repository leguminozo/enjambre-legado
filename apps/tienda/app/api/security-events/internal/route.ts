import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const VALID_EVENT_TYPES = new Set([
  'login_failed',
  'login_success',
  'password_reset_requested',
  'password_changed',
  'account_locked',
  'suspicious_activity',
  'role_change',
  'session_revoked',
  'mfa_enabled',
  'mfa_disabled',
  'oauth_linked',
  'access_denied',
  'signup_success',
])

export async function POST(request: Request) {
  const internalKey = request.headers.get('x-internal-key')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!internalKey || internalKey !== serviceRoleKey) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const body = await request.json()

  const eventType = body.event_type ?? body.eventType
  if (!VALID_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
  }

  const { error } = await supabase.from('security_events').insert({
    event_type: eventType,
    email: body.email ?? '',
    user_id: body.userId ?? body.user_id ?? null,
    ip_address: body.ip_address ?? body.ipAddress ?? null,
    user_agent: body.user_agent ?? body.userAgent ?? null,
    details: body.details ?? {},
    app_source: body.app_source ?? body.appSource ?? 'tienda',
  })

  if (error) {
    console.error('[security-events/internal] insert error:', error.message)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
