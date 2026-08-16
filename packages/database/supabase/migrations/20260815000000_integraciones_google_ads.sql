-- Google Ads (gtag + conversión Purchase) para la Tienda.
-- Row de integración: la GUI de Núcleo togglea `enabled` (kill-switch).
-- El conversion ID es público (NEXT_PUBLIC_GOOGLE_ADS_ID). No hay token de servidor.
INSERT INTO public.integrations (key, name, enabled, config)
VALUES ('google_ads', 'Google Ads (gtag + conversión)', false, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
