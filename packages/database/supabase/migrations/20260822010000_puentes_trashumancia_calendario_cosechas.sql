-- Puentes bidireccionales restantes (auditoría de entrelazado):
-- 1. Trashumancia ↔ operativo: una declaración de ingreso puede materializarse
--    como apiario operativo; ambos lados conocen su contraparte.
-- 2. Calendario ↔ colmenas: tarea anclable a una colmena real (el TEXT libre se
--    conserva para legado).
-- 3. Integridad: cosechas.lote_id deja de ser UUID suelto y referencia lotes.

-- ── 1. Trashumancia ↔ operativo ──────────────────────────────────────────────
ALTER TABLE public.apiarios_externos
  ADD COLUMN IF NOT EXISTS apiario_operativo_id UUID
    REFERENCES public.apiarios(id) ON DELETE SET NULL;

ALTER TABLE public.apiarios
  ADD COLUMN IF NOT EXISTS origen_externo_id UUID
    REFERENCES public.apiarios_externos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS apiarios_externos_operativo_idx
  ON public.apiarios_externos (apiario_operativo_id);
CREATE INDEX IF NOT EXISTS apiarios_origen_externo_idx
  ON public.apiarios (origen_externo_id);

-- ── 2. Calendario ↔ colmenas (aditivo; colmena TEXT queda para legado) ───────
ALTER TABLE public.calendario_tasks
  ADD COLUMN IF NOT EXISTS colmena_id UUID
    REFERENCES public.colmenas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS calendario_tasks_colmena_id_idx
  ON public.calendario_tasks (colmena_id);

-- ── 3. Integridad referencial cosecha → lote ─────────────────────────────────
UPDATE public.cosechas
SET lote_id = NULL
WHERE lote_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.lotes l WHERE l.id = cosechas.lote_id);

ALTER TABLE public.cosechas
  DROP CONSTRAINT IF EXISTS cosechas_lote_id_fkey;

ALTER TABLE public.cosechas
  ADD CONSTRAINT cosechas_lote_id_fkey
  FOREIGN KEY (lote_id) REFERENCES public.lotes(id) ON DELETE SET NULL;
