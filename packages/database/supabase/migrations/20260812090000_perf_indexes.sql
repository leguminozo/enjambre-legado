-- =============================================================================
-- Índices de rendimiento: ventas es la tabla transaccional más caliente.
-- RLS filtra por vendedor_id/user_id por fila; dashboards agregan por
-- created_at (produccion.ts); cart.ts cuenta ventas por user_id.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ventas_vendedor_id
  ON public.ventas (vendedor_id)
  WHERE vendedor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_user_id
  ON public.ventas (user_id)
  WHERE user_id IS NOT NULL;

-- Dashboards de producción/ventas: últimos 30 días y series temporales
CREATE INDEX IF NOT EXISTS idx_ventas_created_at
  ON public.ventas (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_origen
  ON public.ventas (origen)
  WHERE origen IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_estado
  ON public.ventas (estado)
  WHERE estado IS NOT NULL;
