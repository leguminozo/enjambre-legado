-- Impacto público bajo patrón snapshot (ley-vs-vivo, como censo_stats_public):
-- el open-book DEJÓ de leer la tabla viva arboles_plantados con service_role
-- desde una ruta anónima. Los agregados se publican deliberadamente (acción
-- admin) como snapshot versionado; la lectura solo ve filas con publicado=true
-- y exige sesión (auth.role() = 'authenticated'), nunca anónima.

CREATE TABLE IF NOT EXISTS public.impacto_publico (
  id                 SERIAL PRIMARY KEY,
  arboles_plantados  INTEGER NOT NULL DEFAULT 0,
  co2_secuestrado_ton NUMERIC NOT NULL DEFAULT 0,
  irr_simplificado   NUMERIC,
  zonas              INTEGER NOT NULL DEFAULT 0,
  especies           INTEGER NOT NULL DEFAULT 0,
  nota               TEXT,
  metodologia_version TEXT,
  publicado          BOOLEAN NOT NULL DEFAULT false,
  generado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.impacto_publico ENABLE ROW LEVEL SECURITY;

-- Lectura: sesión válida y solo snapshots publicados (el flag es el candado).
DROP POLICY IF EXISTS "impacto_publico_read" ON public.impacto_publico;
CREATE POLICY "impacto_publico_read" ON public.impacto_publico
  FOR SELECT USING (
    publicado = true AND auth.role() = 'authenticated'
  );

-- Escritura: admin (el BFF además exige requireProfileRole('admin')).
DROP POLICY IF EXISTS "impacto_publico_admin_write" ON public.impacto_publico;
CREATE POLICY "impacto_publico_admin_write" ON public.impacto_publico
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());