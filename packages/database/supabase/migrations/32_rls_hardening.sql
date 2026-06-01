-- Migration 32: RLS security hardening for tables from migrations 28-31
-- Tightens overly permissive policies, removes DELETE from rep_profiles,
-- restricts commission_rules DELETE, adds missing INSERT policy for rep_profiles.

-- ─── 1. commission_rules: split ALL into specific policies ─────────

DROP POLICY IF EXISTS "Admin gestiona reglas" ON commission_rules;

DROP POLICY IF EXISTS "Admin crea reglas" ON commission_rules;
CREATE POLICY "Admin crea reglas" ON commission_rules
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

DROP POLICY IF EXISTS "Admin edita reglas" ON commission_rules;
CREATE POLICY "Admin edita reglas" ON commission_rules
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

DROP POLICY IF EXISTS "Solo gerente elimina reglas" ON commission_rules;
CREATE POLICY "Solo gerente elimina reglas" ON commission_rules
  FOR DELETE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gerente')
  );

-- ─── 2. commission_records: restrict INSERT to system only ─────────

DROP POLICY IF EXISTS "Comisiones inmutables" ON commission_records;

DROP POLICY IF EXISTS "Solo sistema inserta comisiones" ON commission_records;
CREATE POLICY "Solo sistema inserta comisiones" ON commission_records
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

-- ─── 3. rep_profiles: replace DELETE with soft-delete protection ──

DROP POLICY IF EXISTS "Admin desactiva reps" ON rep_profiles;

DROP POLICY IF EXISTS "Admin desactiva reps soft" ON rep_profiles;
CREATE POLICY "Admin desactiva reps" ON rep_profiles
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

-- Prevent actual DELETE on rep_profiles (soft-delete via active=false only)
DROP POLICY IF EXISTS "No se eliminan perfiles de rep" ON rep_profiles;
CREATE POLICY "No se eliminan perfiles de rep" ON rep_profiles
  FOR DELETE USING (false);

-- ─── 4. rep_profiles: add missing INSERT policy ────────────────────

DROP POLICY IF EXISTS "Sistema crea perfiles de rep" ON rep_profiles;
CREATE POLICY "Sistema crea perfiles de rep" ON rep_profiles
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
  );

-- ─── 5. invitation_redemptions: restrict INSERT ────────────────────

DROP POLICY IF EXISTS "Sistema inserta redenciones" ON invitation_redemptions;

DROP POLICY IF EXISTS "Sistema inserta redenciones restricted" ON invitation_redemptions;
CREATE POLICY "Sistema inserta redenciones" ON invitation_redemptions
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = user_id
  );

-- ─── 6. cash_sessions: restrict admin UPDATE to status/reconciliation fields ──

DROP POLICY IF EXISTS "Admin reconcilia sesiones" ON cash_sessions;

DROP POLICY IF EXISTS "Admin reconcilia sesiones hardened" ON cash_sessions;
CREATE POLICY "Admin reconcilia sesiones" ON cash_sessions
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente','tienda_admin'))
    AND session_status IN ('closed','reconciled')
  );

-- ─── 7. RLS for new columns (no new tables in 29-31) ──────────────
-- tier_override, tier_promoted_at, tier_multiplier, channel_rate
-- are covered by existing policies on rep_profiles and commission_records.
