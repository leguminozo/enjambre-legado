-- Tabla de eventos de seguridad: login fallido, password reset, accesos sospechosos, etc.
-- Permite auditoría centralizada desde cualquier app del ecosistema.

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
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
    'oauth_linked'
  )),
  email TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  app_source TEXT NOT NULL CHECK (app_source IN ('tienda', 'nucleo', 'campo', 'api')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_email ON public.security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gerente y tienda_admin leen eventos de seguridad" ON public.security_events;
CREATE POLICY "Gerente y tienda_admin leen eventos de seguridad" ON public.security_events
  FOR SELECT
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin');

DROP POLICY IF EXISTS "Cualquier usuario autenticado puede insertar eventos" ON public.security_events;
CREATE POLICY "Cualquier usuario autenticado puede insertar eventos" ON public.security_events
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.security_events IS 'Auditoría de eventos de seguridad: login fallido, password reset, accesos sospechosos, etc.';
