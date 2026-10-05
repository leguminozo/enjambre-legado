-- ============================================================
-- Migration 20261004120000: evolución catálogo botánico y oráculo fenológico
-- 1. Ampliación de especies_fenologicas: origen (nativa/introducida), hábito,
--    relevancia melífera, monitoreo activo en oráculo, y foto de referencia.
-- 2. Enriquecimiento de observaciones_floracion: sector / paraje textual.
-- 3. RLS completo: edición y eliminación de observaciones para el autor,
--    e incorporación de especies para roles de terreno (territorial, apicultor).
-- ============================================================

-- 1. Campos adicionales en especies_fenologicas
ALTER TABLE public.especies_fenologicas
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'nativa'
    CHECK (origen IN ('nativa', 'endemica', 'introducida', 'naturalizada')),
  ADD COLUMN IF NOT EXISTS habito TEXT DEFAULT 'arbol'
    CHECK (habito IN ('arbol', 'arbusto', 'herbacea', 'enredadera', 'palmera', 'otro')),
  ADD COLUMN IF NOT EXISTS relevancia_apicola TEXT DEFAULT 'mixta'
    CHECK (relevancia_apicola IN ('nectar', 'polen', 'mixta', 'propoleo', 'melada')),
  ADD COLUMN IF NOT EXISTS monitoreo_activo BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

CREATE INDEX IF NOT EXISTS idx_especies_fenologicas_monitoreo
  ON public.especies_fenologicas(monitoreo_activo)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_especies_fenologicas_origen
  ON public.especies_fenologicas(origen);

-- 2. Campos adicionales en observaciones_floracion
ALTER TABLE public.observaciones_floracion
  ADD COLUMN IF NOT EXISTS sector TEXT;

CREATE INDEX IF NOT EXISTS idx_obs_floracion_sector
  ON public.observaciones_floracion(sector);

-- 3. RLS: Actualizar políticas de observaciones_floracion
-- El observador o admin puede actualizar sus observaciones (para corregir errores de campo)
DROP POLICY IF EXISTS "Obs floracion propias update" ON public.observaciones_floracion;
CREATE POLICY "Obs floracion propias update" ON public.observaciones_floracion
  FOR UPDATE TO authenticated
  USING (observador_id = auth.uid() OR public.is_admin())
  WITH CHECK (observador_id = auth.uid() OR public.is_admin());

-- El observador o admin puede eliminar observaciones erróneas
DROP POLICY IF EXISTS "Obs floracion propias delete" ON public.observaciones_floracion;
CREATE POLICY "Obs floracion propias delete" ON public.observaciones_floracion
  FOR DELETE TO authenticated
  USING (observador_id = auth.uid() OR public.is_admin());

-- 4. RLS: Permitir a roles territoriales y apicultores incorporar especies botánicas al catálogo
DROP POLICY IF EXISTS "Especies insercion territorial" ON public.especies_fenologicas;
CREATE POLICY "Especies insercion territorial" ON public.especies_fenologicas
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    public.current_role() IN ('territorial', 'apicultor')
  );

DROP POLICY IF EXISTS "Especies actualizacion territorial" ON public.especies_fenologicas;
CREATE POLICY "Especies actualizacion territorial" ON public.especies_fenologicas
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    public.current_role() IN ('territorial', 'apicultor')
  )
  WITH CHECK (
    public.is_admin() OR
    public.current_role() IN ('territorial', 'apicultor')
  );
