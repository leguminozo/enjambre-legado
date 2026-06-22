-- Ola 3: envío/descuentos en sesión, stock hold 30 min, motor ritual

ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES descuentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_clp INTEGER NOT NULL DEFAULT 0
    CHECK (discount_clp >= 0),
  ADD COLUMN IF NOT EXISTS stock_reserved BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN checkout_sessions.discount_code IS 'Código promocional aplicado en init.';
COMMENT ON COLUMN checkout_sessions.discount_clp IS 'Descuento CLP verificado antes de loyalty.';

CREATE TABLE IF NOT EXISTS public.checkout_stock_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order TEXT NOT NULL REFERENCES checkout_sessions(buy_order) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_holds_buy_order ON public.checkout_stock_holds (buy_order);
CREATE INDEX IF NOT EXISTS idx_stock_holds_expires ON public.checkout_stock_holds (expires_at);

CREATE OR REPLACE FUNCTION public.release_expired_stock_holds()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM checkout_stock_holds
    WHERE expires_at < now()
    RETURNING id
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

CREATE OR REPLACE FUNCTION public.reserve_checkout_stock(
  p_buy_order TEXT,
  p_cart JSONB,
  p_ttl_minutes INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line JSONB;
  v_product_id UUID;
  v_qty INT;
  v_stock INT;
  v_held INT;
  v_expires TIMESTAMPTZ := now() + make_interval(mins => p_ttl_minutes);
BEGIN
  DELETE FROM checkout_stock_holds WHERE buy_order = p_buy_order;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_cart)
  LOOP
    v_product_id := (v_line->>'productId')::uuid;
    v_qty := GREATEST(COALESCE((v_line->>'quantity')::int, 1), 1);

    SELECT stock INTO v_stock FROM productos WHERE id = v_product_id;
    IF v_stock IS NULL THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(SUM(quantity), 0) INTO v_held
    FROM checkout_stock_holds
    WHERE producto_id = v_product_id
      AND expires_at > now()
      AND buy_order <> p_buy_order;

    IF v_stock < v_qty + v_held THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'insufficient_stock',
        'producto_id', v_product_id
      );
    END IF;

    INSERT INTO checkout_stock_holds (buy_order, producto_id, quantity, expires_at)
    VALUES (p_buy_order, v_product_id, v_qty, v_expires);
  END LOOP;

  UPDATE checkout_sessions SET stock_reserved = true WHERE buy_order = p_buy_order;

  RETURN jsonb_build_object('success', true, 'expires_at', v_expires);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_checkout_stock(p_buy_order TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM checkout_stock_holds WHERE buy_order = p_buy_order;
  UPDATE checkout_sessions SET stock_reserved = false WHERE buy_order = p_buy_order;
$$;

REVOKE ALL ON FUNCTION public.release_expired_stock_holds() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_stock_holds() TO service_role;
REVOKE ALL ON FUNCTION public.reserve_checkout_stock(TEXT, JSONB, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_checkout_stock(TEXT, JSONB, INT) TO service_role;
REVOKE ALL ON FUNCTION public.release_checkout_stock(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_checkout_stock(TEXT) TO service_role;

-- Motor ritual: agenda entregas del período y marca past_due vencidas
CREATE OR REPLACE FUNCTION public.process_ritual_renewals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_count INT := 0;
  v_period INT;
BEGIN
  PERFORM release_expired_stock_holds();

  FOR v_sub IN
    SELECT s.*, p.frequency, p.included_items
    FROM subscriptions s
    JOIN subscription_plans p ON p.id = s.plan_id
    WHERE s.status IN ('active', 'trialing')
      AND s.current_period_end <= now() + interval '3 days'
  LOOP
    SELECT COALESCE(MAX(period_number), 0) + 1 INTO v_period
    FROM subscription_deliveries
    WHERE subscription_id = v_sub.id;

    IF NOT EXISTS (
      SELECT 1 FROM subscription_deliveries
      WHERE subscription_id = v_sub.id
        AND period_number = v_period
    ) THEN
      INSERT INTO subscription_deliveries (
        subscription_id,
        period_number,
        scheduled_for,
        items,
        status
      ) VALUES (
        v_sub.id,
        v_period,
        v_sub.current_period_end,
        COALESCE(v_sub.included_items, '[]'::jsonb),
        'scheduled'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  UPDATE subscriptions
  SET status = 'past_due', updated_at = now()
  WHERE status = 'active'
    AND current_period_end < now() - interval '7 days';

  RETURN jsonb_build_object('deliveries_scheduled', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.process_ritual_renewals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_ritual_renewals() TO service_role;