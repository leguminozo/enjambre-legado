-- Migration 43: Supabase custom_access_token hook for OYZ roles

-- NOTE: The schema audit confirms the stackable roles (comprador, suscriptor, revendedor, embajador)
-- are stored in `public.user_roles.role`, NOT `profiles.rol` (which stores the system auth role like admin/cliente).
-- We will query `user_roles` and select the highest priority.

CREATE OR REPLACE FUNCTION public.custom_access_token(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
BEGIN
  -- Extract user ID from the event payload
  v_user_id := (event->>'user_id')::uuid;

  -- 1. Get the highest priority active domain role from user_roles
  -- Hierarchy: embajador (4) > revendedor (3) > suscriptor (2) > comprador (1)
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY 
    CASE role
      WHEN 'embajador' THEN 4
      WHEN 'revendedor' THEN 3
      WHEN 'suscriptor' THEN 2
      WHEN 'comprador' THEN 1
      ELSE 0
    END DESC
  LIMIT 1;

  -- 2. Fallback to 'comprador' if no role is found (fail-safe)
  IF v_role IS NULL THEN
    v_role := 'comprador';
  END IF;

  -- 3. Inject `oyz_role` into app_metadata
  RETURN jsonb_set(
    event,
    '{claims, app_metadata, oyz_role}',
    to_jsonb(v_role)
  );
END;
$$;

-- Grant permissions for Supabase Auth to execute this hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token FROM authenticated, anon, public;

-- To register this hook in Supabase:
-- Go to Dashboard -> Authentication -> Hooks -> "Custom Access Token"
-- Select `public.custom_access_token` and enable it.
