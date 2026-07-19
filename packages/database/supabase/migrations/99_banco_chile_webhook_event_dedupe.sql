-- 99: Unique event key for Banco Chile webhook idempotency
-- descripcion holds `event:{id}` for inbound webhooks

CREATE UNIQUE INDEX IF NOT EXISTS banco_chile_notificaciones_event_key_uidx
  ON public.banco_chile_notificaciones (empresa_id, descripcion)
  WHERE descripcion LIKE 'event:%';

COMMENT ON INDEX public.banco_chile_notificaciones_event_key_uidx IS
  'Webhook dedupe: one row per (empresa, event:{id})';
