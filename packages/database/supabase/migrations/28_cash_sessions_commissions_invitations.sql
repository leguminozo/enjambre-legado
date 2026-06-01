-- ═══════════════════════════════════════════════════════════════════════
-- Módulo Cierres de Caja · Comisiones Vanguardistas · Códigos de Invitación
-- ═══════════════════════════════════════════════════════════════════════
-- Propósito:
--   1. Sesiones de caja diarias con trazabilidad completa
--   2. Sistema de comisiones con multiplicadores conductuales
--   3. Códigos de invitación para registro bajo roles asignados
--   4. Extiende ventas para linkear a sesión de caja
--   5. Perfil de trazabilidad del vendedor en la app

-- ─── 1. EXTENDER PROFILES: nuevo rol 'rep_ventas' ─────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('apicultor','vendedor','gerente','logistica','marketing','cliente','tienda_admin','creador','rep_ventas'));

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('comprador','suscriptor','revendedor','embajador','creador','rep_ventas'));

-- ─── 2. TABLA: cash_sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cash_sessions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
closed_at TIMESTAMPTZ,
opening_cash NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (opening_cash >= 0),
closing_cash_counted NUMERIC(19,4) CHECK (closing_cash_counted >= 0),
session_status TEXT NOT NULL DEFAULT 'open' CHECK (session_status IN ('open','closed','reconciled')),
reconciled_by UUID REFERENCES auth.users(id),
reconciled_at TIMESTAMPTZ,
notas TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_sessions ADD COLUMN IF NOT EXISTS closing_cash_expected NUMERIC(19,4);
ALTER TABLE public.cash_sessions ADD COLUMN IF NOT EXISTS cash_difference NUMERIC(19,4);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_empresa ON public.cash_sessions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_rep ON public.cash_sessions(rep_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(session_status) WHERE session_status != 'reconciled';
CREATE INDEX IF NOT EXISTS idx_cash_sessions_date ON public.cash_sessions(opened_at DESC);

-- ─── 3. EXTENDER ventas: linkear a sesión de caja ─────────────────────
ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('feria','delivery','local','corporativo','web','referido')),
  ADD COLUMN IF NOT EXISTS is_new_client BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS rep_commission_base NUMERIC(19,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rep_commission_multiplier NUMERIC(5,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS rep_commission_loyalty NUMERIC(19,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rep_commission_total NUMERIC(19,4) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ventas_cash_session ON public.ventas(cash_session_id) WHERE cash_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_channel ON public.ventas(channel) WHERE channel IS NOT NULL;

-- ─── 4. TABLA: commission_rules (configurable por admin) ──────────────
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('base','volume_threshold','loyalty','streak')),
  name TEXT NOT NULL,
  parameter JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_empresa ON public.commission_rules(empresa_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_type ON public.commission_rules(rule_type) WHERE active = true;

-- ─── 5. TABLA: commission_records (ledger inmutable) ──────────────────
CREATE TABLE IF NOT EXISTS public.commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
venta_id UUID,
rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
base_commission NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (base_commission >= 0),
  volume_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  loyalty_bonus NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (loyalty_bonus >= 0),
  streak_bonus NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (streak_bonus >= 0),
  total_commission NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (total_commission >= 0),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_records_empresa ON public.commission_records(empresa_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_rep ON public.commission_records(rep_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_session ON public.commission_records(session_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_paid ON public.commission_records(paid) WHERE paid = false;

-- ─── 6. TABLA: invitation_codes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  roles TEXT[] NOT NULL DEFAULT '{"rep_ventas"}',
  tools JSONB NOT NULL DEFAULT '{}',
  max_uses INT CHECK (max_uses IS NULL OR max_uses > 0),
  current_uses INT NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_empresa ON public.invitation_codes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON public.invitation_codes(active) WHERE active = true;

-- ─── 7. TABLA: invitation_redemptions (audit) ────────────────────────
CREATE TABLE IF NOT EXISTS public.invitation_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitation_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  roles_assigned TEXT[] NOT NULL,
  tools_assigned JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_invitation_redemptions_user ON public.invitation_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_redemptions_invitation ON public.invitation_redemptions(invitation_id);

-- ─── 8. TABLA: rep_profiles (extensión de auth.users para reps) ──────
CREATE TABLE IF NOT EXISTS public.rep_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  commission_tier TEXT NOT NULL DEFAULT 'base' CHECK (commission_tier IN ('base','senior','elite','legend')),
  fixed_monthly NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_commissions_earned NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_commissions_paid NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_sales_lifetime INT NOT NULL DEFAULT 0,
  total_revenue_lifetime NUMERIC(19,4) NOT NULL DEFAULT 0,
  clients_captured INT NOT NULL DEFAULT 0,
  current_streak_days INT NOT NULL DEFAULT 0,
  best_streak_days INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  onboarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_profiles_user ON public.rep_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_rep_profiles_empresa ON public.rep_profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rep_profiles_tier ON public.rep_profiles(commission_tier) WHERE active = true;

-- ─── 9. VISTAS ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW rep_session_summary_view AS
SELECT
  cs.id AS session_id,
  cs.rep_id,
  cs.empresa_id,
  cs.opened_at,
  cs.closed_at,
  cs.opening_cash,
  cs.closing_cash_counted,
  cs.closing_cash_expected,
  cs.cash_difference,
  cs.session_status,
  rp.display_name,
  rp.commission_tier,
  COUNT(v.id) AS total_transactions,
  COALESCE(SUM(v.total), 0) AS total_revenue,
  COALESCE(SUM(v.total) FILTER (WHERE v.metodo_pago = 'efectivo'), 0) AS cash_revenue,
  COALESCE(SUM(v.total) FILTER (WHERE v.metodo_pago != 'efectivo'), 0) AS digital_revenue,
  COALESCE(SUM(cr.total_commission), 0) AS session_commissions
FROM cash_sessions cs
LEFT JOIN rep_profiles rp ON rp.user_id = cs.rep_id
LEFT JOIN ventas v ON v.cash_session_id = cs.id
LEFT JOIN commission_records cr ON cr.session_id = cs.id
GROUP BY cs.id, rp.display_name, rp.commission_tier;

CREATE OR REPLACE VIEW rep_performance_view AS
SELECT
  rp.user_id,
  rp.display_name,
  rp.commission_tier,
  rp.empresa_id,
  rp.active,
  rp.total_sales_lifetime,
  rp.total_revenue_lifetime,
  rp.total_commissions_earned,
  rp.total_commissions_paid,
  rp.clients_captured,
  rp.current_streak_days,
  rp.best_streak_days,
  COALESCE(rp.total_commissions_earned - rp.total_commissions_paid, 0) AS balance_pendiente,
  p.full_name,
  p.email
FROM rep_profiles rp
LEFT JOIN profiles p ON p.id = rp.user_id;

-- ─── 10. FUNCIONES ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generar_codigo_invitacion(p_empresa_id UUID)
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  intentos INT := 0;
BEGIN
  LOOP
    intentos := intentos + 1;
    codigo := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT), 1, 8));

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM invitation_codes WHERE code = codigo
    );
    IF intentos > 50 THEN
      codigo := 'INV' || FLOOR(RANDOM() * 900000 + 100000)::TEXT;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM invitation_codes WHERE code = codigo
      );
    END IF;
  END LOOP;

  RETURN codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION canjear_codigo_invitacion(
  p_code TEXT,
  p_user_id UUID
)
RETURNS TABLE(
  exito BOOLEAN,
  roles_asignados TEXT[],
  herramientas JSONB,
  empresa_id_result UUID
) AS $$
DECLARE
  v_inv RECORD;
  v_empresa_id UUID;
  v_roles TEXT[];
  v_tools JSONB;
BEGIN
  SELECT * INTO v_inv
  FROM invitation_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM invitation_redemptions WHERE invitation_id = v_inv.id AND user_id = p_user_id) THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  v_empresa_id := v_inv.empresa_id;
  v_roles := v_inv.roles;
  v_tools := v_inv.tools;

  INSERT INTO invitation_redemptions (invitation_id, user_id, roles_assigned, tools_assigned)
  VALUES (v_inv.id, p_user_id, v_roles, v_tools);

  UPDATE invitation_codes
  SET current_uses = current_uses + 1
  WHERE id = v_inv.id;

  INSERT INTO usuarios_empresas (user_id, empresa_id, rol)
  VALUES (p_user_id, v_empresa_id, 'operador')
  ON CONFLICT (user_id, empresa_id) DO UPDATE SET rol = 'operador';

  FOR i IN 1..array_length(v_roles, 1) LOOP
    INSERT INTO user_roles (user_id, role, is_active)
    VALUES (p_user_id, v_roles[i], true)
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();
  END LOOP;

  IF 'rep_ventas' = ANY(v_roles) THEN
    INSERT INTO rep_profiles (user_id, empresa_id, display_name)
    SELECT p_user_id, v_empresa_id, COALESCE(p.full_name, p.email, 'Vendedor')
    FROM profiles p WHERE p.id = p_user_id
    ON CONFLICT (user_id) DO UPDATE SET active = true, deactivated_at = NULL;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, v_roles, v_tools, v_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calcular_comision_venta(
  p_venta_id UUID,
  p_empresa_id UUID
)
RETURNS TABLE(
  base NUMERIC,
  multiplicador NUMERIC,
  loyalty NUMERIC,
  streak NUMERIC,
  total NUMERIC
) AS $$
DECLARE
  v_total INT;
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
  v_total_commission NUMERIC;
  v_daily_total NUMERIC := 0;
  v_weekly_total NUMERIC := 0;
  v_streak_days INT;
  v_is_repeat_client BOOLEAN;
  v_rule RECORD;
