-- Migration: 20261004130000_break_colmenas_apiarios_rls_recursion.sql
-- Description: Breaks infinite RLS recursion (Postgres error 42P17) between colmenas and apiarios.
-- When colmenas_select queried apiarios, apiarios RLS evaluated apiarios_centinela_public_select
-- and apiarios_suscriptor_select, which in turn queried colmenas, causing an infinite loop.
-- The function public.user_can_access_colmena runs with SECURITY DEFINER and search_path = '',
-- bypassing RLS on apiarios and breaking the circular dependency.

-- 1. Create SECURITY DEFINER helper function for colmena access
CREATE OR REPLACE FUNCTION public.user_can_access_colmena(
  p_colmena_user_id UUID, 
  p_apiario_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    p_colmena_user_id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
    OR (
      p_apiario_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.apiarios a
        WHERE a.id = p_apiario_id
        AND (a.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
      )
    );
$$;

COMMENT ON FUNCTION public.user_can_access_colmena IS 'Verifica permisos de lectura sobre colmenas sin disparar recursion RLS en apiarios (42P17)';

REVOKE ALL ON FUNCTION public.user_can_access_colmena(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_colmena(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_colmena(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_colmena(UUID, UUID) TO service_role;

-- 2. Redefine colmenas_select policy using the secure definer helper
DROP POLICY IF EXISTS colmenas_select ON public.colmenas;
CREATE POLICY colmenas_select ON public.colmenas 
  FOR SELECT 
  USING (public.user_can_access_colmena(user_id, apiario_id));
