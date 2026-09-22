-- ============================================================
-- Migration 20260921172000: Laboratorio de Calidad y Lotes
-- Parámetros avanzados de análisis físico-químico y polínico
-- ============================================================

ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS pureza_polinica NUMERIC,
  ADD COLUMN IF NOT EXISTS analisis_conductividad NUMERIC,
  ADD COLUMN IF NOT EXISTS analisis_brix NUMERIC,
  ADD COLUMN IF NOT EXISTS polen_predominante TEXT,
  ADD COLUMN IF NOT EXISTS certificado_numero TEXT,
  ADD COLUMN IF NOT EXISTS certificado_laboratorio_url TEXT;

COMMENT ON COLUMN public.lotes.pureza_polinica IS 'Porcentaje de polen de la especie dominante (ej. 85%)';
COMMENT ON COLUMN public.lotes.analisis_conductividad IS 'Conductividad eléctrica en mS/cm';
COMMENT ON COLUMN public.lotes.analisis_brix IS 'Grados Brix refractométricos (°Bx)';
COMMENT ON COLUMN public.lotes.polen_predominante IS 'Especie botánica predominante (ej. Eucryphia cordifolia)';
COMMENT ON COLUMN public.lotes.certificado_numero IS 'Número de informe de ensayo de laboratorio acreditado';
COMMENT ON COLUMN public.lotes.certificado_laboratorio_url IS 'URL de descarga del certificado oficial';
