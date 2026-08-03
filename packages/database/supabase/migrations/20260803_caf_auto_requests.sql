-- Movimiento 2 — CAF automático: auditoría/idempotencia de solicitudes de folios
CREATE TABLE IF NOT EXISTS public.sii_caf_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_dte INT NOT NULL,
  cantidad INT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'success', 'failed')),
  error TEXT,
  caf_id UUID REFERENCES public.sii_caf(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sii_caf_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sii_caf_requests FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sii_caf_requests TO service_role;

-- Una sola solicitud pending por (empresa, tipo_dte): evita solicitudes en paralelo
CREATE UNIQUE INDEX IF NOT EXISTS idx_sii_caf_requests_pending
  ON public.sii_caf_requests (empresa_id, tipo_dte)
  WHERE estado = 'pending';

CREATE INDEX IF NOT EXISTS idx_sii_caf_requests_empresa
  ON public.sii_caf_requests (empresa_id, requested_at DESC);
