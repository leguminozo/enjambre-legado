-- Salud de plataforma (II): historial de crons + umbrales configurables + webhooks.
-- Sin cuarto proyecto ni servicios externos: todo se mide sobre tablas existentes.

-- 1) Historial de ejecuciones de cron (los 3 diarios de vercel.json)
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job TEXT NOT NULL CHECK (job IN ('notifications', 'fiscal', 'checkout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  success BOOLEAN NOT NULL DEFAULT false,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_job_started
  ON public.cron_runs (job, started_at DESC);

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cron_runs_admin_read" ON public.cron_runs;
CREATE POLICY "cron_runs_admin_read" ON public.cron_runs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "cron_runs_service_all" ON public.cron_runs;
CREATE POLICY "cron_runs_service_all" ON public.cron_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2) Umbrales configurables del semáforo (warning/critical por métrica)
CREATE TABLE IF NOT EXISTS public.salud_umbrales (
  key TEXT PRIMARY KEY,
  warning NUMERIC NOT NULL,
  critical NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salud_umbrales_order CHECK (warning < critical)
);

ALTER TABLE public.salud_umbrales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "salud_umbrales_admin_all" ON public.salud_umbrales;
CREATE POLICY "salud_umbrales_admin_all" ON public.salud_umbrales
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.salud_umbrales (key, warning, critical) VALUES
  ('db_usage_pct', 60, 80),
  ('checkout_pendientes', 10, 50),
  ('notif_queue_pending', 50, 200),
  ('webhook_fail_rate_pct', 5, 20),
  ('cron_stale_hours', 26, 50)
ON CONFLICT (key) DO NOTHING;

-- 3) RPC: tasa de éxito de webhooks de pago 24h/7d.
-- Éxito = sesiones completadas; fallo = payment_failures no resueltos.
CREATE OR REPLACE FUNCTION public.admin_webhooks_health()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'sessions_24h', jsonb_build_object(
      'completed', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'completed' AND completed_at >= now() - INTERVAL '24 hours'),
      'pending', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'pending'),
      'expired_24h', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'expired' AND created_at >= now() - INTERVAL '24 hours')
    ),
    'failures_24h', jsonb_build_object(
      'pending', (SELECT count(*) FROM public.payment_failures WHERE status = 'pending' AND created_at >= now() - INTERVAL '24 hours'),
      'retrying', (SELECT count(*) FROM public.payment_failures WHERE status = 'retrying' AND created_at >= now() - INTERVAL '24 hours'),
      'failed', (SELECT count(*) FROM public.payment_failures WHERE status = 'failed' AND created_at >= now() - INTERVAL '24 hours'),
      'resolved_24h', (SELECT count(*) FROM public.payment_failures WHERE status = 'resolved' AND resolved_at >= now() - INTERVAL '24 hours')
    ),
    'sessions_7d', jsonb_build_object(
      'completed', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'completed' AND completed_at >= now() - INTERVAL '7 days'),
      'expired_7d', (SELECT count(*) FROM public.checkout_sessions WHERE status = 'expired' AND created_at >= now() - INTERVAL '7 days')
    ),
    'failures_7d', jsonb_build_object(
      'open', (SELECT count(*) FROM public.payment_failures WHERE status IN ('pending', 'retrying', 'failed') AND created_at >= now() - INTERVAL '7 days'),
      'resolved_7d', (SELECT count(*) FROM public.payment_failures WHERE status = 'resolved' AND resolved_at >= now() - INTERVAL '7 days')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4) RPC: último run de cada cron + horas desde entonces.
CREATE OR REPLACE FUNCTION public.admin_crons_health()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(jsonb_object_agg(job, run), '{}'::jsonb) INTO v_result
  FROM (
    SELECT DISTINCT ON (r.job) r.job,
      jsonb_build_object(
        'started_at', r.started_at,
        'finished_at', r.finished_at,
        'duration_ms', r.duration_ms,
        'success', r.success,
        'summary', r.summary,
        'error', r.error,
        'stale_hours', round(EXTRACT(EPOCH FROM (now() - r.started_at)) / 3600.0, 1)
      ) AS run
    FROM public.cron_runs r
    ORDER BY r.job, r.started_at DESC
  ) t;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_webhooks_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_crons_health() TO authenticated;
