-- =============================================================================
-- Censo legal: `actores_registro.completo` solo lo escribe service_role
-- (BFF POST /actores/:id/completar-censo). authenticated no puede
-- autodeclarar el candado via RLS UPDATE (hueco 991 actores_own_update).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_actores_completo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.completo IS TRUE AND auth.role() IS DISTINCT FROM 'service_role' THEN
      NEW.completo := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.completo IS DISTINCT FROM OLD.completo THEN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'censo_completo_server_only'
        USING ERRCODE = '42501',
              HINT = 'completo solo via BFF POST /actores/:id/completar-censo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS actores_registro_guard_completo ON public.actores_registro;
CREATE TRIGGER actores_registro_guard_completo
  BEFORE INSERT OR UPDATE ON public.actores_registro
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_actores_completo();

REVOKE ALL ON FUNCTION public.guard_actores_completo() FROM PUBLIC, anon, authenticated;
