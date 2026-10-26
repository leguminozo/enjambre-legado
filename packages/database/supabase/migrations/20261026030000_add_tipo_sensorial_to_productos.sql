-- =============================================================================
-- Migration: 20261026030000_add_tipo_sensorial_to_productos.sql
--
-- Agrega formalmente la columna `tipo_sensorial` a la tabla `public.productos`.
-- Sincroniza con el enum canónico utilizado por `resenas_producto` y `perc_sesiones`
-- (miel, miel_fortificada, hidromiel, extracto, cosmetica, infusion).
-- Permite que la edición de fichas en Núcleo (ProductForm), el renderizado
-- en PDP de Tienda y el POS de Campo lean y persistan la familia sensorial canónica.
-- =============================================================================

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS tipo_sensorial TEXT NOT NULL DEFAULT 'miel'
  CHECK (tipo_sensorial IN ('miel', 'miel_fortificada', 'hidromiel', 'extracto', 'cosmetica', 'infusion'));

CREATE INDEX IF NOT EXISTS idx_productos_tipo_sensorial
  ON public.productos (tipo_sensorial);

-- Clasificación retroactiva coherente según categoría del producto
UPDATE public.productos
SET tipo_sensorial = 'infusion'
WHERE categoria ILIKE '%infusion%';

UPDATE public.productos
SET tipo_sensorial = 'cosmetica'
WHERE categoria ILIKE '%cosmetica%' OR categoria ILIKE '%cera%';

UPDATE public.productos
SET tipo_sensorial = 'extracto'
WHERE categoria ILIKE '%propoleo%' OR categoria ILIKE '%extracto%';

UPDATE public.productos
SET tipo_sensorial = 'hidromiel'
WHERE categoria ILIKE '%hidromiel%';

UPDATE public.productos
SET tipo_sensorial = 'miel_fortificada'
WHERE categoria ILIKE '%fortific%';

COMMENT ON COLUMN public.productos.tipo_sensorial IS
  'Familia sensorial canónica del producto para cata, Escuela de Venta POS y tienda: miel, miel_fortificada, hidromiel, extracto, cosmetica, infusion.';
