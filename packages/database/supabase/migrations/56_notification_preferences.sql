-- Migration 56: preferencias de notificación en profiles (JSONB, patrón theme_preference)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
  "pedidos": { "in_app": true, "email": true },
  "floracion": { "in_app": true, "email": true },
  "sistema": { "in_app": true, "email": true }
}'::jsonb;

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'Preferencias de notificación por categoría (pedidos, floracion, sistema) y canal (in_app, email)';