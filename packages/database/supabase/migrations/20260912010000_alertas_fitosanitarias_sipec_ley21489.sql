-- Ley 21.489 Art. 29 y Res. Exenta SAG 7.068/2024:
-- Campos para integración con SIPEC Apícola y trazabilidad de aviso legal de 48h.
ALTER TABLE public.alertas_fitosanitarias
  ADD COLUMN IF NOT EXISTS origen_aviso TEXT NOT NULL DEFAULT 'local'
    CHECK (origen_aviso IN ('local', 'sipec_sag', 'ordenanza_comunal')),
  ADD COLUMN IF NOT EXISTS sipec_aviso_id TEXT,
  ADD COLUMN IF NOT EXISTS cumple_anticipacion_48h BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.alertas_fitosanitarias.origen_aviso IS 'Origen del aviso: reporte local, integración SIPEC Apícola SAG, u ordenanza municipal.';
COMMENT ON COLUMN public.alertas_fitosanitarias.sipec_aviso_id IS 'Identificador oficial del aviso fitosanitario en el sistema SIPEC Apícola del SAG si aplica.';
COMMENT ON COLUMN public.alertas_fitosanitarias.cumple_anticipacion_48h IS 'Verificación del cumplimiento de la anticipación mínima de 48 horas exigida por el Art. 29 de la Ley 21.489.';
