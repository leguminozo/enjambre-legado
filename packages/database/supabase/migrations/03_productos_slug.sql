-- Añade slug para rutas SEO-friendly y búsqueda.
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Slug único cuando exista.
CREATE UNIQUE INDEX IF NOT EXISTS productos_slug_unique
  ON public.productos (slug)
  WHERE slug IS NOT NULL AND slug <> '';

