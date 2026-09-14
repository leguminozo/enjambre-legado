-- 1019_proveedores_abastecimiento_centralizado.sql
-- Enriquecimiento de proveedores: puente con terceros, inventario_items,
-- fecha estructurada de entrega, datos de contacto y multi-tenant empresa_id.

ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tercero_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rut TEXT,
  ADD COLUMN IF NOT EXISTS contacto TEXT,
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS next_delivery_date DATE,
  ADD COLUMN IF NOT EXISTS lead_time_dias INTEGER,
  ADD COLUMN IF NOT EXISTS notas TEXT,
  ADD COLUMN IF NOT EXISTS insumos_ids UUID[],
  ADD COLUMN IF NOT EXISTS estado_entrega TEXT DEFAULT 'pendiente'
    CHECK (estado_entrega IN ('pendiente', 'en_camino', 'recibido', 'sin_programar')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Índices de búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa
  ON public.proveedores (empresa_id);

CREATE INDEX IF NOT EXISTS idx_proveedores_tercero
  ON public.proveedores (tercero_id);

CREATE INDEX IF NOT EXISTS idx_proveedores_next_delivery_date
  ON public.proveedores (next_delivery_date);

-- Política RLS: permitir acceso a usuarios de la empresa y dueños directos
DROP POLICY IF EXISTS proveedores_empresa_access ON public.proveedores;
CREATE POLICY proveedores_empresa_access ON public.proveedores
  FOR ALL USING (
    (empresa_id IS NOT NULL AND has_empresa_access(empresa_id))
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
  )
  WITH CHECK (
    (empresa_id IS NOT NULL AND has_empresa_access(empresa_id))
    OR user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
  );

COMMENT ON TABLE public.proveedores IS
  'Red de abastecimiento de insumos, empaques y materias primas. Conectado a terceros (maestro legal) e inventario_items.';
