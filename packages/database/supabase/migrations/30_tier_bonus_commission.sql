-- Migration 30: Tier bonus multiplier in commission calculation
-- Adds tier_bonus rule_type and integrates into calcular_comision_venta()
-- Tier multipliers: base=1.0×, senior=1.1×, elite=1.2×, legend=1.3×

-- ─── 1. SEMILLAR commission_rules tipo 'tier_bonus' ────────────────

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'tier_bonus',
  'Bonus por tier',
  jsonb_build_object(
    'tiers', jsonb_build_object(
      'base', 1.0,
      'senior', 1.1,
      'elite', 1.2,
      'legend', 1.3
    )
  ),
  true,
  -1
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr
  WHERE cr.empresa_id = e.id AND cr.rule_type = 'tier_bonus'
);

-- ─── 2. ADD tier_bonus column to commission_records ────────────────

ALTER TABLE public.commission_records
  ADD COLUMN IF NOT EXISTS tier_multiplier NUMERIC(8,4) NOT NULL DEFAULT 1.0;

-- ─── 3. REPLACE calcular_comision_venta with tier bonus ────────────

CREATE OR REPLACE FUNCTION public.calcular_comision_venta(
  p_venta_id UUID,
  p_empresa_id UUID
)
RETURNS TABLE(base_commission NUMERIC, volume_multiplier NUMERIC, loyalty_bonus NUMERIC, streak_bonus NUMERIC, tier_multiplier NUMERIC, total_commission NUMERIC) AS $$
DECLARE
  v_total NUMERIC;
  v_rep_id UUID;
  v_channel TEXT;
  v_is_new_client BOOLEAN;
  v_cliente_id UUID;
  v_session_id UUID;
  v_base_rate NUMERIC;
  v_base_commission NUMERIC;
  v_multiplier NUMERIC := 1.0;
  v_loyalty_bonus NUMERIC := 0;
  v_streak_bonus NUMERIC := 0;
  v_tier_multiplier NUMERIC := 1.0;
  v_total_commission NUMERIC;
  v_daily_total NUMERIC := 0;
  v_streak_days INT;
  v_is_repeat_client BOOLEAN;
  v_rule RECORD;
  v_tier TEXT;
  v_tier_rules JSONB;
BEGIN
  SELECT total, vendedor_id, channel, is_new_client, cliente_id, cash_session_id
  INTO v_total, v_rep_id, v_channel, v_is_new_client, v_cliente_id, v_session_id
  FROM ventas WHERE id = p_venta_id;

  IF NOT FOUND OR v_rep_id IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 1.0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1.0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  SELECT COALESCE((parameter->>'rate')::NUMERIC, 0.10)
  INTO v_base_rate
  FROM commission_rules
  WHERE empresa_id = p_empresa_id AND rule_type = 'base' AND active = true
  ORDER BY priority DESC LIMIT 1;

  IF v_base_rate IS NULL OR v_base_rate = 0 THEN
    v_base_rate := 0.10;
  END IF;

  v_base_commission := v_total * v_base_rate;

  SELECT COALESCE(SUM(v2.total), 0)
  INTO v_daily_total
  FROM ventas v2
  WHERE v2.vendedor_id = v_rep_id
  AND v2.cash_session_id = v_session_id
  AND v2.id != p_venta_id;

  v_daily_total := v_daily_total + v_total;

  FOR v_rule IN
    SELECT parameter
    FROM commission_rules
    WHERE empresa_id = p_empresa_id
    AND rule_type = 'volume_threshold'
    AND active = true
    ORDER BY (parameter->>'threshold')::NUMERIC ASC
  LOOP
    IF v_daily_total >= (v_rule.parameter->>'threshold')::NUMERIC THEN
      v_multiplier := GREATEST(v_multiplier, (v_rule.parameter->>'multiplier')::NUMERIC);
    END IF;
  END LOOP;

  IF v_cliente_id IS NOT NULL AND v_is_new_client = false THEN
    v_is_repeat_client := true;

    SELECT COALESCE((parameter->>'bonus_rate')::NUMERIC, 0.03)
    INTO v_loyalty_bonus
    FROM commission_rules
    WHERE empresa_id = p_empresa_id AND rule_type = 'loyalty' AND active = true
    ORDER BY priority DESC LIMIT 1;

    IF v_loyalty_bonus IS NULL THEN
      v_loyalty_bonus := v_total * 0.03;
    ELSE
      v_loyalty_bonus := v_total * v_loyalty_bonus;
    END IF;
  END IF;

  SELECT current_streak_days INTO v_streak_days
  FROM rep_profiles WHERE user_id = v_rep_id;

  IF v_streak_days >= 7 THEN
    FOR v_rule IN
      SELECT parameter
      FROM commission_rules
      WHERE empresa_id = p_empresa_id
      AND rule_type = 'streak'
      AND active = true
      ORDER BY (parameter->>'min_days')::NUMERIC DESC
    LOOP
      IF v_streak_days >= (v_rule.parameter->>'min_days')::INT THEN
        v_streak_bonus := GREATEST(v_streak_bonus, (v_rule.parameter->>'bonus')::NUMERIC);
      END IF;
    END LOOP;

    IF v_streak_bonus = 0 AND v_streak_days >= 7 THEN
      v_streak_bonus := v_base_commission * 0.1;
    END IF;
  END IF;

  SELECT commission_tier INTO v_tier
  FROM rep_profiles WHERE user_id = v_rep_id;

  SELECT parameter->'tiers' INTO v_tier_rules
  FROM commission_rules
  WHERE empresa_id = p_empresa_id AND rule_type = 'tier_bonus' AND active = true
  ORDER BY priority DESC LIMIT 1;

  IF v_tier_rules IS NOT NULL AND v_tier IS NOT NULL THEN
    v_tier_multiplier := COALESCE((v_tier_rules->>v_tier)::NUMERIC, 1.0);
  END IF;

  v_total_commission := ((v_base_commission * v_multiplier) + v_loyalty_bonus + v_streak_bonus) * v_tier_multiplier;

  UPDATE ventas SET
    rep_commission_base = v_base_commission,
    rep_commission_multiplier = v_multiplier,
    rep_commission_loyalty = v_loyalty_bonus,
    rep_commission_total = v_total_commission
  WHERE id = p_venta_id;

  INSERT INTO commission_records (
    empresa_id, session_id, venta_id, rep_id,
    base_commission, volume_multiplier, loyalty_bonus, streak_bonus, tier_multiplier, total_commission
  ) VALUES (
    p_empresa_id, v_session_id, p_venta_id, v_rep_id,
    v_base_commission, v_multiplier, v_loyalty_bonus, v_streak_bonus, v_tier_multiplier, v_total_commission
  );

  UPDATE rep_profiles SET
    total_commissions_earned = total_commissions_earned + v_total_commission,
    total_sales_lifetime = total_sales_lifetime + 1,
    total_revenue_lifetime = total_revenue_lifetime + v_total,
    updated_at = now()
  WHERE user_id = v_rep_id;

  RETURN QUERY SELECT
    v_base_commission, v_multiplier, v_loyalty_bonus, v_streak_bonus, v_tier_multiplier, v_total_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. COMENTARIOS ────────────────────────────────────────────────

COMMENT ON COLUMN public.commission_records.tier_multiplier IS 'Multiplicador aplicado por tier del rep (base=1.0, senior=1.1, elite=1.2, legend=1.3). Configurable en commission_rules rule_type=tier_bonus.';
