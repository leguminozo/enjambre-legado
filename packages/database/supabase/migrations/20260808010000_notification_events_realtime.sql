-- ============================================================
-- Migration 20260808010000: publicar notification_events en supabase_realtime
--
-- useInAppNotifications (packages/auth) se suscribe vía postgres_changes a
-- notification_events con filter created_by=eq.<userId>, pero la tabla nunca
-- se agregó a la publicación → el realtime de la campana de notificaciones
-- (tienda header + sidebar perfil, nucleo, campo) estaba muerto en silencio
-- (SUBSCRIBED pero sin eventos), igual que crm_leads/crm_tareas/eventos antes
-- de 20260804000000. El fetch inicial seguía funcionando; las notificaciones
-- nuevas requerían recarga manual.
-- Patrón idéntico a 20260804000000_publish_realtime_subscribed_tables.sql.
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

-- Índice para el fetch del hook (eq created_by + order created_at desc) y el
-- filtro realtime created_by=eq.<userId>.
CREATE INDEX IF NOT EXISTS idx_notification_events_created_by_created_at
  ON public.notification_events (created_by, created_at DESC);
