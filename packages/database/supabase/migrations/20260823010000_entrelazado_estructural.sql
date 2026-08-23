-- =============================================================================
-- Entrelazado estructural del Registro Territorial — auditoría 2026-08-23
-- 1. n_colmenas en vivo: apiarios_registro.n_colmenas se refresca con trigger
--    en colmenas (INSERT/UPDATE/DELETE) vía apiarios.apiario_registro_id.
-- 2. apiarios_registro.predio_id: un apiario residente puede declararse en un
--    predio facilitador (capas que antes no se tocaban).
-- 3. calendario_tasks.alerta_id + índice único parcial: trazabilidad e
--    idempotencia del acuse (confirmar no duplica tareas de resguardo).
-- 4. Índice alertas_fitosanitarias(zona) + config_censo.created_at.
-- =============================================================================

-- ── 1. n_colmenas en vivo ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_apiario_registro_n_colmenas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ids uuid[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.apiario_id IS NULL THEN RETURN OLD; END IF;
    v_ids := ARRAY[OLD.apiario_id];
  ELSE
    v_ids := ARRAY[NEW.apiario_id];
    IF TG_OP = 'UPDATE' AND OLD.apiario_id IS DISTINCT FROM NEW.apiario_id THEN
      IF OLD.apiario_id IS NOT NULL THEN
        v_ids := v_ids || ARRAY[OLD.apiario_id];
      END IF;
      IF NEW.apiario_id IS NULL THEN
        -- Desvincular: la colmena deja el apiario viejo; unnest(NULL) no
        -- matchea, así que filtramos el null antes del UPDATE.
        v_ids := ARRAY[OLD.apiario_id];
      END IF;
    END IF;
  END IF;

  UPDATE public.apiarios_registro ar
  SET n_colmenas = (
        SELECT count(*) FROM public.colmenas c
        WHERE c.apiario_id = v
      ),
      sincronizado_en = now()
  FROM unnest(v_ids) AS v
  WHERE ar.apiario_origen_id = v
    AND v IS NOT NULL;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_apiario_registro_n_colmenas() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_apiario_registro_n_colmenas ON public.colmenas;
CREATE TRIGGER trg_apiario_registro_n_colmenas
  AFTER INSERT OR UPDATE OF apiario_id OR DELETE ON public.colmenas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_apiario_registro_n_colmenas();

-- Backfill: alinear el snapshot con el estado vivo actual.
UPDATE public.apiarios_registro ar
SET n_colmenas = (
  SELECT count(*) FROM public.colmenas c
  WHERE c.apiario_id = ar.apiario_origen_id
),
sincronizado_en = now()
WHERE ar.apiario_origen_id IS NOT NULL;

-- ── 2. predio_id en apiarios_registro ────────────────────────────────────────
ALTER TABLE public.apiarios_registro
  ADD COLUMN IF NOT EXISTS predio_id UUID
    REFERENCES public.predios_facilitadores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS apiarios_registro_predio_idx
  ON public.apiarios_registro (predio_id);

-- ── 3. alerta_id + idempotencia en calendario_tasks ──────────────────────────
ALTER TABLE public.calendario_tasks
  ADD COLUMN IF NOT EXISTS alerta_id UUID
    REFERENCES public.alertas_fitosanitarias(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS calendario_tasks_alerta_colmena_unico_idx
  ON public.calendario_tasks (user_id, alerta_id, colmena_id)
  WHERE alerta_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS calendario_tasks_alerta_idx
  ON public.calendario_tasks (alerta_id)
  WHERE alerta_id IS NOT NULL;

-- ── 4. Índices y timestamps menores ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS alertas_fitosanitarias_zona_idx
  ON public.alertas_fitosanitarias (zona);

ALTER TABLE public.config_censo
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.apiarios_registro.predio_id IS
  'Predio facilitador donde opera el apiario (auditoría entrelazado 2026-08-23).';
COMMENT ON COLUMN public.calendario_tasks.alerta_id IS
  'Alerta fitosanitaria que originó la tarea de resguardo (idempotencia + trazabilidad).';