-- Migration: Normalizar ownership para edición de mapa
-- Idempotente: remoto puede no tener created_by (ya migrado o schema distinto)

ALTER TABLE apiarios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'apiarios' AND column_name = 'created_by'
  ) THEN
    UPDATE apiarios SET user_id = created_by WHERE user_id IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

DROP POLICY IF EXISTS apiarios_select ON apiarios;
DROP POLICY IF EXISTS apiarios_mutate ON apiarios;
DROP POLICY IF EXISTS apiarios_insert ON apiarios;
DROP POLICY IF EXISTS apiarios_update ON apiarios;
DROP POLICY IF EXISTS apiarios_delete ON apiarios;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'apiarios' AND column_name = 'created_by'
  ) THEN
    EXECUTE $pol$
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
    $pol$;
  ELSE
    EXECUTE $pol$
      CREATE POLICY apiarios_select ON apiarios
        FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
      CREATE POLICY apiarios_insert ON apiarios
        FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
      CREATE POLICY apiarios_update ON apiarios
        FOR UPDATE USING (user_id = auth.uid() OR public.is_admin())
        WITH CHECK (user_id = auth.uid() OR public.is_admin());
      CREATE POLICY apiarios_delete ON apiarios
        FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
    $pol$;
  END IF;
END $$;

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

COMMENT ON COLUMN apiarios.user_id IS 'Columna normalizada para ownership (consistente con arboles_plantados).';
