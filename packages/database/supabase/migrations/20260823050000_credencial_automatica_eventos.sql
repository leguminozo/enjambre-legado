-- =============================================================================
-- Prioridad alta (auditoría 2026-08-23):
-- 1. Credencial con recálculo AUTOMÁTICO (triggers en cosechas y
--    apiarios_registro) — hoy el RPC existe pero nada lo dispara.
-- 2. Eventos de seguridad nuevos: censo_completado (gobernanza territorial)
--    y arco_solicitado (solicitud de supresión de datos, Ley 19.628).
-- =============================================================================

-- ── 1. Recálculo automático de credencial ────────────────────────────────────
-- Resuelve el actor desde una colmena (cosecha → colmena → apiario → registro)
-- y vuelve a evaluar su nivel de acreditación.
CREATE OR REPLACE FUNCTION public.recalcular_credencial_por_cosecha()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.colmena_id IS NULL THEN RETURN OLD; END IF;
    SELECT ar.actor_id INTO v_actor_id
    FROM public.colmenas c
    JOIN public.apiarios_registro ar
      ON ar.apiario_origen_id = c.apiario_id
    WHERE c.id = OLD.colmena_id
    LIMIT 1;
  ELSE
    IF NEW.colmena_id IS NULL THEN RETURN NEW; END IF;
    SELECT ar.actor_id INTO v_actor_id
    FROM public.colmenas c
    JOIN public.apiarios_registro ar
      ON ar.apiario_origen_id = c.apiario_id
    WHERE c.id = NEW.colmena_id
    LIMIT 1;
  END IF;

  IF v_actor_id IS NOT NULL THEN
    UPDATE public.actores_registro ar
    SET nivel_acreditacion = public.evaluar_nivel_acreditacion(v_actor_id),
        updated_at = now()
    WHERE ar.id = v_actor_id
      AND ar.nivel_acreditacion <> 'referente';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.recalcular_credencial_por_cosecha() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_credencial_cosecha ON public.cosechas;
CREATE TRIGGER trg_credencial_cosecha
  AFTER INSERT OR UPDATE OF kg, colmena_id OR DELETE ON public.cosechas
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_credencial_por_cosecha();

-- Recálculo al declarar/desactivar un apiario en el registro.
CREATE OR REPLACE FUNCTION public.recalcular_credencial_por_apiario_registro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.actores_registro ar
    SET nivel_acreditacion = public.evaluar_nivel_acreditacion(OLD.actor_id),
        updated_at = now()
    WHERE ar.id = OLD.actor_id
      AND ar.nivel_acreditacion <> 'referente';
    RETURN OLD;
  END IF;

  UPDATE public.actores_registro ar
  SET nivel_acreditacion = public.evaluar_nivel_acreditacion(NEW.actor_id),
      updated_at = now()
  WHERE ar.id = NEW.actor_id
    AND ar.nivel_acreditacion <> 'referente';

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.recalcular_credencial_por_apiario_registro() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_credencial_apiario_registro ON public.apiarios_registro;
CREATE TRIGGER trg_credencial_apiario_registro
  AFTER INSERT OR UPDATE OF activo, apiario_origen_id OR DELETE ON public.apiarios_registro
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_credencial_por_apiario_registro();

-- Recálculo al cambiar consentimientos (comprometido depende de mapa_comunitario).
CREATE OR REPLACE FUNCTION public.recalcular_credencial_por_consentimiento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.consentimientos IS DISTINCT FROM OLD.consentimientos
     AND NEW.nivel_acreditacion <> 'referente' THEN
    NEW.nivel_acreditacion := public.evaluar_nivel_acreditacion(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.recalcular_credencial_por_consentimiento() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_credencial_consentimiento ON public.actores_registro;
CREATE TRIGGER trg_credencial_consentimiento
  BEFORE UPDATE OF consentimientos ON public.actores_registro
  FOR EACH ROW
  EXECUTE FUNCTION public.recalcular_credencial_por_consentimiento();

-- ── 2. Tipos de evento de seguridad nuevos ───────────────────────────────────
ALTER TABLE public.security_events
  DROP CONSTRAINT IF EXISTS security_events_event_type_check;

ALTER TABLE public.security_events
  ADD CONSTRAINT security_events_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'login_failed', 'login_success',
    'password_reset_requested', 'password_changed',
    'account_locked', 'suspicious_activity',
    'role_change', 'session_revoked',
    'mfa_enabled', 'mfa_disabled',
    'oauth_linked', 'access_denied',
    'signup_success', 'signup_trigger_error',
    'censo_completado', 'arco_solicitado'
  ]));