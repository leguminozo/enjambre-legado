-- Idempotency for SumUp Solo/terminal reader checkouts (POS campo).
-- Same (empresa_id, checkout_reference) must not open a second terminal charge.

CREATE TABLE IF NOT EXISTS public.sumup_terminal_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  checkout_reference TEXT NOT NULL,
  checkout_id TEXT,
  reader_id TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CLP',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, checkout_reference)
);

CREATE INDEX IF NOT EXISTS sumup_terminal_checkouts_empresa_created_idx
  ON public.sumup_terminal_checkouts (empresa_id, created_at DESC);

ALTER TABLE public.sumup_terminal_checkouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sumup_terminal_checkouts_empresa_access" ON public.sumup_terminal_checkouts;
CREATE POLICY "sumup_terminal_checkouts_empresa_access"
  ON public.sumup_terminal_checkouts
  FOR ALL
  USING (has_empresa_access(empresa_id))
  WITH CHECK (has_empresa_access(empresa_id));

COMMENT ON TABLE public.sumup_terminal_checkouts IS
  'POS SumUp terminal checkout idempotency by client checkout_reference';
