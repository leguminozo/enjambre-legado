-- Migration: Add arboles_personal to public.profiles
-- Context: Required by customer profile in Tienda (apps/tienda/app/perfil/layout.tsx).
-- Restores parity with initial schema definition and prevents 400 Bad Request on customer profile.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS arboles_personal INT DEFAULT 0;

COMMENT ON COLUMN public.profiles.arboles_personal IS 'Contador de árboles vinculados o aportados por el usuario a través de compras o membresías.';
