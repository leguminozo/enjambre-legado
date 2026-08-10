-- =============================================================================
-- Taxonomías de producto: formatos y categorías gestionables desde Nucleo
--
-- Antes vivían como constantes hardcodeadas (PRODUCT_FORMATS / PRODUCT_CATEGORIES
-- en apps/nucleo/src/lib/product-types.ts). Ahora son tablas admin-only: el
-- admin las crea/edita/desactiva desde Mercado → Productos → Formatos y Categorías.
--
-- Decisiones de diseño:
--   · `productos.formato` / `productos.categoria` siguen siendo TEXT libres
--     (sin FK): renombrar un label o desactivar un valor nunca rompe productos
--     existentes; el valor histórico se conserva en la fila del producto.
--   · `value` es el identificador que se graba en productos (ej. '30x15g') y
--     es inmutable en edición; `label` es lo que se muestra en los selects.
--   · `active` = soft delete: si un valor está en uso, el panel lo desactiva
--     en vez de borrarlo (mantiene el historial de catálogo).
--   · RLS patrón migration 1000: solo admin gestiona; lectura para
--     authenticated (catálogo de tienda no requiere auth).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_formats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_formats_active_order_idx
  ON public.product_formats (active, sort_order);
CREATE INDEX IF NOT EXISTS product_categories_active_order_idx
  ON public.product_categories (active, sort_order);

-- updated_at automático (patrón migraciones 1011/14/21: trigger por tabla)
CREATE OR REPLACE FUNCTION public.touch_product_taxonomy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_formats_touch_updated_at ON public.product_formats;
CREATE TRIGGER product_formats_touch_updated_at
  BEFORE UPDATE ON public.product_formats
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_taxonomy_updated_at();

DROP TRIGGER IF EXISTS product_categories_touch_updated_at ON public.product_categories;
CREATE TRIGGER product_categories_touch_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_taxonomy_updated_at();

-- Seed: estado actual de las constantes (preserva el comportamiento existente)
INSERT INTO public.product_formats (value, label, sort_order) VALUES
  ('500g',   '500g - Frasco tradicional', 10),
  ('250g',   '250g - Frasco pequeño',     20),
  ('1kg',    '1kg - Frasco familiar',     30),
  ('30x15g', '30x15g - Sachets individual', 40),
  ('10x15g', '10x15g - Sachets pack',     50),
  ('Panal',  'Panal natural',             60),
  ('Cofre',  'Cofre regalo',              70),
  ('Kit',    'Kit degustación',           80)
ON CONFLICT (value) DO NOTHING;

INSERT INTO public.product_categories (value, label, sort_order) VALUES
  ('miel',      'Miel',       10),
  ('polen',     'Polen',      20),
  ('propoleo',  'Propóleo',   30),
  ('jalea',     'Jalea Real', 40),
  ('ceras',     'Ceras',      50),
  ('cofres',    'Cofres',     60),
  ('accesorios','Accesorios', 70)
ON CONFLICT (value) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.product_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Catálogo legible por cualquier usuario autenticado; gestión solo admin.
DROP POLICY IF EXISTS product_formats_select_p ON public.product_formats;
CREATE POLICY product_formats_select_p ON public.product_formats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_formats_admin_all_p ON public.product_formats;
CREATE POLICY product_formats_admin_all_p ON public.product_formats
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS product_categories_select_p ON public.product_categories;
CREATE POLICY product_categories_select_p ON public.product_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_categories_admin_all_p ON public.product_categories;
CREATE POLICY product_categories_admin_all_p ON public.product_categories
  FOR ALL USING (public.is_admin());

GRANT SELECT ON public.product_formats TO authenticated;
GRANT SELECT ON public.product_categories TO authenticated;
