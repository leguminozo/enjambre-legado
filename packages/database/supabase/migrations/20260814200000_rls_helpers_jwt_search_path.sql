-- RLS helpers: search_path vacío + rol de plataforma desde JWT (app_metadata.role).
-- STABLE ya existía (01 / 39 / 06). Esto recorta lookups a profiles por statement
-- cuando el JWT trae el rol (trigger 996) y cierra search_path injection.
-- oyz_role (hook 43) es rol comercial (embajador/revendedor/…) — NUNCA admin.

CREATE OR REPLACE FUNCTION public.jwt_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NULLIF(
    (
      NULLIF(current_setting('request.jwt.claims', true), '')::jsonb
      -> 'app_metadata'
      ->> 'role'
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.jwt_app_role() IN (
      'admin', 'gerente', 'tienda_admin', 'vendedor', 'logistica', 'marketing'
    ),
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    public.jwt_app_role(),
    (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_empresa_access(target_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_empresas ue
    WHERE ue.user_id = auth.uid()
      AND ue.empresa_id = target_empresa_id
  );
$$;

REVOKE ALL ON FUNCTION public.jwt_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_app_role() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_gerente() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_gerente() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_empresa_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_empresa_access(uuid) TO anon, authenticated, service_role;
