-- Phase 5: Add access_denied + signup_success to security_events CHECK,
-- allow anon INSERT for pre-auth events (login_failed, password_reset_requested, signup_success).

ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_event_type_check;

ALTER TABLE public.security_events ADD CONSTRAINT security_events_event_type_check
  CHECK (event_type IN (
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
    'signup_success'
  ));

DROP POLICY IF EXISTS "Cualquier usuario autenticado puede insertar eventos" ON public.security_events;

CREATE POLICY "Usuarios autenticados pueden insertar eventos" ON public.security_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anon puede insertar eventos pre-auth" ON public.security_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND event_type IN ('login_failed', 'password_reset_requested', 'signup_success')
  );
