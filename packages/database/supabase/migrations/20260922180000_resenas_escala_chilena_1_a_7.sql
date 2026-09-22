-- =============================================================================
-- 20260922180000 — Escala chilena de valoración (1 a 7) para reseñas de producto
--
-- Actualiza la restricción de rating en public.resenas_producto para admitir
-- la escala cultural nacional de 1 a 7 estrellas (donde 4 es corte y 7 es excelencia).
-- Mantiene total retrocompatibilidad con las reseñas históricas (1 a 5).
-- =============================================================================

ALTER TABLE public.resenas_producto
  DROP CONSTRAINT IF EXISTS resenas_producto_rating_check;

ALTER TABLE public.resenas_producto
  ADD CONSTRAINT resenas_producto_rating_check
  CHECK (rating BETWEEN 1 AND 7);

COMMENT ON COLUMN public.resenas_producto.rating IS
  'Calificación en escala chilena de 1 a 7 estrellas (1 = deficiente, 4 = aprobación, 7 = excelencia territorial).';
