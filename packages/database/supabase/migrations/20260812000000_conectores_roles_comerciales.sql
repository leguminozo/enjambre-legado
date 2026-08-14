-- =============================================================================
-- 20260812000000 — Conectores de roles comerciales (eje C)
--
-- Problema (análisis docs/ROLES_Y_ACCESO.md + auditoría):
--   user_roles (eje comercial: comprador/suscriptor/revendedor/embajador/
--   creador) y profiles.role (eje plataforma) se escriben por separado y los
--   multiplicadores del pricing quedaban huérfanos:
--     · rep_ventas (plataforma) → NUNCA recibía 'revendedor' (0.8×)
--       salvo vía claim B2B; el alta directa (admin-identidades) ni siquiera
--       escribe user_roles.
--     · creador (portal) → 'creador' en user_roles no produce 'embajador'
--       (0.7×); el hook custom_access_token solo considera comprador/
--       suscriptor/revendedor/embajador.
--     · Club de la Cosecha (suscripción activa) → nunca otorgaba 'suscriptor'
--       (0.9×).
--
-- Solución (centralizada, sin duplicar reglas en APIs):
--   1. Trigger en user_roles: derivar rol comercial desde rol de dominio base.
--   2. Trigger en subscriptions: estado 'active' → 'suscriptor'.
--   El hook custom_access_token (mig 43) ya resuelve la prioridad
--   embajador(4) > revendedor(3) > suscriptor(2) > comprador(1).
-- =============================================================================

-- ── 1. user_roles: rep_ventas → revendedor · creador → embajador ───────────
CREATE OR REPLACE FUNCTION public.derive_commercial_role_from_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 'rep_ventas' es el rol de dominio (feria/POS) que habilita el descuento
  -- de revendedor en la tienda (0.8×). 'creador' habilita embajador (0.7×).
  IF NEW.is_active AND NEW.role = 'rep_ventas' THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (NEW.user_id, 'revendedor', true)
    ON CONFLICT (user_id, role)
    DO UPDATE SET is_active = true, activated_at = now();
  ELSIF NEW.is_active AND NEW.role = 'creador' THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (NEW.user_id, 'embajador', true)
    ON CONFLICT (user_id, role)
    DO UPDATE SET is_active = true, activated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_commercial_role ON public.user_roles;
CREATE TRIGGER trg_derive_commercial_role
  AFTER INSERT OR UPDATE OF role, is_active ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_commercial_role_from_domain();

-- Backfill: plataformas ya existentes sin su rol comercial derivado
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT ur.user_id, 'revendedor', true
FROM public.user_roles ur
WHERE ur.role = 'rep_ventas' AND ur.is_active
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();

INSERT INTO public.user_roles (user_id, role, is_active)
SELECT ur.user_id, 'embajador', true
FROM public.user_roles ur
WHERE ur.role = 'creador' AND ur.is_active
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();

-- Alta directa de admin (admin-identidades) escribe profiles.role sin tocar
-- user_roles: backfill por perfiles también (idempotente).
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT p.id, 'revendedor', true
FROM public.profiles p
WHERE p.role = 'rep_ventas'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();

INSERT INTO public.user_roles (user_id, role, is_active)
SELECT p.id, 'embajador', true
FROM public.profiles p
WHERE p.role = 'creador'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();

-- ── 2. subscriptions: estado 'active' → 'suscriptor' (0.9×) ─────────────────
CREATE OR REPLACE FUNCTION public.grant_suscriptor_on_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (NEW.user_id, 'suscriptor', true)
    ON CONFLICT (user_id, role)
    DO UPDATE SET is_active = true, activated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_suscriptor ON public.subscriptions;
CREATE TRIGGER trg_grant_suscriptor
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_suscriptor_on_subscription();

-- Backfill: suscripciones activas existentes
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT s.user_id, 'suscriptor', true
FROM public.subscriptions s
WHERE s.status = 'active'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true, activated_at = now();

-- Sin GRANT/REVOKE explícitos: las funciones se invocan SOLO vía trigger y el
-- patrón del repo (handle_new_user) no toca permisos — el REVOKE podría
-- romper los INSERT de user_roles hechos con el client del usuario
-- (p. ej. creadores.ts upserta user_roles como authenticated).
