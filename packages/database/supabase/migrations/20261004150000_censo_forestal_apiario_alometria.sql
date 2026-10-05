-- ============================================================
-- Migration 20261004130000: Censo Forestal Biofísico, Apiario y Alometría 2026–2027
-- 1. Ampliación de arboles_plantados para operar como Centro de Mando:
--    - apiario_id: Vinculación con apiarios (Apiario Principal Pureo, Molulco, etc.)
--    - regimen: 'preservacion' (bosque en pie bajo custodia) vs 'reforestacion' (enriquecimiento)
--    - campana: '2026-2027' (identificador de ciclo/campaña censal)
--    - parcela: Sub-zona dentro del predio (ej: 'Ladera Este', 'Turbera Tepú', 'Ribera')
--    - dap_cm: Diámetro a la altura del pecho para modelado dendrométrico
--    - altura_m: Altura estimada del estrato arbóreo
--    - co2_anual_kg: Tasa de incremento anual calculada por alometría específica
--    - metodo_alometria: Metodología aplicada ('ipcc_afolu_chiloe_2026')
--    - notas: Bitácora u observaciones cualitativas de campo
-- 2. Índices de rendimiento para consultas por apiario, campaña y régimen.
-- ============================================================

ALTER TABLE public.arboles_plantados
  ADD COLUMN IF NOT EXISTS apiario_id UUID REFERENCES public.apiarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regimen TEXT NOT NULL DEFAULT 'preservacion'
    CHECK (regimen IN ('preservacion', 'reforestacion')),
  ADD COLUMN IF NOT EXISTS campana TEXT NOT NULL DEFAULT '2026-2027',
  ADD COLUMN IF NOT EXISTS parcela TEXT,
  ADD COLUMN IF NOT EXISTS dap_cm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS altura_m NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS co2_anual_kg NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metodo_alometria TEXT DEFAULT 'ipcc_afolu_chiloe_2026',
  ADD COLUMN IF NOT EXISTS notas TEXT;

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_apiario
  ON public.arboles_plantados(apiario_id);

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_regimen
  ON public.arboles_plantados(regimen);

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_campana
  ON public.arboles_plantados(campana);

CREATE INDEX IF NOT EXISTS idx_arboles_plantados_parcela
  ON public.arboles_plantados(parcela);

-- Comentarios documentales de integridad
COMMENT ON COLUMN public.arboles_plantados.apiario_id IS 'Apiario cuyo radio de pecoreo es abastecido o protegido por este censo forestal';
COMMENT ON COLUMN public.arboles_plantados.regimen IS 'preservacion = bosque nativo en pie custodiado; reforestacion = nuevo enriquecimiento plantado';
COMMENT ON COLUMN public.arboles_plantados.campana IS 'Ciclo o campaña de inventario territorial (ej: 2026-2027)';
COMMENT ON COLUMN public.arboles_plantados.dap_cm IS 'Diámetro a la altura del pecho medio del lote de individuos';
COMMENT ON COLUMN public.arboles_plantados.co2_anual_kg IS 'Captura activa anual estimada en kg CO2/año según alometría de Chiloé';
