-- Migration 40: RLS Hardening — D6 Audit
-- Based on actual remote DB state (2026-06-07).
-- All tables already have RLS enabled (from mig 32).
-- Many tables have legacy user-owned policies from Supabase defaults.
-- This migration: drops conflicting policies, creates hardened ones,
-- adds security_invoker to views, hardens SECURITY DEFINER functions.

-- ═══════════════════════════════════════════════════════════════
-- §1 TABLES WITH RLS BUT WEAK/MISSING POLICIES — Replace
-- ═══════════════════════════════════════════════════════════════

-- source_files: no policies exist yet
CREATE POLICY source_files_select ON public.source_files
  FOR SELECT USING (public.is_gerente() OR uploaded_by = auth.uid() OR public.current_role() = 'admin');
CREATE POLICY source_files_insert ON public.source_files
  FOR INSERT WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');
CREATE POLICY source_files_update ON public.source_files
  FOR UPDATE USING (public.is_gerente() OR public.current_role() = 'admin');

-- boletas_ingest: no policies exist yet
CREATE POLICY boletas_ingest_rw ON public.boletas_ingest
  FOR ALL USING (public.is_gerente() OR public.current_role() = 'admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

-- bank_movements: no policies exist yet
CREATE POLICY bank_movements_rw ON public.bank_movements
  FOR ALL USING (public.is_gerente() OR public.current_role() = 'admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

-- sii_sync_runs: no policies exist yet
CREATE POLICY sii_sync_runs_rw ON public.sii_sync_runs
  FOR ALL USING (public.is_gerente() OR public.current_role() = 'admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'admin');

-- notification_events: no policies exist yet
CREATE POLICY notification_events_select ON public.notification_events
  FOR SELECT USING (public.is_gerente() OR created_by = auth.uid() OR public.current_role() = 'admin');
CREATE POLICY notification_events_insert ON public.notification_events
  FOR INSERT WITH CHECK (public.is_gerente() OR created_by = auth.uid() OR public.current_role() = 'admin');

-- cosechas: no policies exist yet
CREATE POLICY cosechas_select ON public.cosechas
  FOR SELECT USING (
    public.is_gerente()
    OR EXISTS (SELECT 1 FROM colmenas WHERE colmenas.id = cosechas.colmena_id
               AND (colmenas.user_id = auth.uid() OR public.is_gerente()))
  );
CREATE POLICY cosechas_insert ON public.cosechas
  FOR INSERT WITH CHECK (public.is_gerente());
CREATE POLICY cosechas_update ON public.cosechas
  FOR UPDATE USING (public.is_gerente());

-- lotes: no policies exist yet
CREATE POLICY lotes_select ON public.lotes
  FOR SELECT USING (public.is_gerente());
CREATE POLICY lotes_insert ON public.lotes
  FOR INSERT WITH CHECK (public.is_gerente());
CREATE POLICY lotes_update ON public.lotes
  FOR UPDATE USING (public.is_gerente());

-- arboles_plantados: has legacy "Users can *" policies from Supabase defaults — replace with hardened ones
DROP POLICY IF EXISTS "Users can view own arboles_plantados" ON public.arboles_plantados;
DROP POLICY IF EXISTS "Users can insert own arboles_plantados" ON public.arboles_plantados;
DROP POLICY IF EXISTS "Users can update own arboles_plantados" ON public.arboles_plantados;
DROP POLICY IF EXISTS "Users can delete own arboles_plantados" ON public.arboles_plantados;
CREATE POLICY arboles_select ON public.arboles_plantados
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY arboles_insert ON public.arboles_plantados
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());
CREATE POLICY arboles_update ON public.arboles_plantados
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY arboles_delete ON public.arboles_plantados
  FOR DELETE USING (user_id = auth.uid() OR public.is_gerente());

-- ═══════════════════════════════════════════════════════════════
-- §2 suscriptor_config — RLS enabled but ZERO policies
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY suscriptor_self_select ON public.suscriptor_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY suscriptor_self_insert ON public.suscriptor_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY suscriptor_self_update ON public.suscriptor_config
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY suscriptor_admin ON public.suscriptor_config
  FOR ALL USING (public.is_gerente())
  WITH CHECK (public.is_gerente());

-- ═══════════════════════════════════════════════════════════════
-- §3 OVERLY PERMISSIVE POLICIES — Tighten
-- ═══════════════════════════════════════════════════════════════

-- productos: DROP legacy productos_read (USING true) — allows anon to see hidden products
-- Keep productos_public_read (USING visible = true) + productos_admin_all
DROP POLICY IF EXISTS productos_read ON public.productos;

-- eventos: restrict SELECT from anon to authenticated only
DROP POLICY IF EXISTS eventos_read ON public.eventos;
CREATE POLICY eventos_read ON public.eventos
  FOR SELECT TO authenticated USING (true);

-- configuracion_ia: ALL for any authenticated is too permissive — restrict to admin
DROP POLICY IF EXISTS "owner_manage_configuracion_ia" ON public.configuracion_ia;
CREATE POLICY "admin_manage_configuracion_ia" ON public.configuracion_ia
  FOR ALL USING (public.is_gerente())
  WITH CHECK (public.is_gerente());

-- integrations: SELECT was open to any authenticated — restrict to gerente/admin
DROP POLICY IF EXISTS integrations_select ON public.integrations;
CREATE POLICY integrations_select ON public.integrations
  FOR SELECT USING (public.is_gerente() OR public.current_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════
-- §4 VIEWS — Add security_invoker
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW user_tier_view WITH (security_invoker = true) AS
SELECT p.id as user_id,
  COALESCE(SUM(c.cantidad), 0) as ciclos_historicos,
  CASE
    WHEN COALESCE(SUM(c.cantidad), 0) >= 5000 THEN 'COLMENA'
    WHEN COALESCE(SUM(c.cantidad), 0) >= 2000 THEN 'REINA'
    WHEN COALESCE(SUM(c.cantidad), 0) >= 500 THEN 'ZÁNGANO'
    ELSE 'OBRERA'
  END as tier
FROM profiles p
LEFT JOIN ciclos c ON p.id = c.user_id
GROUP BY p.id;

CREATE OR REPLACE VIEW user_ciclos_balance WITH (security_invoker = true) AS
SELECT p.id as user_id,
  COALESCE((SELECT SUM(cantidad) FROM ciclos WHERE user_id = p.id), 0)
  - COALESCE((SELECT SUM(ciclos_usados) FROM ciclos_canjeados WHERE user_id = p.id), 0) as saldo_actual
FROM profiles p;

CREATE OR REPLACE VIEW creador_balance_view WITH (security_invoker = true) AS
SELECT c.id AS creador_id,
  c.user_id,
  c.nombre_publico,
  c.codigo_ref,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id), 0) AS comisiones_total,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'pendiente'), 0) AS comisiones_pendientes,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'aprobada'), 0) AS comisiones_aprobadas,
  COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado = 'pagado'), 0) AS total_retirado,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'aprobada'), 0)
  - COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado IN ('pagado', 'aprobado', 'pendiente')), 0) AS balance_disponible,
  c.total_usos_codigo
