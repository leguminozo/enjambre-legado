-- Integración de herramientas internas (auditoría de entrelazado, oleada 3):
-- A1: colmenas.production_total pasa a ser derivado del ledger cosechas.
-- A2: colmenas.last_inspection se mantiene desde inspecciones (todas las vías).
-- B3: costos_colmena existía solo en la DB viva; aquí queda definida en el repo
--     con RLS para que el código pueda dejar de fabricarla con ceros.
-- A10: catálogo de métodos de monitoreo de varroa + normalización de variantes.

-- ── A1: production_total = SUM(cosechas.kg) ──────────────────────────────────
UPDATE public.colmenas c
SET production_total = sub.total
FROM (
  SELECT colmena_id, COALESCE(SUM(kg), 0) AS total
  FROM public.cosechas
  WHERE colmena_id IS NOT NULL
  GROUP BY colmena_id
) sub
WHERE c.id = sub.colmena_id;

CREATE OR REPLACE FUNCTION public.sync_colmena_production_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_colmena uuid;
BEGIN
  v_colmena := COALESCE(NEW.colmena_id, OLD.colmena_id);
  IF v_colmena IS NOT NULL THEN
    UPDATE public.colmenas c
    SET production_total = agg.total
    FROM (
      SELECT COALESCE(SUM(kg), 0) AS total
      FROM public.cosechas
      WHERE colmena_id = v_colmena
    ) agg
    WHERE c.id = v_colmena;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_cosechas_production_total ON public.cosechas;
CREATE TRIGGER trg_cosechas_production_total
  AFTER INSERT OR UPDATE OF kg, colmena_id OR DELETE ON public.cosechas
  FOR EACH ROW EXECUTE FUNCTION public.sync_colmena_production_total();

-- ── A2: last_inspection avanza con cada inspección (solo hacia adelante) ─────
CREATE OR REPLACE FUNCTION public.sync_colmena_last_inspection()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.date IS NOT NULL THEN
    UPDATE public.colmenas
    SET last_inspection = NEW.date
    WHERE id = NEW.colmena_id
      AND (last_inspection IS NULL OR last_inspection < NEW.date);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspecciones_last_inspection ON public.inspecciones;
CREATE TRIGGER trg_inspecciones_last_inspection
  AFTER INSERT OR UPDATE OF date ON public.inspecciones
  FOR EACH ROW EXECUTE FUNCTION public.sync_colmena_last_inspection();

-- ── B3: costos por colmena (antes tabla fantasma sin migración en el repo) ───
CREATE TABLE IF NOT EXISTS public.costos_colmena (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id        UUID REFERENCES public.colmenas(id) ON DELETE CASCADE,
  horas_anuales     NUMERIC,
  costo_hora        NUMERIC,
  amortizacion_cajon NUMERIC,
  insumos_anuales   NUMERIC,
  produccion_kg     NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Un registro económico por colmena: evita duplicados en upserts del BFF.
CREATE UNIQUE INDEX IF NOT EXISTS costos_colmena_colmena_id_key
  ON public.costos_colmena (colmena_id);

ALTER TABLE public.costos_colmena ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "costos_colmena_own" ON public.costos_colmena;
CREATE POLICY "costos_colmena_own" ON public.costos_colmena
  FOR ALL USING (
    colmena_id IN (SELECT id FROM public.colmenas WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    colmena_id IN (SELECT id FROM public.colmenas WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- ── A10: catálogo de métodos varroa + normalización de texto libre ───────────
CREATE TABLE IF NOT EXISTS public.varroa_metodos (
  code  TEXT PRIMARY KEY,
  label TEXT NOT NULL
);
INSERT INTO public.varroa_metodos (code, label) VALUES
  ('lavado_alcohol', 'Lavado con alcohol'),
  ('caida_natural',  'Caída natural'),
  ('co2',            'CO2')
ON CONFLICT (code) DO NOTHING;
ALTER TABLE public.varroa_metodos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "varroa_metodos_read" ON public.varroa_metodos;
CREATE POLICY "varroa_metodos_read" ON public.varroa_metodos
  FOR SELECT USING (auth.role() = 'authenticated');

UPDATE public.varroa_records SET method = 'Lavado con alcohol'
WHERE lower(method) IN ('alcohol', 'lavado alcohol', 'lavado_con_alcohol', 'lavado');
UPDATE public.varroa_records SET method = 'Caída natural'
WHERE lower(method) IN ('caida natural', 'caida_natural', 'caída natural');
UPDATE public.varroa_records SET method = 'CO2'
WHERE lower(method) IN ('co2', 'co₂');
