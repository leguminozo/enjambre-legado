-- Meta Ads (pixel + Conversions API) para la Tienda.
-- Row de integración: la GUI de Núcleo togglea `enabled` (kill-switch).
-- Secretos (META_CAPI_TOKEN) SIEMPRE en env de la tienda — nunca en config JSONB.
INSERT INTO public.integrations (key, name, enabled, config)
VALUES ('meta_ads', 'Meta Ads (pixel + CAPI)', false, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
