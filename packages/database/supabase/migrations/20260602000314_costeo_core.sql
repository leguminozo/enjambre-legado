-- Capa 1: Fórmulas y Costeo
-- ingredients, price_observations, recipes, recipe_lines
-- + funciones de costeo automático
-- + RLS multi-tenant
-- + trigger de actualización de precio_ref

-- ============================================================
-- INGREDIENTES
-- ============================================================

CREATE TABLE ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  unidad        TEXT NOT NULL CHECK (unidad IN ('g', 'kg', 'ml', 'l', 'unidad')),
  estado_default TEXT NOT NULL CHECK (estado_default IN ('crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado')),
  categoria     TEXT,
  precio_ref    INT,
  proveedor_ref UUID REFERENCES terceros(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ,
  UNIQUE(empresa_id, nombre)
);

CREATE INDEX idx_ingredients_empresa ON ingredients(empresa_id);

-- ============================================================
-- OBSERVACIONES DE PRECIO
-- ============================================================

CREATE TABLE price_observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  proveedor_id    UUID REFERENCES terceros(id) ON DELETE SET NULL,
  precio          INT NOT NULL CHECK (precio > 0),
  unidad_reportada TEXT,
  fecha           DATE NOT NULL DEFAULT current_date,
  fuente          TEXT NOT NULL DEFAULT 'manual' CHECK (fuente IN ('manual', 'factura', 'cotizacion', 'feria', 'online')),
  notas           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_obs_ingredient ON price_observations(ingredient_id, fecha DESC);
CREATE INDEX idx_price_obs_empresa ON price_observations(empresa_id);

-- ============================================================
-- RECETAS (FÓRMULAS POR SKU)
-- ============================================================

CREATE TABLE recipes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id         UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  version             INT NOT NULL DEFAULT 1,
  rendimiento_frascos INT NOT NULL CHECK (rendimiento_frascos > 0),
  formato_frasco      TEXT NOT NULL,
  merma_pct           NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (merma_pct >= 0 AND merma_pct <= 100),
  costo_empaque       INT NOT NULL DEFAULT 0,
  activa              BOOLEAN NOT NULL DEFAULT true,
  notas               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ,
  UNIQUE(empresa_id, producto_id, version)
);

CREATE INDEX idx_recipes_producto ON recipes(producto_id);
CREATE INDEX idx_recipes_empresa ON recipes(empresa_id);

-- ============================================================
-- LÍNEAS DE RECETA (BOM)
-- ============================================================