FROM creadores c;

CREATE OR REPLACE VIEW creador_ranking_view WITH (security_invoker = true) AS
WITH creador_stats AS (
  SELECT c.id, c.nombre_publico, c.codigo_ref, c.plataforma, c.estado, c.total_usos_codigo, c.total_comisiones, c.seguidores_aprox
  FROM creadores c
  WHERE c.estado = 'activo'
)
SELECT *, ROW_NUMBER() OVER (ORDER BY total_comisiones DESC) AS ranking
FROM creador_stats;

CREATE OR REPLACE VIEW rep_session_summary_view WITH (security_invoker = true) AS
SELECT cs.id AS session_id,
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

CREATE OR REPLACE VIEW rep_performance_view WITH (security_invoker = true) AS
SELECT rp.user_id,
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

-- ═══════════════════════════════════════════════════════════════
-- §5 MISSING/CONFLICTING POLICIES — Add or replace
-- ═══════════════════════════════════════════════════════════════

-- colmenas: legacy "Users can *" policies + mig 32 colmenas_select — replace with hardened set
DROP POLICY IF EXISTS "Users can view own colmenas" ON public.colmenas;
DROP POLICY IF EXISTS "Users can insert own colmenas" ON public.colmenas;
DROP POLICY IF EXISTS "Users can update own colmenas" ON public.colmenas;
DROP POLICY IF EXISTS "Users can delete own colmenas" ON public.colmenas;
DROP POLICY IF EXISTS colmenas_select ON public.colmenas;
CREATE POLICY colmenas_select ON public.colmenas
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY colmenas_insert ON public.colmenas
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());
CREATE POLICY colmenas_update ON public.colmenas
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY colmenas_delete ON public.colmenas
  FOR DELETE USING (public.is_gerente());

-- inspecciones: legacy "Users can *" policies + mig 32 inspecciones_select — replace
DROP POLICY IF EXISTS "Users can view own inspecciones" ON public.inspecciones;
DROP POLICY IF EXISTS "Users can insert own inspecciones" ON public.inspecciones;
DROP POLICY IF EXISTS "Users can update own inspecciones" ON public.inspecciones;
DROP POLICY IF EXISTS "Users can delete own inspecciones" ON public.inspecciones;
DROP POLICY IF EXISTS inspecciones_select ON public.inspecciones;
CREATE POLICY inspecciones_select ON public.inspecciones
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY inspecciones_insert ON public.inspecciones
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());
CREATE POLICY inspecciones_update ON public.inspecciones
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY inspecciones_delete ON public.inspecciones
  FOR DELETE USING (public.is_gerente());

