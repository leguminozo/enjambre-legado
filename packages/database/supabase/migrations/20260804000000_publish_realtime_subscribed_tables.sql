-- =============================================================================
-- Publicar en supabase_realtime las tablas que el código suscribe vía
-- postgres_changes pero que nunca se agregaron a la publicación → el realtime
-- de PipelineView, FeriaMonitorView, CMS admin y los badges del sidebar estaba
-- muerto en silencio (SUBSCRIBED pero sin eventos).
-- Patrón idéntico a 20260601072818_enable_realtime.sql y 58_carrito_items_realtime.sql.
-- =============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_leads;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tareas;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.destilaciones;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.calendario_eventos;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.participante_evento;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.participante_arqueo;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_codes;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.creadores;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
