-- Banco Chile Conciliaciones Table
-- Migración 22 - Mayo 2026

-- Tabla para conciliaciones bancarias
CREATE TABLE IF NOT EXISTS public.banco_chile_conciliaciones (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
movimiento_id UUID NOT NULL REFERENCES public.banco_chile_movimientos(id) ON DELETE CASCADE,
venta_id UUID,
gasto_id UUID REFERENCES public.gastos(id),
monto NUMERIC(18, 2) NOT NULL,
concepto TEXT,
fecha_conciliacion TIMESTAMPTZ NOT NULL DEFAULT now(),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para rendimiento
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_movimiento ON public.banco_chile_conciliaciones(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_venta ON public.banco_chile_conciliaciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_banco_chile_conciliaciones_gasto ON public.banco_chile_conciliaciones(gasto_id);

-- RLS
ALTER TABLE public.banco_chile_conciliaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios con acceso a empresa pueden ver conciliaciones" ON public.banco_chile_conciliaciones;
CREATE POLICY "Usuarios con acceso a empresa pueden ver conciliaciones"
  ON public.banco_chile_conciliaciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.banco_chile_movimientos m
      WHERE m.id = banco_chile_conciliaciones.movimiento_id
      AND public.has_empresa_access(m.empresa_id)
    )
  );

DROP POLICY IF EXISTS "Usuarios con acceso a empresa pueden insertar conciliaciones" ON public.banco_chile_conciliaciones;
CREATE POLICY "Usuarios con acceso a empresa pueden insertar conciliaciones"
  ON public.banco_chile_conciliaciones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.banco_chile_movimientos m
      WHERE m.id = banco_chile_conciliaciones.movimiento_id
      AND public.has_empresa_access(m.empresa_id)
    )
  );
