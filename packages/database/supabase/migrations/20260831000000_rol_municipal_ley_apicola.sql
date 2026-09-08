-- =============================================================================
-- Migración: Rol Institucional Municipal (Ley Apícola 21.489)
-- Habilita el acceso segmentado por comuna para municipalidades, permitiéndoles
-- ver el censo de actores y apiarios únicamente de su propia comuna.
-- =============================================================================

-- 1. Helper function para evaluar el rol municipal sin causar infinite loops
--    de RLS (Security Definer).
CREATE OR REPLACE FUNCTION public.is_municipal_for_comuna(p_comuna text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.actores_registro 
    WHERE user_id = auth.uid() 
      AND rol = 'institucion_municipal' 
      AND comuna = p_comuna
      AND estado = 'activo'
  );
$$;

-- 2. Políticas RLS para actores_registro
DROP POLICY IF EXISTS "actores_municipal_read" ON public.actores_registro;
CREATE POLICY "actores_municipal_read" ON public.actores_registro
  FOR SELECT USING (
    public.is_municipal_for_comuna(comuna)
  );

-- 3. Políticas RLS para apiarios_registro
DROP POLICY IF EXISTS "apiarios_municipal_read" ON public.apiarios_registro;
CREATE POLICY "apiarios_municipal_read" ON public.apiarios_registro
  FOR SELECT USING (
    public.is_municipal_for_comuna(
      (SELECT comuna FROM public.actores_registro WHERE id = apiarios_registro.actor_id LIMIT 1)
    )
  );
