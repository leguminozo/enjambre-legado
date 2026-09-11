-- =============================================================================
-- Migration 20260908160000: Unique Index Idempotency on ventas.buy_order
--
-- Garantiza a nivel de base de datos que ninguna orden (web o POS offline-sync)
-- pueda ser insertada dos veces con el mismo buy_order.
-- Venta web: buy_order = ORD-... / UUID
-- Venta POS: buy_order = POS-{client_request_id}
-- =============================================================================

-- 1. Deduplicación previa defensiva en entornos de desarrollo/staging
DO $$
BEGIN
  IF EXISTS (
    SELECT buy_order
    FROM public.ventas
    WHERE buy_order IS NOT NULL
    GROUP BY buy_order
    HAVING COUNT(*) > 1
  ) THEN
    DELETE FROM public.ventas v1
    WHERE v1.buy_order IS NOT NULL
      AND v1.id NOT IN (
        SELECT DISTINCT ON (v2.buy_order) v2.id
        FROM public.ventas v2
        WHERE v2.buy_order IS NOT NULL
        ORDER BY v2.buy_order, v2.created_at DESC
      );
  END IF;
END $$;

-- 2. Índice único parcial (permite NULL para ventas legacy o manuales sin orden)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_buy_order_unique
ON public.ventas (buy_order)
WHERE buy_order IS NOT NULL;
