-- 999: Update legacy hardcoded role checks to use is_admin() after migration 39

-- 1. Ventas (from migration 12)
DROP POLICY IF EXISTS "Vendedores can insert sales" ON ventas;
CREATE POLICY "Vendedores can insert sales" ON ventas
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR public.current_role() = 'rep_ventas'
);

-- 2. Creadores (from migration 14)
DROP POLICY IF EXISTS "Admins gestionan creadores" ON creadores;
CREATE POLICY "Admins gestionan creadores" ON creadores
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins ven usos de codigos" ON creador_codigo_usos;
CREATE POLICY "Admins ven usos de codigos" ON creador_codigo_usos
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins gestionan comisiones" ON creador_comisiones;
CREATE POLICY "Admins gestionan comisiones" ON creador_comisiones
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Comisiones inmutables para creadores" ON creador_comisiones;
CREATE POLICY "Comisiones inmutables para creadores" ON creador_comisiones
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins gestionan retiros" ON creador_retiros;
CREATE POLICY "Admins gestionan retiros" ON creador_retiros
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins ven metricas creadores" ON creador_metricas_mes;
CREATE POLICY "Admins ven metricas creadores" ON creador_metricas_mes
  FOR SELECT USING (public.is_admin());

-- 3. Storage Policies (from migrations 17/19/34)
-- Note: These might already be handled by migration 39's storage updates, 
-- but we ensure here that avatars and other buckets are fully clean.
-- (Migration 39 already recreated most of these. We skip recreating storage policies here to avoid conflicts,
-- unless we are absolutely sure they are still using hardcoded roles. 
-- In this case, Migration 39 step 10 fixed avatars, steps 6-9 fixed others.)

-- 4. Cash Sessions & Commissions (from migration 28 / 32)
DROP POLICY IF EXISTS "Comisiones no se editan" ON commission_records;
CREATE POLICY "Comisiones no se editan" ON commission_records
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin gestiona invitaciones" ON invitation_codes;
CREATE POLICY "Admin gestiona invitaciones" ON invitation_codes
  FOR ALL USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin edita perfiles de rep" ON rep_profiles;
CREATE POLICY "Admin edita perfiles de rep" ON rep_profiles
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin desactiva reps" ON rep_profiles;
CREATE POLICY "Admin desactiva reps" ON rep_profiles
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin crea reglas" ON commission_rules;
CREATE POLICY "Admin crea reglas" ON commission_rules
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admin edita reglas" ON commission_rules;
CREATE POLICY "Admin edita reglas" ON commission_rules
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Solo sistema inserta comisiones" ON commission_records;
CREATE POLICY "Solo sistema inserta comisiones" ON commission_records
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Sistema crea perfiles de rep" ON rep_profiles;
CREATE POLICY "Sistema crea perfiles de rep" ON rep_profiles
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin reconcilia sesiones" ON cash_sessions;
CREATE POLICY "Admin reconcilia sesiones" ON cash_sessions
  FOR UPDATE USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND public.is_admin()
    AND session_status IN ('closed','reconciled')
  );
