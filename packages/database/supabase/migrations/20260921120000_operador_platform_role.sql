-- =============================================================================
-- 20260921120000 — RoleKey de plataforma `operador` (almacén, inventario, bodega)
--
-- Contexto:
--   * Permite asignar ayudantes u operadores de bodega para conteo de inventario,
--     lotes y despacho sin elevarlos a admin (principio de menor privilegio).
--   * Actualiza profiles_role_check con 'operador'.
--   * Habilita RLS de inventario_items e inventario_movimientos para miembros
--     de la empresa vía has_empresa_access(empresa_id).
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
      'admin',
      'apicultor',
      'cliente',
      'creador',
      'operador',
      'rep_ventas',
      'territorial'
    ));
END $$;

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'Platform RoleKey: admin | apicultor | cliente | creador | operador | rep_ventas | territorial.';

-- ── RLS inventario_items con has_empresa_access ──────────────────────────────
DROP POLICY IF EXISTS inventario_items_select ON public.inventario_items;
CREATE POLICY inventario_items_select ON public.inventario_items
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
    OR (empresa_id IS NOT NULL AND public.has_empresa_access(empresa_id))
  );

DROP POLICY IF EXISTS inventario_items_write ON public.inventario_items;
CREATE POLICY inventario_items_write ON public.inventario_items
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
    OR (empresa_id IS NOT NULL AND public.has_empresa_access(empresa_id))
  ) WITH CHECK (
    user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
    OR (empresa_id IS NOT NULL AND public.has_empresa_access(empresa_id))
  );

-- ── RLS inventario_movimientos con has_empresa_access ────────────────────────
DROP POLICY IF EXISTS inventario_mov_select ON public.inventario_movimientos;
CREATE POLICY inventario_mov_select ON public.inventario_movimientos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inventario_items i
      WHERE i.id = item_id
        AND (
          i.user_id = auth.uid()
          OR public.is_admin()
          OR public.is_gerente()
          OR (i.empresa_id IS NOT NULL AND public.has_empresa_access(i.empresa_id))
        )
    )
  );

DROP POLICY IF EXISTS inventario_mov_insert ON public.inventario_movimientos;
CREATE POLICY inventario_mov_insert ON public.inventario_movimientos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventario_items i
      WHERE i.id = item_id
        AND (
          i.user_id = auth.uid()
          OR public.is_admin()
          OR public.is_gerente()
          OR (i.empresa_id IS NOT NULL AND public.has_empresa_access(i.empresa_id))
        )
    )
  );