CREATE TABLE recipe_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id         UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id     UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  cantidad          NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  estado            TEXT NOT NULL CHECK (estado IN ('crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado')),
  factor_conversion NUMERIC(8,4) NOT NULL DEFAULT 1.0,
  orden             INT NOT NULL DEFAULT 0,
  UNIQUE(recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_lines_recipe ON recipe_lines(recipe_id);

-- ============================================================
-- FUNCIÓN: calcular_costo_receta
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_costo_receta(p_recipe_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_receta RECORD;
  v_linea RECORD;
  v_precio_ingrediente INT;
  v_costo_linea INT;
  v_costo_ingredientes_total INT := 0;
  v_costo_merma INT := 0;
  v_costo_frasco INT := 0;
  v_margen_pct NUMERIC;
  v_precio_venta INT;
  v_detalle JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_receta FROM recipes WHERE id = p_recipe_id AND activa = true;
  IF NOT FOUND THEN RETURN '{"error": "receta no encontrada"}'::JSONB; END IF;

  SELECT precio INTO v_precio_venta FROM productos WHERE id = v_receta.producto_id;

  FOR v_linea IN
    SELECT rl.*, i.nombre, i.precio_ref, i.unidad
    FROM recipe_lines rl
    JOIN ingredients i ON i.id = rl.ingredient_id
    WHERE rl.recipe_id = p_recipe_id
    ORDER BY rl.orden
  LOOP
    v_precio_ingrediente := COALESCE(v_linea.precio_ref, 0);
    v_costo_linea := CEIL((v_linea.cantidad / v_linea.factor_conversion)::NUMERIC * v_precio_ingrediente);
    v_costo_ingredientes_total := v_costo_ingredientes_total + v_costo_linea;

    v_detalle := v_detalle || jsonb_build_object(
      'ingredient_id', v_linea.ingredient_id,
      'nombre', v_linea.nombre,
      'cantidad_receta', v_linea.cantidad,
      'estado', v_linea.estado,
      'factor_conversion', v_linea.factor_conversion,
      'cantidad_cruda', ROUND((v_linea.cantidad / v_linea.factor_conversion)::NUMERIC, 2),
      'precio_ref', v_precio_ingrediente,
      'costo_linea', v_costo_linea
    );
  END LOOP;

  v_costo_merma := CEIL((v_costo_ingredientes_total * v_receta.merma_pct / 100)::NUMERIC);

  v_costo_frasco := CEIL(
    (v_costo_ingredientes_total + v_costo_merma + v_receta.costo_empaque)::NUMERIC
    / v_receta.rendimiento_frascos
  );

  v_margen_pct := CASE
    WHEN v_precio_venta > 0 AND v_costo_frasco > 0
    THEN ROUND(((v_precio_venta - v_costo_frasco)::NUMERIC / v_precio_venta) * 100, 1)
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'recipe_id', p_recipe_id,
    'producto_id', v_receta.producto_id,
    'version', v_receta.version,
    'costo_ingredientes', v_costo_ingredientes_total,
    'costo_merma', v_costo_merma,
    'merma_pct', v_receta.merma_pct,
    'costo_empaque', v_receta.costo_empaque,
    'costo_total_receta', v_costo_ingredientes_total + v_costo_merma + v_receta.costo_empaque,
    'rendimiento_frascos', v_receta.rendimiento_frascos,
    'costo_por_frasco', v_costo_frasco,
    'precio_venta', v_precio_venta,
    'margen_por_frasco', v_precio_venta - v_costo_frasco,
    'margen_pct', v_margen_pct,
    'detalle', v_detalle
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- TRIGGER: actualizar precio_ref al insertar observación
-- ============================================================

CREATE OR REPLACE FUNCTION update_ingredient_precio_ref()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredients
  SET precio_ref = NEW.precio,
      updated_at = now()
  WHERE id = NEW.ingredient_id
    AND NEW.fecha >= COALESCE(
      (SELECT MAX(fecha) FROM price_observations WHERE ingredient_id = NEW.ingredient_id AND id != NEW.id),
      '1900-01-01'::date
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_precio_ref
  AFTER INSERT ON price_observations
  FOR EACH ROW EXECUTE FUNCTION update_ingredient_precio_ref();

-- ============================================================
-- VISTA: recipe_costing_view
-- ============================================================

CREATE VIEW recipe_costing_view WITH (security_invoker = true) AS
SELECT
  r.id AS recipe_id,
  r.producto_id,
  p.nombre AS producto_nombre,
  p.precio AS precio_venta,
  p.formato,
  r.version,
  r.rendimiento_frascos,
  r.merma_pct,
  r.costo_empaque,
  (calcular_costo_receta(r.id))->>'costo_por_frasco' AS costo_frasco,
  (calcular_costo_receta(r.id))->>'margen_pct' AS margen_pct,
  (calcular_costo_receta(r.id))->>'margen_por_frasco' AS margen_frasco,
  (calcular_costo_receta(r.id))->>'costo_total_receta' AS costo_total,
  r.activa,
  r.updated_at
FROM recipes r
JOIN productos p ON p.id = r.producto_id
WHERE r.activa = true;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;

-- ingredients
CREATE POLICY ingredients_select ON ingredients FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY ingredients_insert ON ingredients FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY ingredients_update ON ingredients FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY ingredients_delete ON ingredients FOR DELETE USING (has_empresa_access(empresa_id) AND is_gerente());

-- price_observations
CREATE POLICY price_obs_select ON price_observations FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY price_obs_insert ON price_observations FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY price_obs_update ON price_observations FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY price_obs_delete ON price_observations FOR DELETE USING (has_empresa_access(empresa_id) AND is_gerente());

-- recipes
CREATE POLICY recipes_select ON recipes FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY recipes_insert ON recipes FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY recipes_update ON recipes FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY recipes_delete ON recipes FOR DELETE USING (has_empresa_access(empresa_id) AND is_gerente());

-- recipe_lines
CREATE POLICY recipe_lines_select ON recipe_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id))
);
CREATE POLICY recipe_lines_insert ON recipe_lines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_gerente())
);
CREATE POLICY recipe_lines_update ON recipe_lines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_gerente())
);
CREATE POLICY recipe_lines_delete ON recipe_lines FOR DELETE USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_gerente())
);
