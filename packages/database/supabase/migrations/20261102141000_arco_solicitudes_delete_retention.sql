-- Preserve the ARCO audit record when a profile is removed from Auth.
-- The request no longer has an owner after deletion, but its legal audit trail
-- must remain available to administrators instead of blocking deleteUser().
ALTER TABLE public.arco_solicitudes
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.arco_solicitudes
  DROP CONSTRAINT IF EXISTS arco_solicitudes_user_id_fkey;

ALTER TABLE public.arco_solicitudes
  ADD CONSTRAINT arco_solicitudes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.arco_solicitudes
  DROP CONSTRAINT IF EXISTS arco_solicitudes_revisado_por_fkey;

ALTER TABLE public.arco_solicitudes
  ADD CONSTRAINT arco_solicitudes_revisado_por_fkey
  FOREIGN KEY (revisado_por) REFERENCES public.profiles(id) ON DELETE SET NULL;
