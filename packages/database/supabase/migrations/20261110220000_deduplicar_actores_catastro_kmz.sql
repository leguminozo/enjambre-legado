-- Migration: Deduplicar y normalizar actores territoriales pre-cargados (Catastro KMZ Chiloé)
-- Consolida registros duplicados no reclamados (user_id IS NULL) donde el nombre del actor
-- coincide case-insensitively en la misma comuna (ej. 'Jaime Ivan Rogel Barrientos' vs 'JAIME IVAN ROGEL BARRIENTOS').
-- Reasigna o limpia apiarios duplicados y normaliza los nombres en mayúsculas sostenidas a formato Nombre Propio.

DO $$
DECLARE
  rec RECORD;
  dup_rec RECORD;
BEGIN
  -- 1. Iterar sobre grupos de actores no reclamados con nombres y comunas equivalentes
  FOR rec IN (
    SELECT
      LOWER(TRIM(nombre_actor)) AS norm_name,
      LOWER(TRIM(comuna)) AS norm_comuna,
      -- Conservar el que tenga formato no-mayúscula sostenida, o el más antiguo
      (ARRAY_AGG(id ORDER BY (nombre_actor = UPPER(nombre_actor)) ASC, created_at ASC))[1] AS canonical_id
    FROM public.actores_registro
    WHERE user_id IS NULL
    GROUP BY LOWER(TRIM(nombre_actor)), LOWER(TRIM(comuna))
    HAVING COUNT(*) > 1
  ) LOOP
    FOR dup_rec IN (
      SELECT id
      FROM public.actores_registro
      WHERE user_id IS NULL
        AND LOWER(TRIM(nombre_actor)) = rec.norm_name
        AND LOWER(TRIM(comuna)) = rec.norm_comuna
        AND id <> rec.canonical_id
    ) LOOP
      -- Eliminar apiarios redundantes con el mismo nombre en el canónico
      DELETE FROM public.apiarios_registro
      WHERE actor_id = dup_rec.id
        AND nombre IN (
          SELECT nombre FROM public.apiarios_registro WHERE actor_id = rec.canonical_id
        );

      -- Reasignar apiarios no repetidos al actor canónico
      UPDATE public.apiarios_registro
      SET actor_id = rec.canonical_id
      WHERE actor_id = dup_rec.id;

      -- Eliminar el registro duplicado del actor
      DELETE FROM public.actores_registro
      WHERE id = dup_rec.id;
    END LOOP;
  END LOOP;

  -- 2. Normalizar a formato Nombre Propio cualquier actor no reclamado que haya quedado en MAYÚSCULAS sostenidas
  UPDATE public.actores_registro
  SET nombre_actor = INITCAP(LOWER(nombre_actor))
  WHERE user_id IS NULL
    AND nombre_actor = UPPER(nombre_actor)
    AND LENGTH(nombre_actor) > 2;

END $$;
