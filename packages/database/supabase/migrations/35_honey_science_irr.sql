-- ============================================================
-- Migration 35: Honey Science & IRR (Regenerative Metrics)
-- Tablas para análisis de miel, métricas CO2 e IRR por lote
-- ============================================================

-- 1. Análisis de laboratorio por miel/lote
CREATE TABLE IF NOT EXISTS honey_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  fecha_analisis date NOT NULL DEFAULT current_date,
  laboratorio text,
  humedad_pct numeric(5,2),
  hmf_mg_kg numeric(6,2),
  diastasa_actividad numeric(6,2),
  invertasa_actividad numeric(6,2),
  glucosa_oxidasa boolean DEFAULT false,
  actividad_antimicrobiana text,
  perfil_polen jsonb DEFAULT '{}',
  indice_glicemico_estimado numeric(5,2),
  ph numeric(4,2),
  acidez_libre_meq numeric(5,2),
  color_pfund numeric(6,2),
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Métricas de captura CO2 por árbol (time-series, reemplaza co2_kg estático)
CREATE TABLE IF NOT EXISTS co2_capture_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arbol_id uuid REFERENCES arboles_plantados(id) ON DELETE CASCADE,
  fecha_medicion date NOT NULL DEFAULT current_date,
  co2_kg_capturado numeric(8,2) NOT NULL,
  metodo_medicion text DEFAULT 'ipcc_tier1',
  factor_especie numeric(5,2),
  edad_anos integer,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. IRR por lote/producto: Índice de Regeneración Relativa
CREATE TABLE IF NOT EXISTS irr_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid REFERENCES lotes(id) ON DELETE SET NULL,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  periodo text NOT NULL,
  co2_capturado_kg numeric(10,2) NOT NULL DEFAULT 0,
  co2_emitido_kg numeric(10,2) NOT NULL DEFAULT 0,
  irr numeric(6,2) GENERATED ALWAYS AS (
    CASE WHEN co2_emitido_kg = 0 THEN 0 ELSE co2_capturado_kg / co2_emitido_kg END
  ) STORED,
  arboles_asociados integer DEFAULT 0,
  colmenas_activas integer DEFAULT 0,
  metodologia text DEFAULT 'ipcc_2006_patagonia_humedal',
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Agregar campos científicos a productos existentes
ALTER TABLE productos ADD COLUMN IF NOT EXISTS sustituye_azucar_g numeric(6,2);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS co2_evitado_kg numeric(8,2);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS irr_referencia numeric(5,2);

-- RLS
ALTER TABLE honey_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE co2_capture_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE irr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "honey_analysis_read_authenticated" ON honey_analysis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "honey_analysis_write_admin" ON honey_analysis
  FOR ALL TO authenticated USING (is_gerente()) WITH CHECK (is_gerente());

CREATE POLICY "co2_metrics_read_authenticated" ON co2_capture_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "co2_metrics_write_admin" ON co2_capture_metrics
  FOR ALL TO authenticated USING (is_gerente()) WITH CHECK (is_gerente());

CREATE POLICY "irr_records_read_authenticated" ON irr_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "irr_records_write_admin" ON irr_records
  FOR ALL TO authenticated USING (is_gerente()) WITH CHECK (is_gerente());

-- Índices
CREATE INDEX IF NOT EXISTS idx_honey_analysis_lote ON honey_analysis(lote_id);
CREATE INDEX IF NOT EXISTS idx_honey_analysis_producto ON honey_analysis(producto_id);
CREATE INDEX IF NOT EXISTS idx_co2_metrics_arbol ON co2_capture_metrics(arbol_id);
CREATE INDEX IF NOT EXISTS idx_irr_lote ON irr_records(lote_id);
CREATE INDEX IF NOT EXISTS idx_irr_producto ON irr_records(producto_id);

-- Función: calcular IRR para un lote
CREATE OR REPLACE FUNCTION calcular_irr_lote(p_lote_id uuid)
RETURNS numeric AS $$
DECLARE
  v_capturado numeric := 0;
  v_emitido numeric := 0;
  v_min_fecha date;
BEGIN
  SELECT MIN(fecha) INTO v_min_fecha
  FROM cosechas WHERE lote_id = p_lote_id;

  SELECT COALESCE(SUM(co2_kg_capturado), 0) INTO v_capturado
  FROM co2_capture_metrics c
  WHERE c.fecha_medicion >= COALESCE(v_min_fecha, '2000-01-01'::date);

  SELECT COALESCE(SUM(co2_emitido_kg), 0) INTO v_emitido
  FROM irr_records WHERE lote_id = p_lote_id;

  IF v_emitido = 0 THEN RETURN 0; END IF;
  RETURN ROUND(v_capturado / v_emitido, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Comentario
COMMENT ON TABLE honey_analysis IS 'Resultados de laboratorio por lote/producto de miel';
COMMENT ON TABLE co2_capture_metrics IS 'Serie temporal de captura CO2 por árbol plantado';
COMMENT ON TABLE irr_records IS 'Índice de Regeneración Relativa: CO2 capturado / CO2 emitido por ciclo productivo';
COMMENT ON COLUMN irr_records.irr IS 'IRR = co2_capturado_kg / co2_emitido_kg. >1 = impacto positivo neto';
