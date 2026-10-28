-- =============================================================================
-- Migration: 20261028040000_producto_variantes_entrelazado_bidireccional.sql
--
-- Entrelazado bidireccional de variantes con productos existentes en el catálogo.
-- Permite que un producto existente (ej. Miel de Ulmo 500g) sea vinculado como
-- variante de otro (ej. Miel de Ulmo 250g) y que ambos queden entrelazados
-- mutuamente en el catálogo, ficha de tienda y cata.
-- =============================================================================

-- 1. Agregar columna de producto vinculado a producto_variantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producto_variantes' AND column_name = 'producto_vinculado_id'
  ) THEN
    ALTER TABLE public.producto_variantes
      ADD COLUMN producto_vinculado_id UUID CONSTRAINT producto_variantes_producto_vinculado_id_fkey
      REFERENCES public.productos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Índice para acelerar recorridos de relaciones y búsquedas inversas
CREATE INDEX IF NOT EXISTS idx_producto_variantes_vinculado
  ON public.producto_variantes (producto_vinculado_id);

-- 3. Evitar que se vincule el mismo producto dos veces a un mismo padre
CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_variantes_vinculo
  ON public.producto_variantes (producto_id, producto_vinculado_id)
  WHERE producto_vinculado_id IS NOT NULL;

-- 4. Reemplazar restricción única global de SKU por restricción por producto
--    (Permite que variantes de productos distintos compartan nomenclaturas como 250G)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'producto_variantes_sku_key'
  ) THEN
    ALTER TABLE public.producto_variantes DROP CONSTRAINT producto_variantes_sku_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_producto_variantes_producto_sku'
  ) THEN
    ALTER TABLE public.producto_variantes
      ADD CONSTRAINT uq_producto_variantes_producto_sku UNIQUE (producto_id, sku);
  END IF;
END $$;

COMMENT ON COLUMN public.producto_variantes.producto_vinculado_id IS
  'Producto del catálogo formalmente entrelazado como variante (opcional: null para variantes manuales sin ficha propia).';
