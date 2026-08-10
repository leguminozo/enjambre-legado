-- Fix RLS: policies con roles pre-consolidación (gerente/tienda_admin/vendedor).
-- La migration 39 consolidó todos los perfiles a 'admin'; las policies que
-- comparan roles literales NUNCA matchean y dejan tablas sin admin legítimo
-- para cualquier acceso con client autenticado (los BFF usan service role,
-- por eso el breakage fue latente). Se recrean con is_admin().
-- Listado verificado: migrations 11, 13, 77 y 78 (ninguna posterior las reemplazó).

-- ──────────────────────────────────────────────────────────────────────────
-- 1) resenas_producto (77_ola1_resenas_producto) — moderación + gestión
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS resenas_producto_admin_all ON public.resenas_producto;
CREATE POLICY resenas_producto_admin_all ON public.resenas_producto
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS resenas_claim_admin ON public.resenas_claim_tokens;
CREATE POLICY resenas_claim_admin ON public.resenas_claim_tokens
  FOR ALL USING (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────
-- 2) Guardian / wallet pass (78_ola2_wallet_guardian)
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS stamp_programs_admin ON public.guardian_stamp_programs;
CREATE POLICY stamp_programs_admin ON public.guardian_stamp_programs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS stamp_progress_admin ON public.guardian_stamp_progress;
CREATE POLICY stamp_progress_admin ON public.guardian_stamp_progress
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────
-- 3) Vanguardia (11_vanguard_architecture)
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins ven todo en vanguardia" ON public.revendedor_profile;
CREATE POLICY "Admins ven todo en vanguardia" ON public.revendedor_profile
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins ven todas las reseñas" ON public.resenas_sensoriales;
CREATE POLICY "Admins ven todas las reseñas" ON public.resenas_sensoriales
  FOR SELECT USING (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────
-- 4) productos_write (13_fix_productos_missing) — zombie duplicada:
--    cubierta por productos_admin_all (39:161, is_admin()). Se elimina.
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS productos_write ON public.productos;
