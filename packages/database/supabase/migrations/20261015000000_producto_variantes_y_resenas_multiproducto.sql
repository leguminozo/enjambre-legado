-- =============================================================================
-- Migration: 20261015000000_producto_variantes_y_resenas_multiproducto.sql
--
-- 1. Crea la tabla relacional `producto_variantes` para formalizar fortificaciones
--    (polen, avellana, cacao, café), formatos (25g cata, 250g, 500g) y ediciones.
-- 2. Extiende `resenas_producto` de forma aditiva:
--    - `variante_id`: permite que las reseñas se vinculen a la variante exacta.
--    - `tipo_sensorial`: 'miel', 'miel_fortificada', 'hidromiel', 'extracto', 'cosmetica', 'infusion'.
--    - `atributos_sensoriales`: JSONB polimórfico validado por Zod para cada matriz.
-- 3. Extiende `perc_sesiones` con `variante_id` y `tipo_sensorial`.
-- 4. Extiende `perc_chip_catalogos` con `categoria_producto` para filtrar chips.
-- 5. Preserva 100% de compatibilidad con reseñas y sesiones históricas.
-- =============================================================================

-- ── 1. Tabla de Variantes y Fortificaciones de Producto ──────────────────────
CREATE TABLE IF NOT EXISTS public.producto_variantes (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id                UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  sku                        TEXT NOT NULL UNIQUE,
  nombre_variante            TEXT NOT NULL,
  tipo_variante              TEXT NOT NULL CHECK (tipo_variante IN ('formato', 'fortificacion', 'edicion_especial', 'pack')),
  ingrediente_fortificante   TEXT CHECK (
    ingrediente_fortificante IS NULL OR ingrediente_fortificante IN (
      'polen_floral', 'cacao_crudo', 'avellana_chilena', 'panal_virgen', 'ninguno'
    )
  ),
  peso_neto_g                INT NOT NULL DEFAULT 0,
  precio_override            INT, -- Nullable: si es null, hereda precio del producto padre
  stock                      INT NOT NULL DEFAULT 0,
  activo                     BOOLEAN NOT NULL DEFAULT true,
  perfil_sensorial_override  JSONB DEFAULT NULL,
  sort_order                 INT NOT NULL DEFAULT 0,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_producto_variantes_producto
  ON public.producto_variantes (producto_id, sort_order)
  WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_producto_variantes_sku
  ON public.producto_variantes (sku);

-- Trigger para updated_at automático
DROP TRIGGER IF EXISTS tr_touch_producto_variantes_updated_at ON public.producto_variantes;
CREATE TRIGGER tr_touch_producto_variantes_updated_at
  BEFORE UPDATE ON public.producto_variantes
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_taxonomy_updated_at();

-- RLS
ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS producto_variantes_select_p ON public.producto_variantes;
CREATE POLICY producto_variantes_select_p ON public.producto_variantes
  FOR SELECT USING (activo = true OR public.is_admin());

DROP POLICY IF EXISTS producto_variantes_admin_all_p ON public.producto_variantes;
CREATE POLICY producto_variantes_admin_all_p ON public.producto_variantes
  FOR ALL USING (public.is_admin());

GRANT SELECT ON public.producto_variantes TO anon, authenticated;


-- ── 2. Extensión aditiva de resenas_producto ─────────────────────────────────
ALTER TABLE public.resenas_producto
  ADD COLUMN IF NOT EXISTS variante_id UUID REFERENCES public.producto_variantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_sensorial TEXT NOT NULL DEFAULT 'miel'
    CHECK (tipo_sensorial IN ('miel', 'miel_fortificada', 'hidromiel', 'extracto', 'cosmetica', 'infusion')),
  ADD COLUMN IF NOT EXISTS atributos_sensoriales JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_resenas_producto_variante
  ON public.resenas_producto (variante_id, created_at DESC)
  WHERE estado = 'aprobada' AND variante_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resenas_producto_tipo_sensorial
  ON public.resenas_producto (tipo_sensorial);

COMMENT ON COLUMN public.resenas_producto.variante_id IS
  'Variante o fortificación evaluada (opcional: null si reseña al producto padre general).';

COMMENT ON COLUMN public.resenas_producto.tipo_sensorial IS
  'Familia sensorial: miel, miel_fortificada, hidromiel, extracto, cosmetica, infusion.';

COMMENT ON COLUMN public.resenas_producto.atributos_sensoriales IS
  'Matriz polimórfica de percepción validada por Zod según tipo_sensorial.';


-- ── 3. Extensión aditiva de perc_sesiones ────────────────────────────────────
ALTER TABLE public.perc_sesiones
  ADD COLUMN IF NOT EXISTS variante_id UUID REFERENCES public.producto_variantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo_sensorial TEXT NOT NULL DEFAULT 'miel';

CREATE INDEX IF NOT EXISTS idx_perc_sesiones_variante
  ON public.perc_sesiones (variante_id);


-- ── 4. Extensión de perc_chip_catalogos por categoría ────────────────────────
ALTER TABLE public.perc_chip_catalogos
  ADD COLUMN IF NOT EXISTS categoria_producto TEXT NOT NULL DEFAULT 'miel';

-- Ajustar unicidad para permitir descriptores por categoría
ALTER TABLE public.perc_chip_catalogos
  DROP CONSTRAINT IF EXISTS perc_chip_catalogos_bloque_chip_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_perc_chip_catalogos_unique
  ON public.perc_chip_catalogos (bloque, chip, categoria_producto);

CREATE INDEX IF NOT EXISTS idx_perc_chips_categoria
  ON public.perc_chip_catalogos (categoria_producto, bloque, activo);

-- Sembrar descriptores especializados para otras familias
INSERT INTO public.perc_chip_catalogos (bloque, chip, categoria_producto, sort_order) VALUES
  ('sabor', 'seco', 'hidromiel', 10),
  ('sabor', 'semiseco', 'hidromiel', 20),
  ('sabor', 'acidez_viva', 'hidromiel', 30),
  ('sabor', 'tanico', 'hidromiel', 40),
  ('aroma', 'levadura_salvaje', 'hidromiel', 10),
  ('aroma', 'manzana_silvestre', 'hidromiel', 20),
  ('aroma', 'roble_austral', 'hidromiel', 30),
  ('textura', 'petillant', 'hidromiel', 10),
  ('textura', 'espumosa', 'hidromiel', 20),
  ('textura', 'tranquila', 'hidromiel', 30),
  ('sabor', 'balsamico', 'extracto', 10),
  ('sabor', 'pungente', 'extracto', 20),
  ('sabor', 'astringente', 'extracto', 30),
  ('aroma', 'resina_bosque', 'extracto', 10),
  ('aroma', 'eucaliptol_nativo', 'extracto', 20),
  ('textura', 'absorcion_rapida', 'cosmetica', 10),
  ('textura', 'sedosa_nutritiva', 'cosmetica', 20),
  ('textura', 'oclusiva_protectora', 'cosmetica', 30)
ON CONFLICT DO NOTHING;


-- ── 5. Seed inicial de Variantes Canónicas para Crema de Miel ────────────────
DO $$
DECLARE
  v_prod_id UUID;
BEGIN
  -- Buscar si existe un producto de crema de miel por slug o nombre
  SELECT id INTO v_prod_id
  FROM public.productos
  WHERE slug IN ('crema-de-miel', 'crema-miel', 'miel-cremada')
     OR nombre ILIKE '%crema de miel%'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_prod_id IS NOT NULL THEN
    -- Formatos de mesa / degustación (25g)
    INSERT INTO public.producto_variantes (
      producto_id, sku, nombre_variante, tipo_variante, ingrediente_fortificante, peso_neto_g, sort_order
    ) VALUES
      (v_prod_id, 'CM-VIRGEN-25G', 'Miel Virgen con Trocito de Panal (25g)', 'formato', 'panal_virgen', 25, 10),
      (v_prod_id, 'CM-POLEN-25G', 'Crema de Miel con Polen Floral (25g)', 'fortificacion', 'polen_floral', 25, 20),
      (v_prod_id, 'CM-AVELLANA-25G', 'Crema de Miel con Avellana Chilena (25g)', 'fortificacion', 'avellana_chilena', 25, 30),
      (v_prod_id, 'CM-CACAO-25G', 'Crema de Miel con Nibs de Cacao Crudo (25g)', 'fortificacion', 'cacao_crudo', 25, 40),
      -- Formatos de venta tradicional (250g)
      (v_prod_id, 'CM-VIRGEN-250G', 'Miel Virgen con Trocito de Panal (250g)', 'formato', 'panal_virgen', 250, 50),
      (v_prod_id, 'CM-POLEN-250G', 'Crema de Miel con Polen Floral (250g)', 'fortificacion', 'polen_floral', 250, 60),
      (v_prod_id, 'CM-AVELLANA-250G', 'Crema de Miel con Avellana Chilena Tostada y Molida (250g)', 'fortificacion', 'avellana_chilena', 250, 70),
      (v_prod_id, 'CM-CACAO-250G', 'Crema de Miel con Nibs de Cacao Crudo (250g)', 'fortificacion', 'cacao_crudo', 250, 80)
    ON CONFLICT (sku) DO NOTHING;
  END IF;
END $$;