BEGIN
  SELECT total, vendedor_id, channel, is_new_client, cliente_id, cash_session_id
  INTO v_total, v_rep_id, v_channel, v_is_new_client, v_cliente_id, v_session_id
  FROM ventas WHERE id = p_venta_id;

  IF NOT FOUND OR v_rep_id IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 1.0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
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

  v_total_commission := (v_base_commission * v_multiplier) + v_loyalty_bonus + v_streak_bonus;

  UPDATE ventas SET
    rep_commission_base = v_base_commission,
    rep_commission_multiplier = v_multiplier,
    rep_commission_loyalty = v_loyalty_bonus,
    rep_commission_total = v_total_commission
  WHERE id = p_venta_id;

  INSERT INTO commission_records (
    empresa_id, session_id, venta_id, rep_id,
    base_commission, volume_multiplier, loyalty_bonus, streak_bonus, total_commission
  ) VALUES (
    p_empresa_id, v_session_id, p_venta_id, v_rep_id,
    v_base_commission, v_multiplier, v_loyalty_bonus, v_streak_bonus, v_total_commission
  );

  UPDATE rep_profiles SET
    total_commissions_earned = total_commissions_earned + v_total_commission,
    total_sales_lifetime = total_sales_lifetime + 1,
    total_revenue_lifetime = total_revenue_lifetime + v_total,
    updated_at = now()
  WHERE user_id = v_rep_id;

  RETURN QUERY SELECT
    v_base_commission,
    v_multiplier,
    v_loyalty_bonus,
    v_streak_bonus,
    v_total_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION actualizar_streak_rep(p_rep_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
  v_has_today BOOLEAN;
  v_has_yesterday BOOLEAN;
  v_current_streak INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cash_sessions
    WHERE rep_id = p_rep_id
      AND session_status IN ('closed','reconciled')
      AND opened_at::date = v_today
  ) INTO v_has_today;

  IF NOT v_has_today THEN
    RETURN;
  END IF;

  SELECT current_streak_days INTO v_current_streak FROM rep_profiles WHERE user_id = p_rep_id;

  SELECT EXISTS (
    SELECT 1 FROM cash_sessions
    WHERE rep_id = p_rep_id
      AND session_status IN ('closed','reconciled')
      AND opened_at::date = v_yesterday
  ) INTO v_has_yesterday;

  IF v_has_yesterday THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  UPDATE rep_profiles SET
    current_streak_days = v_current_streak,
    best_streak_days = GREATEST(best_streak_days, v_current_streak),
    updated_at = now()
  WHERE user_id = p_rep_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: calcular comisión al insertar venta