-- varroa_records: legacy "Users can *" policies + mig 32 varroa_select — replace
DROP POLICY IF EXISTS "Users can view own varroa_records" ON public.varroa_records;
DROP POLICY IF EXISTS "Users can insert own varroa_records" ON public.varroa_records;
DROP POLICY IF EXISTS "Users can update own varroa_records" ON public.varroa_records;
DROP POLICY IF EXISTS "Users can delete own varroa_records" ON public.varroa_records;
DROP POLICY IF EXISTS varroa_select ON public.varroa_records;
CREATE POLICY varroa_select ON public.varroa_records
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY varroa_insert ON public.varroa_records
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());
CREATE POLICY varroa_update ON public.varroa_records
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY varroa_delete ON public.varroa_records
  FOR DELETE USING (public.is_gerente());

-- peso_records: legacy "Users can *" policies + mig 32 peso_select — replace
DROP POLICY IF EXISTS "Users can view own peso_records" ON public.peso_records;
DROP POLICY IF EXISTS "Users can insert own peso_records" ON public.peso_records;
DROP POLICY IF EXISTS "Users can update own peso_records" ON public.peso_records;
DROP POLICY IF EXISTS "Users can delete own peso_records" ON public.peso_records;
DROP POLICY IF EXISTS peso_select ON public.peso_records;
CREATE POLICY peso_select ON public.peso_records
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY peso_insert ON public.peso_records
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());
CREATE POLICY peso_update ON public.peso_records
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente());
CREATE POLICY peso_delete ON public.peso_records
  FOR DELETE USING (public.is_gerente());

-- ciclos: INSERT only via service_role or gerente (triggers use SECURITY DEFINER)
CREATE POLICY ciclos_insert ON public.ciclos
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR public.is_gerente());

-- ciclos_canjeados: INSERT for user self-service or admin
CREATE POLICY ciclos_canjeados_insert ON public.ciclos_canjeados
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_gerente());

-- ═══════════════════════════════════════════════════════════════
-- §6 SECURITY DEFINER FUNCTION HARDENING
-- ═══════════════════════════════════════════════════════════════

-- decrement_stock: revoke from anon/authenticated — only service_role + triggers
REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INT) FROM authenticated, anon;

-- aplicar_codigo_creador: add auth check
CREATE OR REPLACE FUNCTION aplicar_codigo_creador(
  p_codigo TEXT,
  p_venta_id UUID,
  p_cliente_id UUID,
  p_monto_venta NUMERIC
) RETURNS TABLE(
  valido BOOLEAN,
  creador_nombre TEXT,
  descuento NUMERIC,
  comision NUMERIC
) AS $$
DECLARE
  v_creador RECORD;
  v_descuento NUMERIC;
  v_comision NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, 'No autenticado'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  SELECT * INTO v_creador FROM creadores
  WHERE UPPER(codigo_ref) = UPPER(p_codigo) AND estado = 'activo';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF v_creador.user_id = p_cliente_id THEN
    RETURN QUERY SELECT false::BOOLEAN, 'No puedes usar tu propio código'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM creador_codigo_usos
    WHERE venta_id = p_venta_id AND creador_id = v_creador.id
  ) THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Ya se aplicó un código a esta venta'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  v_descuento := FLOOR(p_monto_venta * v_creador.descuento_cliente / 100);
  v_comision := FLOOR(p_monto_venta * v_creador.porcentaje_comision / 100);

  INSERT INTO creador_codigo_usos (creador_id, venta_id, cliente_id, codigo_usado, monto_venta, descuento_aplicado, comision_generada)
  VALUES (v_creador.id, p_venta_id, p_cliente_id, UPPER(p_codigo), p_monto_venta, v_descuento, v_comision);

  RETURN QUERY SELECT true::BOOLEAN, v_creador.nombre_publico, v_descuento, v_comision;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- canjear_codigo_invitacion: enforce caller = p_user_id
