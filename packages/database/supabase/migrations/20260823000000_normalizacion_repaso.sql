-- =============================================================================
-- Normalización post-repaso (auditoría 2026-08-23):
-- 1. Índice para cosechas.lote_id (FK nueva sin índice → seq scan en joins).
-- 2. Limpieza de policies legacy en apiarios ("Users can * own apiarios"):
--    redundantes con las canónicas (apiarios_select/insert/update/delete),
--    sin bypass admin y con nombre genérico. Se dropean; las canónicas mandan.
-- 3. apiarios_insert unificado a is_gerente() (coherencia con el resto de
--    policies de apiarios/colmenas que usan is_gerente, no is_admin).
-- 4. updated_at en apiarios, colmenas, calendario_tasks (el resto del
--    ecosistema lo tiene; falta para el entrelazado sincronizado_en y
--    auditoría de cambios).
-- =============================================================================

-- ── 1. Índice FK cosechas.lote_id ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cosechas_lote_id
  ON public.cosechas (lote_id);

-- ── 2. Policies legacy de apiarios (redundantes) ────────────────────────────
DROP POLICY IF EXISTS "Users can view own apiarios" ON public.apiarios;
DROP POLICY IF EXISTS "Users can insert own apiarios" ON public.apiarios;
DROP POLICY IF EXISTS "Users can update own apiarios" ON public.apiarios;
DROP POLICY IF EXISTS "Users can delete own apiarios" ON public.apiarios;

-- ── 3. apiarios_insert coherente con is_gerente() ───────────────────────────
-- Nota: la BD viva NO tiene created_by (la mig 20250614 crea policies por
-- rama condicional; el remoto cayó en la rama user_id-only). Por eso la
-- policy nueva usa solo user_id + is_gerente().
DROP POLICY IF EXISTS apiarios_insert ON public.apiarios;
CREATE POLICY apiarios_insert ON public.apiarios
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_gerente()
  );

-- ── 4. updated_at en apiarios, colmenas, calendario_tasks ───────────────────
ALTER TABLE public.apiarios
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.calendario_tasks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apiarios_updated_at ON public.apiarios;
CREATE TRIGGER apiarios_updated_at
  BEFORE UPDATE ON public.apiarios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS colmenas_updated_at ON public.colmenas;
CREATE TRIGGER colmenas_updated_at
  BEFORE UPDATE ON public.colmenas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS calendario_tasks_updated_at ON public.calendario_tasks;
CREATE TRIGGER calendario_tasks_updated_at
  BEFORE UPDATE ON public.calendario_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Backfill de updated_at con el valor de created_at (no hay historial previo).
UPDATE public.apiarios SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.colmenas SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.calendario_tasks SET updated_at = created_at WHERE updated_at IS NULL;