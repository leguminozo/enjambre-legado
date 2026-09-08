-- ============================================================
-- Migración: Otorgar lectura pública (anon) a taxonomías de producto
-- Permite que la Tienda D2C consulte los labels comerciales de
-- product_formats y product_categories sin requerir sesión autenticada.
-- ============================================================

GRANT SELECT ON public.product_formats TO anon;
GRANT SELECT ON public.product_categories TO anon;
