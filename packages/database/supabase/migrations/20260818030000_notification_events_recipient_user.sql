-- Inbox por destinatario, no por autor.
-- created_by se usaba como hack (= userId del receptor). Eso mezclaba
-- "quién emitió" con "quién debe ver" y la campana no podía mostrar
-- alertas del sistema.

ALTER TABLE public.notification_events
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.notification_events
SET recipient_user_id = created_by
WHERE recipient_user_id IS NULL
  AND created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_events_recipient_user_created
  ON public.notification_events (recipient_user_id, created_at DESC)
  WHERE channel = 'in_app';

DROP POLICY IF EXISTS notification_events_select ON public.notification_events;
CREATE POLICY notification_events_select ON public.notification_events
  FOR SELECT USING (
    public.is_gerente()
    OR public.current_role() = 'admin'
    OR recipient_user_id = auth.uid()
    OR (recipient_user_id IS NULL AND created_by = auth.uid())
  );
