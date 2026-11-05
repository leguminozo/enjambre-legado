-- =============================================================================
-- 20261105140000 — Escala sensorial unificada de 1 a 10 para catas y reseñas
--
-- Alinea la calificación global de `public.resenas_producto` y `public.perc_sesiones`
-- con la escala canónica 1 a 10 de la Red Sensorial de 8 vértices.
-- Mantiene total retrocompatibilidad con los registros históricos existentes.
-- =============================================================================

ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_rating_check;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_rating_check
  CHECK (rating BETWEEN 1 AND 10);

COMMENT ON COLUMN public.resenas_producto.rating IS
  'Calificación global en escala sensorial de 1 a 10 (1 = basal, 10 = excelencia territorial).';

ALTER TABLE public.perc_sesiones
  DROP CONSTRAINT IF EXISTS perc_sesiones_agrado_1_5_check;

ALTER TABLE public.perc_sesiones
  ADD CONSTRAINT perc_sesiones_agrado_1_5_check
  CHECK (agrado_1_5 IS NULL OR agrado_1_5 BETWEEN 1 AND 10);

COMMENT ON COLUMN public.perc_sesiones.agrado_1_5 IS
  'Agrado general de la sesión de cata en escala 1 a 10.';
