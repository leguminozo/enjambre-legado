-- ============================================================
-- Migration 20260921173000: Pre-Órdenes de Floración Futura
-- Permite reservar cupos de recolecciones nativas futuras
-- con prioridad de asignación para miembros de Club Legado.
-- ============================================================

ALTER TABLE public.pre_orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.pre_orders
  ADD COLUMN IF NOT EXISTS floracion_slug TEXT,
  ADD COLUMN IF NOT EXISTS temporada TEXT,
  ADD COLUMN IF NOT EXISTS prioridad_club BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notas TEXT;

-- Política para permitir reservas anónimas con email o de usuarios autenticados
DROP POLICY IF EXISTS "Anon can create pre_orders with email" ON public.pre_orders;
CREATE POLICY "Anon can create pre_orders with email"
  ON public.pre_orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND email IS NOT NULL AND user_id IS NULL)
  );
