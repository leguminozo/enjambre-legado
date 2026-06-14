-- Migration: Normalizar ownership para edición de mapa
-- Problema: apiarios usa created_by, arboles_plantados usa user_id
-- Solución: Agregar user_id a apiarios para consistencia, mantener created_by por compatibilidad

-- Paso 1: Agregar columna user_id a apiarios
ALTER TABLE apiarios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Paso 2: Migrar datos existentes de created_by a user_id
UPDATE apiarios SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;

-- Paso 3: Actualizar RLS policies para apiarios (soportar ambas columnas durante transición)
DROP POLICY IF EXISTS apiarios_select ON apiarios;
DROP POLICY IF EXISTS apiarios_mutate ON apiarios;

CREATE POLICY apiarios_select ON apiarios
  FOR SELECT USING (
    user_id = auth.uid() 
    OR created_by = auth.uid() 
    OR public.is_admin()
  );

CREATE POLICY apiarios_insert ON apiarios
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    OR created_by = auth.uid() 
    OR public.is_admin()
  );

CREATE POLICY apiarios_update ON apiarios
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR created_by = auth.uid() 
    OR public.is_admin()
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR created_by = auth.uid() 
    OR public.is_admin()
  );

CREATE POLICY apiarios_delete ON apiarios
  FOR DELETE USING (
    user_id = auth.uid() 
    OR created_by = auth.uid() 
    OR public.is_admin()
  );

-- Paso 4: Asegurar que arboles_plantados tenga las políticas correctas (refuerzo)
DROP POLICY IF EXISTS arboles_select ON public.arboles_plantados;
DROP POLICY IF EXISTS arboles_insert ON public.arboles_plantados;
DROP POLICY IF EXISTS arboles_update ON public.arboles_plantados;
DROP POLICY IF EXISTS arboles_delete ON public.arboles_plantados;

CREATE POLICY arboles_select ON public.arboles_plantados
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY arboles_insert ON public.arboles_plantados
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY arboles_update ON public.arboles_plantados
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY arboles_delete ON public.arboles_plantados
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Comentario de auditoría
COMMENT ON COLUMN apiarios.user_id IS 'Columna normalizada para ownership (consistente con arboles_plantados). Migrada desde created_by en 20250614.';
