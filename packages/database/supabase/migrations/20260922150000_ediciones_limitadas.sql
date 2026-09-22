-- Ediciones limitadas: lanzamientos con ventana, cupo y precio early bird.
-- pre_orders.edicion_id vincula la reserva; el bono de lealtad usa el nuevo
-- tipo 'reserva_anticipada' en el ledger canónico.

CREATE TABLE IF NOT EXISTS public.ediciones_limitadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  abre_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cierra_at TIMESTAMPTZ NOT NULL,
  cupo_max INT NOT NULL CHECK (cupo_max > 0),
  precio_early_bird INT NOT NULL CHECK (precio_early_bird > 0),
  activa BOOLEAN NOT NULL DEFAULT true,
  creado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ediciones_ventana CHECK (cierra_at > abre_at)
);

CREATE INDEX IF NOT EXISTS idx_ediciones_producto
  ON public.ediciones_limitadas (producto_id, activa);

ALTER TABLE public.pre_orders
  ADD COLUMN IF NOT EXISTS edicion_id UUID REFERENCES public.ediciones_limitadas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pre_orders_edicion
  ON public.pre_orders (edicion_id, status);

ALTER TABLE public.ediciones_limitadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ediciones_public_read" ON public.ediciones_limitadas;
CREATE POLICY "ediciones_public_read" ON public.ediciones_limitadas
  FOR SELECT TO anon, authenticated USING (activa = true);

DROP POLICY IF EXISTS "ediciones_admin_all" ON public.ediciones_limitadas;
CREATE POLICY "ediciones_admin_all" ON public.ediciones_limitadas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Cupo ocupado (reservadas + confirmadas) para countdown y validación.
CREATE OR REPLACE FUNCTION public.edicion_cupo_usado(p_edicion_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::INT FROM public.pre_orders
  WHERE edicion_id = p_edicion_id AND status IN ('reserved', 'confirmed');
$$;

GRANT EXECUTE ON FUNCTION public.edicion_cupo_usado(UUID) TO anon, authenticated;

-- Bono de lealtad por reserva anticipada en el ledger canónico.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loyalty_events_ledger_tipo_evento_check'
  ) THEN
    ALTER TABLE public.loyalty_events_ledger DROP CONSTRAINT loyalty_events_ledger_tipo_evento_check;
  END IF;
END
$$;

ALTER TABLE public.loyalty_events_ledger
  ADD CONSTRAINT loyalty_events_ledger_tipo_evento_check CHECK (
    tipo_evento IN (
      'compra_completada', 'ticket_reclamado', 'resena_aprobada',
      'frasco_retornado', 'bienvenida_registro', 'bienvenida_reposicion',
      'canje_checkout', 'ajuste_manual', 'reserva_anticipada'
    )
  );
