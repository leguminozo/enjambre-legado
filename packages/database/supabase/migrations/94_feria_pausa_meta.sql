-- 94: Feria pause/resume + meta editable para control admin
-- Permite al admin pausar ventas de una feria remotamente (kill-switch)
-- y configurar meta/propiedades editables por evento

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS pausada_hasta TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.eventos.pausada_hasta IS
  'Si no es NULL y es futuro, la feria está pausada: ventas con channel=feria y evento_id=this se rechazan en BFF.';

COMMENT ON COLUMN public.eventos.meta IS
  'Propiedades editables por admin: {meta_venta: number, notas_admin: string, alertas: {stock_bajo: number}}';

CREATE INDEX IF NOT EXISTS idx_eventos_pausada_hasta ON public.eventos(pausada_hasta) WHERE pausada_hasta IS NOT NULL;

-- Helper RPC para verificar si una feria está pausada
CREATE OR REPLACE FUNCTION public.es_feria_pausada(p_evento_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pausada TIMESTAMPTZ;
BEGIN
  SELECT pausada_hasta INTO v_pausada
  FROM public.eventos
  WHERE id = p_evento_id;

  IF v_pausada IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_pausada > now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.es_feria_pausada TO authenticated;