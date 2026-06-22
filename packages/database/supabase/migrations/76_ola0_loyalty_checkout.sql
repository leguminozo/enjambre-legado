-- Ola 0: loyalty real en checkout (canje server-side + sesión auditable)

ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS subtotal INTEGER NOT NULL DEFAULT 0
    CHECK (subtotal >= 0),
  ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0
    CHECK (loyalty_points_redeemed >= 0),
  ADD COLUMN IF NOT EXISTS loyalty_discount_clp INTEGER NOT NULL DEFAULT 0
    CHECK (loyalty_discount_clp >= 0);

COMMENT ON COLUMN checkout_sessions.subtotal IS
  'Subtotal verificado del carrito antes de descuento por puntos.';
COMMENT ON COLUMN checkout_sessions.loyalty_points_redeemed IS
  'Puntos canjeados en init (múltiplos de 100).';
COMMENT ON COLUMN checkout_sessions.loyalty_discount_clp IS
  'Descuento CLP aplicado (100 pts = $1.000).';

-- Canje idempotente post-pago (service_role only)
CREATE OR REPLACE FUNCTION public.canjear_puntos_checkout(
  p_user_id UUID,
  p_empresa_id UUID,
  p_puntos INT,
  p_buy_order TEXT,
  p_venta_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo INT;
  v_saldo_nuevo INT;
BEGIN
  IF p_puntos IS NULL OR p_puntos <= 0 THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  IF p_puntos % 100 != 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_step');
  END IF;

  IF EXISTS (
    SELECT 1 FROM puntos_transacciones
    WHERE venta_id = p_venta_id
      AND tipo = 'canjeado'
      AND metadata->>'buy_order' = p_buy_order
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  SELECT puntos INTO v_saldo
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id
  FOR UPDATE;

  IF v_saldo IS NULL OR v_saldo < p_puntos THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_points');
  END IF;

  v_saldo_nuevo := v_saldo - p_puntos;

  UPDATE puntos_fidelizacion
  SET puntos = v_saldo_nuevo, updated_at = now()
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;

  INSERT INTO puntos_transacciones (
    user_id, empresa_id, venta_id, tipo, puntos,
    saldo_anterior, saldo_nuevo, motivo, metadata
  ) VALUES (
    p_user_id, p_empresa_id, p_venta_id, 'canjeado', -p_puntos,
    v_saldo, v_saldo_nuevo,
    'Canje checkout web',
    jsonb_build_object('buy_order', p_buy_order, 'channel', 'web')
  );

  RETURN jsonb_build_object('success', true, 'points_redeemed', p_puntos);
END;
$$;

REVOKE ALL ON FUNCTION public.canjear_puntos_checkout(UUID, UUID, INT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.canjear_puntos_checkout(UUID, UUID, INT, TEXT, TEXT) TO service_role;