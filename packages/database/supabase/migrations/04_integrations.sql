-- Integraciones / fuentes de datos del ecosistema (boletas, bancos, SII, notificaciones, etc.)
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seeds mínimos (solo si no existen)
INSERT INTO public.integrations (key, name, enabled)
VALUES
  ('boletas', 'Boletas (DTE/ERP)', false),
  ('bancos', 'Bancos (conciliación)', false),
  ('sii', 'SII (servicios)', false),
  ('notificaciones', 'Notificaciones (APIs)', false)
ON CONFLICT (key) DO NOTHING;

