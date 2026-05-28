-- Migration: 27_productos_admin_management
-- Purpose: Enable full CRUD for productos table with proper RLS policies

-- Ensure productos table has all necessary columns
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS descripcion_corta TEXT,
  ADD COLUMN IF NOT EXISTS peso_netos INT,
  ADD COLUMN IF NOT EXISTS ingredientes TEXT,
  ADD COLUMN IF NOT EXISTS origen_apicola TEXT,
  ADD COLUMN IF NOT EXISTS trazabilidad_qr BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS productos_nombre_search_idx 
  ON public.productos USING gin (to_tsvector('spanish', nombre));

CREATE INDEX IF NOT EXISTS productos_visible_idx 
  ON public.productos (visible) WHERE visible = true;

CREATE INDEX IF NOT EXISTS productos_categoria_idx 
  ON public.productos (categoria) WHERE categoria IS NOT NULL;

-- RLS Policies - already exist in migration 13, but ensuring they're correct
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Everyone can read visible products
DROP POLICY IF EXISTS productos_public_read ON public.productos;
CREATE POLICY productos_public_read ON public.productos 
  FOR SELECT 
  USING (visible = true);

-- Admin roles can do everything
DROP POLICY IF EXISTS productos_admin_all ON public.productos;
CREATE POLICY productos_admin_all ON public.productos 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('gerente', 'tienda_admin', 'vendedor', 'logistica')
    )
  );

-- Grant permissions to admin roles
GRANT ALL ON public.productos TO authenticated;