-- ============================================================
-- Migration 20260808000000: profiles.role DEFAULT 'cliente' (least privilege)
--
-- La migración 20260802100000 dejó DEFAULT 'admin' para satisfacer la CHECK
-- constraint tras el hotfix 20260601120000 ('gerente' era inválido).
-- handle_new_user() siempre asigna rol explícito, pero un INSERT directo sin
-- role (paths admin, backfills, bugs futuros) crearía un admin silencioso.
-- Least privilege: el default de un usuario nuevo es 'cliente'.
-- ============================================================
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'cliente';
