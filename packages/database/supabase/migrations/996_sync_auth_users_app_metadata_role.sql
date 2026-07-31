-- Migration 996 — Sincronizar role de profiles hacia auth.users.raw_app_meta_data
-- Garantiza que el JWT (app_metadata.role) y el middleware de Núcleo/Tienda
-- reflejen el rol real del usuario ('admin', 'rep_ventas', 'creador', etc.)
-- evitando bucles de redirección entre tienda y núcleo.

-- 1. Actualizar usuarios existentes para que auth.users tenga app_metadata.role = profiles.role
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id
  AND p.role IS NOT NULL
  AND (u.raw_app_meta_data->>'role' IS NULL OR u.raw_app_meta_data->>'role' != p.role);

-- 2. Crear función y trigger para mantener sincronizado auth.users al insertar o modificar en profiles
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.role IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.role IS NULL OR OLD.role IS DISTINCT FROM NEW.role) THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role_to_auth ON public.profiles;
CREATE TRIGGER trg_sync_profile_role_to_auth
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth();
