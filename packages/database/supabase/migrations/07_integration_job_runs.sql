-- Historial genérico de jobs de integración (SII, bancos, etc.) para auditoría y cron futuro.

CREATE TABLE IF NOT EXISTS public.integration_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  trigger_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'cron')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS integration_job_runs_key_created_idx
  ON public.integration_job_runs (integration_key, created_at DESC);

ALTER TABLE public.integration_job_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS integration_job_runs_rw ON public.integration_job_runs;
CREATE POLICY integration_job_runs_rw ON public.integration_job_runs FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');
