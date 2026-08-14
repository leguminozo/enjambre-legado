-- =============================================================================
-- 20260814000000 — Fix CHECK b2b_sets_entrada.tipo_entorno
--
-- Problema (auditoría landings B2B / docs):
--   El CHECK inline creado en 20260810200000 admite 'revolvedor' (typo) y NO
--   admite 'otro', mientras el BFF (b2b-publico.ts:45) filtra los sets con
--   `punto.tipo ?? 'otro'` y el panel admin (SetsPanel) ofrece 'otro' como
--   opción. Consecuencia: los puntos tipo 'otro' ven 0 sets y los sets con
--   tipo_entorno='revolvedor' jamás matchean ningún punto.
--
-- Solución (alinea BD con el filtro del BFF y con PUNTO_VENTA_TIPO_OPTIONS):
--   1. Dropear la constraint — el backfill a 'otro' NO pasaría el CHECK viejo.
--   2. Backfill: 'revolvedor' → 'otro' (catch-all; no existe flujo de sets
--      específico para revendedores — su portal lista todos los sets sin
--      filtro de entorno).
--   3. Re-crear la constraint incluyendo 'otro'.
-- =============================================================================

-- ── 1. Drop de la constraint (nombre real vía pg_constraint) ─────────────────
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.b2b_sets_entrada'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%tipo_entorno%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.b2b_sets_entrada DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END;
$$;

-- ── 2. Backfill del typo (después del drop: 'otro' no pasa el CHECK viejo) ───
UPDATE public.b2b_sets_entrada
SET tipo_entorno = 'otro'
WHERE tipo_entorno = 'revolvedor';

-- ── 3. Re-crear incluyendo 'otro' ────────────────────────────────────────────
ALTER TABLE public.b2b_sets_entrada
  ADD CONSTRAINT b2b_sets_entrada_tipo_entorno_check
  CHECK (tipo_entorno IN ('cafeteria', 'tienda_gourmet', 'hotel', 'feria_evento', 'otro'));
