-- Migration 1027: Integración bidireccional perfil-checkout (Identidad, Despacho y Facturación B2B)
-- Permite persistir teléfono y preferencia de documento tributario directamente en profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS tipo_dte_preferido TEXT DEFAULT 'boleta'
    CHECK (tipo_dte_preferido IN ('boleta', 'factura'));

COMMENT ON COLUMN public.profiles.telefono IS
  'Teléfono móvil principal del cliente o aliado para coordinación de despacho.';
COMMENT ON COLUMN public.profiles.tipo_dte_preferido IS
  'Preferencia de documento tributario: boleta o factura B2B.';
