-- Laboratorio de calidad: análisis formales por lote (Codex Alimentarius).
-- HMF > 40 mg/kg bloquea venta (lotes.bloqueado_calidad); humedad > 20% alerta.
-- Certificados PDF en bucket privado; el PDP muestra solo el último análisis
-- vía BFF público (sin RLS anónima directa).

CREATE TABLE IF NOT EXISTS public.analisis_laboratorio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  laboratorio TEXT NOT NULL,
  humedad_pct NUMERIC CHECK (humedad_pct IS NULL OR (humedad_pct >= 0 AND humedad_pct <= 100)),
  hmf_mgkg NUMERIC CHECK (hmf_mgkg IS NULL OR hmf_mgkg >= 0),
  diastasa NUMERIC CHECK (diastasa IS NULL OR diastasa >= 0),
  cenizas_pct NUMERIC CHECK (cenizas_pct IS NULL OR (cenizas_pct >= 0 AND cenizas_pct <= 100)),
  conductividad_ms NUMERIC CHECK (conductividad_ms IS NULL OR conductividad_ms >= 0),
  conteo_polinico JSONB NOT NULL DEFAULT '{}'::jsonb,
  certificado_path TEXT,
  creado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analisis_laboratorio_lote
  ON public.analisis_laboratorio (lote_id, fecha DESC);

ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS bloqueado_calidad BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.analisis_laboratorio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analisis_lab_admin_all" ON public.analisis_laboratorio;
CREATE POLICY "analisis_lab_admin_all" ON public.analisis_laboratorio
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "analisis_lab_equipo_read" ON public.analisis_laboratorio;
CREATE POLICY "analisis_lab_equipo_read" ON public.analisis_laboratorio
  FOR SELECT TO authenticated USING (
    public.is_admin() OR public.jwt_app_role() IN ('apicultor', 'territorial')
  );

DROP POLICY IF EXISTS "analisis_lab_apicultor_insert" ON public.analisis_laboratorio;
CREATE POLICY "analisis_lab_apicultor_insert" ON public.analisis_laboratorio
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin() OR public.jwt_app_role() = 'apicultor'
  );

-- Bucket privado de certificados PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('analisis-laboratorio', 'analisis-laboratorio', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_analisis_lab_read ON storage.objects;
DROP POLICY IF EXISTS storage_analisis_lab_insert ON storage.objects;
DROP POLICY IF EXISTS storage_analisis_lab_delete ON storage.objects;

CREATE POLICY storage_analisis_lab_read ON storage.objects
  FOR SELECT USING (
    bucket_id = 'analisis-laboratorio'
    AND (owner = auth.uid() OR public.is_admin())
  );
CREATE POLICY storage_analisis_lab_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'analisis-laboratorio'
    AND owner = auth.uid()
  );
CREATE POLICY storage_analisis_lab_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'analisis-laboratorio'
    AND (owner = auth.uid() OR public.is_admin())
  );
