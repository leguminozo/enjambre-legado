-- ============================================================
-- Migration 20260803000000: estaciones fenológicas + desacople de apiarios
-- Estaciones = puntos de referencia (lat/lng) para el cálculo GDD del
-- Oráculo Fenológico. Reemplaza las coordenadas fijas de Pureo hardcodeadas
-- en la ruta y permite ampliar el oráculo a otras localidades.
-- También desacopla observaciones_floracion del módulo de apiarios: el
-- fenómeno floral es territorial, no depende de la tabla apiarios.
-- ============================================================

-- 1. Estaciones fenológicas
CREATE TABLE IF NOT EXISTS public.estaciones_fenologicas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  lat         NUMERIC(9,6) NOT NULL,
  lng         NUMERIC(9,6) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estación de referencia inicial: Pureo, Chiloé (misma base que lib/meteo.ts)
INSERT INTO public.estaciones_fenologicas (nombre, lat, lng)
VALUES ('Pureo, Chiloé', -41.86, -73.82);

-- 2. RLS
ALTER TABLE public.estaciones_fenologicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estaciones lectura authenticated" ON public.estaciones_fenologicas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Estaciones gestion admin" ON public.estaciones_fenologicas
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Trigger updated_at
DROP TRIGGER IF EXISTS estaciones_fenologicas_updated_at ON public.estaciones_fenologicas;
CREATE TRIGGER estaciones_fenologicas_updated_at
  BEFORE UPDATE ON public.estaciones_fenologicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Desacople de apiarios: las observaciones son fenómenos territoriales genéricos
ALTER TABLE public.observaciones_floracion DROP COLUMN IF EXISTS apiario_id;
