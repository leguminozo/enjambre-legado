-- Cierra la carrera (race condition) en POST /api/registro-territorial/
-- apiarios/sync-desde-operativo: el select-then-insert del BFF permite que
-- dos requests concurrentes creen filas de registro duplicadas para el
-- mismo apiario operativo. Un origen operativo declara UNA fila por actor.

-- Reparación previa: si ya existen duplicados históricos, conservar la más
-- reciente y desligar el origen de las demás (la declaración manual
-- sobrevive; solo pierde el vínculo al operativo).
WITH duplicadas AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY actor_id, apiario_origen_id
           ORDER BY COALESCE(sincronizado_en, created_at) DESC, id DESC
         ) AS rn
  FROM public.apiarios_registro
  WHERE apiario_origen_id IS NOT NULL
)
UPDATE public.apiarios_registro r
SET apiario_origen_id = NULL,
    sincronizado_en = NULL
FROM duplicadas d
WHERE r.id = d.id
  AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS apiarios_registro_origen_unico_idx
  ON public.apiarios_registro (actor_id, apiario_origen_id)
  WHERE apiario_origen_id IS NOT NULL;
