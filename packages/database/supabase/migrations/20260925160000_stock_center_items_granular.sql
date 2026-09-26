-- 20260925160000_stock_center_items_granular.sql
-- Sub-inventario granular por centro de stock / punto de acopio o distribución.
-- Permite que Pureo (matriz) derive stock de forma trazable hacia centros de stock
-- y que cada centro construya y gestione su propio inventario sin afectar Pureo.

CREATE TABLE IF NOT EXISTS public.stock_center_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_center_id     UUID NOT NULL REFERENCES public.stock_centers(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id          UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  -- Vínculo opcional a catálogo de venta o a inventario operativo general (Pureo)
  inventario_item_id  UUID REFERENCES public.inventario_items(id) ON DELETE SET NULL,
  producto_id         UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  nombre              TEXT NOT NULL,
  sku_code            TEXT,
  clase               TEXT NOT NULL DEFAULT 'producto'
                        CHECK (clase IN ('producto', 'insumo', 'etiqueta', 'envase', 'apicola', 'destilacion')),
  unidad              TEXT NOT NULL DEFAULT 'unidad'
                        CHECK (unidad IN ('unidad', 'kg', 'g', 'l', 'ml', 'rollo', 'plancha', 'caja')),
  cantidad            NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  stock_minimo        NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  origen              TEXT NOT NULL DEFAULT 'pureo'
                        CHECK (origen IN ('pureo', 'local')),
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_center_items_center
  ON public.stock_center_items (stock_center_id);

CREATE INDEX IF NOT EXISTS idx_stock_center_items_inventario
  ON public.stock_center_items (inventario_item_id)
  WHERE inventario_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_center_items_producto
  ON public.stock_center_items (producto_id)
  WHERE producto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_center_items_empresa
  ON public.stock_center_items (empresa_id)
  WHERE empresa_id IS NOT NULL;

COMMENT ON TABLE public.stock_center_items IS
  'Ítems de stock asignados a centros logísticos y puntos de distribución. Admite derivación desde Pureo e inventario propio local.';

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.stock_center_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_center_items_select ON public.stock_center_items;
CREATE POLICY stock_center_items_select ON public.stock_center_items
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  );

DROP POLICY IF EXISTS stock_center_items_write ON public.stock_center_items;
CREATE POLICY stock_center_items_write ON public.stock_center_items
  FOR ALL USING (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  ) WITH CHECK (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  );
