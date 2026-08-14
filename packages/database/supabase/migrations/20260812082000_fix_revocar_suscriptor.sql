-- =============================================================================
-- 20260812082000 — Fix: revocar rol 'suscriptor' al cancelar/pausar
--
-- El trigger original (20260812000000) solo ACTIVABA el rol con status
-- 'active'; una suscripción cancelada/pausada/past_due conservaba el 10% off
-- (multiplicador 0.9×) para siempre — fuga de privilegio y el hub mostraría
-- "Suscriptor activo" a ex-miembros. Ahora toda transición a un estado
-- distinto de 'active' desactiva el rol.
-- =============================================================================

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
  ELSE
    UPDATE public.user_roles
    SET is_active = false
    WHERE user_id = NEW.user_id AND role = 'suscriptor';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_suscriptor ON public.subscriptions;
CREATE TRIGGER trg_grant_suscriptor
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_suscriptor_on_subscription();

-- Backfill: desactivar suscriptores cuyas suscripciones ya no están activas
UPDATE public.user_roles ur
SET is_active = false
WHERE ur.role = 'suscriptor' AND ur.is_active
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = ur.user_id AND s.status = 'active'
  );
