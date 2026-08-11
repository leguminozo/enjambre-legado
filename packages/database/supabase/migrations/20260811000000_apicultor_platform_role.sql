-- =============================================================================
-- 20260811000000 — RoleKey de plataforma `apicultor` (patio / operación)
--
-- Contexto (docs/ROLES_Y_ACCESO.md):
--   * Mig 39 consolidó apicultor histórico → admin y cerró el CHECK.
--   * Mig 997 abrió `territorial` (red/censo), distinto del patio.
--   * Objetivo: `profiles.role = 'apicultor'` es operador de colmenas/bitácora
--     con allowlist en shell + BFF; NO es elevación a admin.
--
-- RLS: sin cambios. colmenas/bitácora ya son owner OR is_gerente() (audit
-- docs/RLS_AUDIT_COLMENAS_BITACORA.md). Patio solo ve lo suyo.
--
-- NO backfill: no se degrada ningún admin a apicultor. Invitaciones nuevas.
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
      'rep_ventas',
      'territorial'
    ));
END $$;

COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS
  'Platform RoleKey: admin | apicultor (patio) | territorial (red/censo) | cliente | creador | rep_ventas. Legacy JWT map en @enjambre/auth (sin apicultor→admin).';
