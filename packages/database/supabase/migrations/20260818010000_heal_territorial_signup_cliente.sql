-- Si el correo ya tenía profiles.role = cliente (tienda) o el INSERT
-- de handle_new_user hizo ON CONFLICT DO NOTHING, el alta territorial
-- quedaba como cliente y Núcleo lo mandaba al catálogo.
--
-- Este trigger corre después de on_auth_user_created y solo sube
-- cliente → territorial cuando el signup trae app_source de la red.

CREATE OR REPLACE FUNCTION public.heal_territorial_signup_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'app_source' IS DISTINCT FROM 'nucleo_territorial' THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET role = 'territorial'
  WHERE id = NEW.id
    AND COALESCE(role, 'cliente') IN ('cliente', '');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_heal_territorial_signup_cliente ON auth.users;
CREATE TRIGGER trg_heal_territorial_signup_cliente
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.heal_territorial_signup_cliente();
