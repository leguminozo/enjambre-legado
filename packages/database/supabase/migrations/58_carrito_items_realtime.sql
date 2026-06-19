-- Migration 58: Realtime en carrito_items (sync cross-tab / cross-dispositivo)

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.carrito_items;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;