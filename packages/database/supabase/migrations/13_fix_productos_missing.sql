-- Migration: 13_fix_productos_missing
-- Purpose: Ensure the productos table exists and is correctly exposed in the schema cache.
-- This handles the case where migration 00 might have failed or the table was accidentally dropped.

-- 1. Ensure 'lotes' exists (dependency)
CREATE TABLE IF NOT EXISTS public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosecha_ids UUID[],
  kg_total DECIMAL,
  blockchain_hash TEXT UNIQUE,
  arboles_asociados INT,
  estado TEXT DEFAULT 'disponible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure 'productos' exists
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  descripcion_regenerativa TEXT,
  precio INT,
  stock INT,
  formato TEXT,
  lote_id UUID REFERENCES public.lotes(id),
  fotos TEXT[],
  video_url TEXT,
  visible BOOLEAN DEFAULT true,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Re-assert slug index (from migration 03)
CREATE UNIQUE INDEX IF NOT EXISTS productos_slug_unique
  ON public.productos (slug)
  WHERE slug IS NOT NULL AND slug <> '';

-- 4. Re-assert RLS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Idempotencia para políticas
DROP POLICY IF EXISTS productos_read ON public.productos;
CREATE POLICY productos_read ON public.productos FOR SELECT USING (true);

DROP POLICY IF EXISTS productos_write ON public.productos;
CREATE POLICY productos_write ON public.productos FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'gerente' OR role = 'tienda_admin')
    )
  );

-- 5. Force schema cache refresh by adding/updating a comment
COMMENT ON TABLE public.productos IS 'Catálogo de productos de Enjambre Legado';