CREATE OR REPLACE FUNCTION on_venta_calc_comision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cash_session_id IS NOT NULL AND NEW.vendedor_id IS NOT NULL THEN
    PERFORM calcular_comision_venta(NEW.id, (SELECT empresa_id FROM cash_sessions WHERE id = NEW.cash_session_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_venta_comision ON ventas;
CREATE TRIGGER trigger_venta_comision
  AFTER INSERT ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION on_venta_calc_comision();

-- Trigger: actualizar streak al cerrar sesión
CREATE OR REPLACE FUNCTION on_cash_session_close_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_status IN ('closed','reconciled') AND (OLD.session_status IS NULL OR OLD.session_status = 'open') THEN
    PERFORM actualizar_streak_rep(NEW.rep_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cash_session_streak ON cash_sessions;
CREATE TRIGGER trigger_cash_session_streak
  AFTER UPDATE OF session_status ON cash_sessions
  FOR EACH ROW
  EXECUTE FUNCTION on_cash_session_close_streak();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_rep_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rep_profile_updated_at ON rep_profiles;
CREATE TRIGGER trigger_rep_profile_updated_at
  BEFORE UPDATE ON rep_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_rep_profile_updated_at();

-- ─── 11. SEMILLAR commission_rules por defecto ────────────────────────
INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'base',
  'Comisión base',
  '{"rate": 0.10}'::JSONB,
  true,
  0
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'base'
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'volume_threshold',
  'Multiplicador $50K/día',
  '{"threshold": 50000, "multiplier": 1.2}'::JSONB,
  true,
  1
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'volume_threshold' AND (cr.parameter->>'threshold')::NUMERIC = 50000
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'volume_threshold',
  'Multiplicador $100K/día',
  '{"threshold": 100000, "multiplier": 1.4}'::JSONB,
  true,
  2
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'volume_threshold' AND (cr.parameter->>'threshold')::NUMERIC = 100000
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'volume_threshold',
  'Multiplicador $200K/día',
  '{"threshold": 200000, "multiplier": 1.6}'::JSONB,
  true,
  3
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'volume_threshold' AND (cr.parameter->>'threshold')::NUMERIC = 200000
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'loyalty',
  'Cliente recurrente',
  '{"bonus_rate": 0.03}'::JSONB,
  true,
  0
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'loyalty'
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'streak',
  'Racha 7+ días',
  '{"min_days": 7, "bonus": 5000}'::JSONB,
  true,
  1
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'streak' AND (cr.parameter->>'min_days')::INT = 7
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'streak',
  'Racha 14+ días',
  '{"min_days": 14, "bonus": 15000}'::JSONB,
  true,
  2
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'streak' AND (cr.parameter->>'min_days')::INT = 14
);

INSERT INTO commission_rules (empresa_id, rule_type, name, parameter, active, priority)
SELECT
  e.id,
  'streak',
  'Racha 30+ días',
  '{"min_days": 30, "bonus": 50000}'::JSONB,
  true,
  3
FROM empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM commission_rules cr WHERE cr.empresa_id = e.id AND cr.rule_type = 'streak' AND (cr.parameter->>'min_days')::INT = 30
);

-- ─── 12. RLS ──────────────────────────────────────────────────────────

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rep_profiles ENABLE ROW LEVEL SECURITY;

-- cash_sessions
DROP POLICY IF EXISTS "Rep ve sus sesiones" ON cash_sessions;
CREATE POLICY "Rep ve sus sesiones" ON cash_sessions
  FOR SELECT USING (auth.uid() = rep_id);

DROP POLICY IF EXISTS "Admin ve sesiones de empresa" ON cash_sessions;
CREATE POLICY "Admin ve sesiones de empresa" ON cash_sessions
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Rep crea su sesión" ON cash_sessions;
CREATE POLICY "Rep crea su sesión" ON cash_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = rep_id
    AND empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Rep cierra su sesión" ON cash_sessions;
CREATE POLICY "Rep cierra su sesión" ON cash_sessions
  FOR UPDATE USING (
    auth.uid() = rep_id AND session_status = 'open'
  );

DROP POLICY IF EXISTS "Admin reconcilia sesiones" ON cash_sessions;
CREATE POLICY "Admin reconcilia sesiones" ON cash_sessions
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

-- commission_rules
DROP POLICY IF EXISTS "Empresa ve sus reglas" ON commission_rules;
CREATE POLICY "Empresa ve sus reglas" ON commission_rules
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gestiona reglas" ON commission_rules;
CREATE POLICY "Admin gestiona reglas" ON commission_rules
  FOR ALL USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

-- commission_records
DROP POLICY IF EXISTS "Rep ve sus comisiones" ON commission_records;
CREATE POLICY "Rep ve sus comisiones" ON commission_records
  FOR SELECT USING (auth.uid() = rep_id);

DROP POLICY IF EXISTS "Admin ve comisiones de empresa" ON commission_records;
CREATE POLICY "Admin ve comisiones de empresa" ON commission_records
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Comisiones inmutables" ON commission_records;
CREATE POLICY "Comisiones inmutables" ON commission_records
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Comisiones no se editan" ON commission_records;
CREATE POLICY "Comisiones no se editan" ON commission_records
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

DROP POLICY IF EXISTS "Comisiones no se borran" ON commission_records;
CREATE POLICY "Comisiones no se borran" ON commission_records
  FOR DELETE USING (false);

-- invitation_codes
DROP POLICY IF EXISTS "Admin gestiona invitaciones" ON invitation_codes;
CREATE POLICY "Admin gestiona invitaciones" ON invitation_codes
  FOR ALL USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

DROP POLICY IF EXISTS "Usuarios validan codigo" ON invitation_codes;
CREATE POLICY "Usuarios validan codigo" ON invitation_codes
  FOR SELECT USING (active = true);

-- invitation_redemptions
DROP POLICY IF EXISTS "Usuario ve sus redenciones" ON invitation_redemptions;
CREATE POLICY "Usuario ve sus redenciones" ON invitation_redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin ve redenciones" ON invitation_redemptions;
CREATE POLICY "Admin ve redenciones" ON invitation_redemptions
  FOR SELECT USING (
    invitation_id IN (
      SELECT ic.id FROM invitation_codes ic
      WHERE ic.empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sistema inserta redenciones" ON invitation_redemptions;
CREATE POLICY "Sistema inserta redenciones" ON invitation_redemptions
  FOR INSERT WITH CHECK (true);

-- rep_profiles
DROP POLICY IF EXISTS "Rep ve su perfil" ON rep_profiles;
CREATE POLICY "Rep ve su perfil" ON rep_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin ve perfiles de empresa" ON rep_profiles;
CREATE POLICY "Admin ve perfiles de empresa" ON rep_profiles
  FOR SELECT USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin edita perfiles de rep" ON rep_profiles;
CREATE POLICY "Admin edita perfiles de rep" ON rep_profiles
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

DROP POLICY IF EXISTS "Admin desactiva reps" ON rep_profiles;
CREATE POLICY "Admin desactiva reps" ON rep_profiles
  FOR DELETE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );
