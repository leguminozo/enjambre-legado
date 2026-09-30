-- =============================================================================
-- Podado definitivo de supabase_realtime.
-- La poda anterior (20260908120000) usaba una sola sentencia
-- ALTER PUBLICATION ... DROP TABLE a, b, c ... envuelta en WHEN OTHERS:
-- si cualquier tabla de la lista no estaba en la publicación, la sentencia
-- completa fallaba y se tragaba el error → ninguna tabla se eliminaba.
-- Aquí se itera y se elimina tabla por tabla.
--
-- Conserva únicamente las tablas que el código suscribe vía postgres_changes:
--   carrito_items       (carrito multi-dispositivo, tienda)
--   notification_events (campana de notificaciones, 3 apps)
--   ventas              (monitor de feria / caja, núcleo)
--   eventos             (monitor de feria, núcleo) — re-agregada abajo por si
--                       la poda anterior la quitó de refilón.
-- =============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_publication p
    JOIN pg_publication_rel pr ON pr.prpubid = p.oid
    JOIN pg_class c ON c.oid = pr.prrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname <> ALL (
        ARRAY['carrito_items', 'notification_events', 'ventas', 'eventos']
      )
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
  END LOOP;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END;
$$;
