-- =============================================================================
-- Migration: 20261026040000_product_sensory_families_taxonomy.sql
--
-- Taxonomías de producto dinámicas: Familias Sensoriales de Cata y Reseñas
-- (product_sensory_families) gestionables desde Núcleo (Mercado → Taxonomías).
--
-- Elimina los arrays y restricciones CHECK hardcodeadas en base de datos
-- para permitir crear, editar, reordenar y desactivar/eliminar familias
-- sensoriales sin requerir despliegues ni migraciones manuales.
-- =============================================================================

-- ── 1. Tabla de Familias Sensoriales Dinámicas ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_sensory_families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value       TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INT  NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_sensory_families_active_order_idx
  ON public.product_sensory_families (active, sort_order);

-- updated_at automático
DROP TRIGGER IF EXISTS product_sensory_families_touch_updated_at ON public.product_sensory_families;
CREATE TRIGGER product_sensory_families_touch_updated_at
  BEFORE UPDATE ON public.product_sensory_families
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_taxonomy_updated_at();

-- Seed inicial de familias canónicas
INSERT INTO public.product_sensory_families (value, label, description, sort_order) VALUES
  ('miel',             'Miel Cruda Pura',       'Monofloral o bosque nativo',                   10),
  ('miel_fortificada', 'Miel Fortificada',      'Con polen floral, avellana o cacao crudo',      20),
  ('hidromiel',        'Hidromiel de Bosque',   'Fermentación salvaje viva',                    30),
  ('extracto',         'Extractos & Tinturas',  'Propóleo concentrado y resinas',               40),
  ('cosmetica',        'Cosmética Apícola',     'Bálsamos, cremas y ceras',                     50),
  ('infusion',         'Infusiones & Botánica', 'Infusiones del bosque nativo y hierbas',       60)
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- ── 2. Eliminar restricciones CHECK hardcodeadas ─────────────────────────────
ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_tipo_sensorial_check;
ALTER TABLE public.resenas_producto DROP CONSTRAINT IF EXISTS resenas_producto_tipo_sensorial_check;

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.product_sensory_families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_sensory_families_select_p ON public.product_sensory_families;
CREATE POLICY product_sensory_families_select_p ON public.product_sensory_families
  FOR SELECT USING (true);

DROP POLICY IF EXISTS product_sensory_families_admin_all_p ON public.product_sensory_families;
CREATE POLICY product_sensory_families_admin_all_p ON public.product_sensory_families
  FOR ALL USING (public.is_admin());

GRANT SELECT ON public.product_sensory_families TO anon, authenticated;
