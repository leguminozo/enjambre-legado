-- 1002: Reemplazar public.is_gerente() por public.is_admin() en las policies
-- de la migración 991. Tras la consolidación de roles (migration 39) is_gerente()
-- es un alias de is_admin(); esto elimina la deuda semántica y hace explícito
-- que el acceso administrativo al registro corresponde al rol admin.

-- actores_registro
DROP POLICY IF EXISTS "actores_own_select" ON public.actores_registro;
CREATE POLICY "actores_own_select" ON public.actores_registro
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "actores_own_update" ON public.actores_registro;
CREATE POLICY "actores_own_update" ON public.actores_registro
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- predios_facilitadores
DROP POLICY IF EXISTS "predios_own" ON public.predios_facilitadores;
CREATE POLICY "predios_own" ON public.predios_facilitadores
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- apiarios_externos
DROP POLICY IF EXISTS "apiarios_ext_own" ON public.apiarios_externos;
CREATE POLICY "apiarios_ext_own" ON public.apiarios_externos
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- alertas_fitosanitarias
DROP POLICY IF EXISTS "alertas_own" ON public.alertas_fitosanitarias;
CREATE POLICY "alertas_own" ON public.alertas_fitosanitarias
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  );
