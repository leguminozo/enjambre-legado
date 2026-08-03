-- ============================================================
-- Migration 20260802130000: núcleo fenológico (Oráculo científico)
-- Especies con umbrales GDD · observaciones de floración (BBCH 60-69)
-- · alertas de floración.
-- Los umbrales GDD se calibran con datos pasivos (GBIF/iNaturalist/ERA5)
-- vía scripts/fenologia/calibrar.ts — esta migración solo crea el esquema.
-- ============================================================

-- 1. Especies fenológicas (referencia por especie melífera nativa)
CREATE TABLE IF NOT EXISTS public.especies_fenologicas (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_cientifico  TEXT NOT NULL UNIQUE,
  nombre_comun       TEXT NOT NULL,
  familia            TEXT,
  tbase_c            NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  gdd_umbral         NUMERIC(8,1),              -- GDD acumulado (desde 1-jul) hasta floración
  gdd_stddev         NUMERIC(8,1),              -- desviación del umbral entre años
  ventana_ini        INTEGER CHECK (ventana_ini BETWEEN 1 AND 12),  -- mes inicio ventana GBIF
  ventana_fin        INTEGER CHECK (ventana_fin BETWEEN 1 AND 12),
  fuente             TEXT NOT NULL DEFAULT 'manual'
                     CHECK (fuente IN ('gbif', 'inat', 'literatura', 'activa', 'manual')),
  activo             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Observaciones de floración (protocolo BBCH 60-69 + intensidad USA-NPN)
CREATE TABLE IF NOT EXISTS public.observaciones_floracion (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especie_id    UUID NOT NULL REFERENCES public.especies_fenologicas(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  lat           NUMERIC(9,6),
  lng           NUMERIC(9,6),
  fenofase_bbch INTEGER NOT NULL CHECK (fenofase_bbch BETWEEN 60 AND 69),
  status        TEXT NOT NULL DEFAULT 'si' CHECK (status IN ('si', 'no')),
  intensidad    TEXT CHECK (intensidad IN
                 ('menos_3', '3_10', '11_100', '101_1000', '1001_10000', 'mas_10000')),
  observador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  apiario_id    UUID REFERENCES public.apiarios(id) ON DELETE SET NULL,
  foto_url      TEXT,
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obs_floracion_especie_fecha
  ON public.observaciones_floracion(especie_id, fecha);
CREATE INDEX IF NOT EXISTS idx_obs_floracion_observador
  ON public.observaciones_floracion(observador_id);

-- 3. Alertas de floración ("floración en N días")
CREATE TABLE IF NOT EXISTS public.alertas_floracion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  especie_id     UUID NOT NULL REFERENCES public.especies_fenologicas(id) ON DELETE CASCADE,
  fecha_predicha DATE NOT NULL,
  gdd_calculado  NUMERIC(8,1),
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'emitida', 'cumplida', 'descartada')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_floracion_especie_estado
  ON public.alertas_floracion(especie_id, estado);

-- 4. RLS
ALTER TABLE public.especies_fenologicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observaciones_floracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_floracion ENABLE ROW LEVEL SECURITY;

-- Especies: lectura para cualquier authenticated; gestión solo admin
CREATE POLICY "Especies lectura authenticated" ON public.especies_fenologicas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Especies gestion admin" ON public.especies_fenologicas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Observaciones: admin gestiona todo; cada usuario ve/inserta las propias
CREATE POLICY "Obs floracion admin" ON public.observaciones_floracion
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Obs floracion propias select" ON public.observaciones_floracion
  FOR SELECT TO authenticated USING (observador_id = auth.uid());
CREATE POLICY "Obs floracion insert propio" ON public.observaciones_floracion
  FOR INSERT TO authenticated WITH CHECK (observador_id = auth.uid() OR public.is_admin());

-- Alertas: admin escribe; authenticated lee
CREATE POLICY "Alertas floracion admin" ON public.alertas_floracion
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Alertas floracion lectura" ON public.alertas_floracion
  FOR SELECT TO authenticated USING (true);

-- 5. Triggers updated_at
DROP TRIGGER IF EXISTS especies_fenologicas_updated_at ON public.especies_fenologicas;
CREATE TRIGGER especies_fenologicas_updated_at
  BEFORE UPDATE ON public.especies_fenologicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS alertas_floracion_updated_at ON public.alertas_floracion;
CREATE TRIGGER alertas_floracion_updated_at
  BEFORE UPDATE ON public.alertas_floracion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
