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

const ANON_ALLOWED_EVENTS = new Set([
  'login_failed',
  'password_reset_requested',
  'signup_success',
])

export async function POST(request: Request) {
  const internalKey = request.headers.get('x-internal-key')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (internalKey && internalKey === serviceRoleKey) {
    return handleInternal(request, serviceRoleKey)
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return handleAuthenticated(request, authHeader.slice(7))
}

async function handleInternal(request: Request, serviceRoleKey: string) {
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

async function handleAuthenticated(request: Request, token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = await request.json()
  const eventType = body.event_type ?? body.eventType

  if (!VALID_EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
  }

  const { error } = await supabase.from('security_events').insert({
    event_type: eventType,
    email: body.email ?? user.email ?? '',
    user_id: user.id,
    ip_address: body.ip_address ?? body.ipAddress ?? null,
    user_agent: body.user_agent ?? body.userAgent ?? null,
    details: body.details ?? {},
    app_source: body.app_source ?? body.appSource ?? 'tienda',
  })

  if (error) {
    console.error('[security-events] insert error:', error.message)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