CREATE OR REPLACE FUNCTION canjear_codigo_invitacion(
  p_code TEXT,
  p_user_id UUID
) RETURNS TABLE(
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
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  SELECT * INTO v_inv FROM invitation_codes
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

  UPDATE invitation_codes SET current_uses = current_uses + 1 WHERE id = v_inv.id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- calcular_comision_venta: add guard — only callable by service_role or triggers
CREATE OR REPLACE FUNCTION public.calcular_comision_venta(
  p_venta_id UUID,
  p_empresa_id UUID
) RETURNS TABLE(
  base_commission NUMERIC,
  volume_multiplier NUMERIC,
  loyalty_bonus NUMERIC,
  streak_bonus NUMERIC,
  tier_multiplier NUMERIC,
  total_commission NUMERIC
) AS $$
DECLARE
  v_total NUMERIC;
  v_rep_id UUID;
  v_channel TEXT;
  v_is_new_client BOOLEAN;
  v_cliente_id UUID;
  v_session_id UUID;
  v_base_rate NUMERIC;
  v_channel_rate NUMERIC;
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
  v_channel_rules JSONB;
BEGIN
  IF auth.role() NOT IN ('service_role', 'postgres') AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'calcular_comision_venta: solo invocable por triggers o service_role';
  END IF;

  SELECT total, vendedor_id, channel, is_new_client, cliente_id, cash_session_id
  INTO v_total, v_rep_id, v_channel, v_is_new_client, v_cliente_id, v_session_id
  FROM ventas WHERE id = p_venta_id;

  IF NOT FOUND OR v_rep_id IS NULL THEN
    RETURN QUERY SELECT 0::NUMERIC, 1.0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 1.0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  SELECT COALESCE((parameter->>'rate')::NUMERIC, 0.10) INTO v_base_rate
  FROM commission_rules
  WHERE empresa_id = p_empresa_id AND rule_type = 'base' AND active = true
  ORDER BY priority DESC LIMIT 1;

  IF v_base_rate IS NULL OR v_base_rate = 0 THEN v_base_rate := 0.10; END IF;

  v_channel_rate := v_base_rate;
  IF v_channel IS NOT NULL THEN
    SELECT parameter->'channels' INTO v_channel_rules
    FROM commission_rules
    WHERE empresa_id = p_empresa_id AND rule_type = 'channel_rate' AND active = true
    ORDER BY priority DESC LIMIT 1;
    IF v_channel_rules IS NOT NULL THEN
      v_channel_rate := COALESCE((v_channel_rules->>v_channel)::NUMERIC, v_base_rate);
    END IF;
  END IF;

  v_base_commission := v_total * v_channel_rate;

  SELECT COALESCE(SUM(v2.total), 0) INTO v_daily_total
  FROM ventas v2
  WHERE v2.vendedor_id = v_rep_id AND v2.cash_session_id = v_session_id AND v2.id != p_venta_id;
  v_daily_total := v_daily_total + v_total;

  FOR v_rule IN
    SELECT parameter FROM commission_rules
    WHERE empresa_id = p_empresa_id AND rule_type = 'volume_threshold' AND active = true
    ORDER BY (parameter->>'threshold')::NUMERIC ASC
  LOOP
    IF v_daily_total >= (v_rule.parameter->>'threshold')::NUMERIC THEN
      v_multiplier := GREATEST(v_multiplier, (v_rule.parameter->>'multiplier')::NUMERIC);
    END IF;
  END LOOP;

  IF v_cliente_id IS NOT NULL AND v_is_new_client = false THEN
    v_is_repeat_client := true;
    SELECT COALESCE((parameter->>'bonus_rate')::NUMERIC, 0.03) INTO v_loyalty_bonus
    FROM commission_rules
    WHERE empresa_id = p_empresa_id AND rule_type = 'loyalty' AND active = true
    ORDER BY priority DESC LIMIT 1;
    IF v_loyalty_bonus IS NULL THEN
      v_loyalty_bonus := v_total * 0.03;
    ELSE
      v_loyalty_bonus := v_total * v_loyalty_bonus;
    END IF;
  END IF;

  SELECT current_streak_days INTO v_streak_days FROM rep_profiles WHERE user_id = v_rep_id;
  IF v_streak_days >= 7 THEN
    FOR v_rule IN
      SELECT parameter FROM commission_rules
      WHERE empresa_id = p_empresa_id AND rule_type = 'streak' AND active = true
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

  SELECT commission_tier INTO v_tier FROM rep_profiles WHERE user_id = v_rep_id;
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
    base_commission, volume_multiplier, loyalty_bonus, streak_bonus,
    tier_multiplier, channel_rate, total_commission
  ) VALUES (
    p_empresa_id, v_session_id, p_venta_id, v_rep_id,
    v_base_commission, v_multiplier, v_loyalty_bonus, v_streak_bonus,
    v_tier_multiplier, v_channel_rate, v_total_commission
  );

  UPDATE rep_profiles SET
    total_commissions_earned = total_commissions_earned + v_total_commission,
    total_sales_lifetime = total_sales_lifetime + 1,
    total_revenue_lifetime = total_revenue_lifetime + v_total,
    updated_at = now()
  WHERE user_id = v_rep_id;

  RETURN QUERY SELECT v_base_commission, v_multiplier, v_loyalty_bonus, v_streak_bonus, v_tier_multiplier, v_total_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
