-- Migration: commercial_channels_and_products
-- Purpose: Añadir canales de publicación a productos y ampliar canales_aplicables en descuentos (incluye club)

-- 1. Agregar columna channels a productos con default '{tienda,campo}'
ALTER TABLE public.productos 
  ADD COLUMN IF NOT EXISTS channels text[] DEFAULT '{tienda,campo}'::text[];

-- Índice GIN para búsquedas eficientes por canal (tienda, campo, club, b2b)
CREATE INDEX IF NOT EXISTS idx_productos_channels 
  ON public.productos USING gin(channels);

-- Backfill seguro para productos existentes sin canales
UPDATE public.productos 
SET channels = '{tienda,campo}'::text[] 
WHERE channels IS NULL;

-- 2. Actualizar constraint de canales_aplicables en descuentos para permitir 'club'
DO $$
BEGIN
  ALTER TABLE public.descuentos DROP CONSTRAINT IF EXISTS descuentos_canales_aplicables_check;
  ALTER TABLE public.descuentos ADD CONSTRAINT descuentos_canales_aplicables_check CHECK (
    canales_aplicables IS NULL OR (
      array_position(canales_aplicables, 'web') IS NOT NULL OR
      array_position(canales_aplicables, 'local') IS NOT NULL OR
      array_position(canales_aplicables, 'feria') IS NOT NULL OR
      array_position(canales_aplicables, 'delivery') IS NOT NULL OR
      array_position(canales_aplicables, 'club') IS NOT NULL
    )
  );
EXCEPTION
  WHEN others THEN NULL;
END $$;
