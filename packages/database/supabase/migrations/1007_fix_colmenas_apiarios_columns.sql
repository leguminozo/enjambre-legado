-- =============================================================================
-- Migration 1007: Saneamiento de columnas escritas por el código vivo
-- El código (ApiarioManager, ColmenaFicha, ApicultorView) escribe:
--   apiarios:  name, health, details
--   colmenas:  health, user_id
-- Las políticas RLS de inspecciones/varroa_records/peso_records usan user_id.
-- Estas columnas existen en la BD real (agregadas manualmente) pero nunca se
-- canonicaron en el esquema. Se agregan aquí con IF NOT EXISTS (idempotente).
-- =============================================================================

ALTER TABLE apiarios
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS health TEXT,
  ADD COLUMN IF NOT EXISTS details TEXT;

ALTER TABLE colmenas
  ADD COLUMN IF NOT EXISTS health TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Las policies de 01_rls_policies.sql ya referencian user_id en estas tablas.
ALTER TABLE inspecciones
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fase del ciclo de vida de la bitácora (docs/BITACORA_APICOLA.md §1):
-- núcleo → traspaso → alza → cosecha → invernada → nueva temporada.
ALTER TABLE inspecciones
  ADD COLUMN IF NOT EXISTS fase TEXT
  CHECK (fase IN ('nucleo', 'traspaso', 'alza', 'cosecha', 'invernada', 'temporada'));

ALTER TABLE varroa_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE peso_records
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN apiarios.name IS 'Nombre del apiario (escribe ApiarioManager; el schema canónico usa nombre).';
COMMENT ON COLUMN apiarios.health IS 'Estado de salud del apiario (escribe ApiarioManager).';
COMMENT ON COLUMN apiarios.details IS 'Detalles/notas del apiario (escribe ApiarioManager).';
COMMENT ON COLUMN colmenas.health IS 'Estado de salud informado por el código vivo (ApiarioManager/ColmenaFicha).';
COMMENT ON COLUMN colmenas.user_id IS 'Ownership para RLS (policy colmenas_select).';
COMMENT ON COLUMN inspecciones.user_id IS 'Ownership para RLS (policy inspecciones_select).';
COMMENT ON COLUMN varroa_records.user_id IS 'Ownership para RLS (policy varroa_select).';
COMMENT ON COLUMN peso_records.user_id IS 'Ownership para RLS (policy peso_select).';
