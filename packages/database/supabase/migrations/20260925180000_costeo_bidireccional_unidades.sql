-- 20260925180000_costeo_bidireccional_unidades.sql
-- 1. Soporte de unidad explícita por línea de receta (recipe_lines.unidad).
-- 2. Conversión inteligente de unidades (g <-> kg, ml <-> l) en calcular_costo_receta.
-- 3. Vista recipe_costing_view actualizada con márgenes normalizados.

ALTER TABLE public.recipe_lines
  ADD COLUMN IF NOT EXISTS unidad TEXT CHECK (unidad IN ('g', 'kg', 'ml', 'l', 'unidad'));

-- Actualizar función de costeo con conversión de unidades
CREATE OR REPLACE FUNCTION public.calcular_costo_receta(p_recipe_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  v_unit_ratio NUMERIC;
  v_line_unit TEXT;
  v_ing_unit TEXT;
  v_factor NUMERIC;
BEGIN
  SELECT * INTO v_receta FROM recipes WHERE id = p_recipe_id AND activa = true;
  IF NOT FOUND THEN RETURN '{"error": "receta no encontrada"}'::JSONB; END IF;

  SELECT precio INTO v_precio_venta FROM productos WHERE id = v_receta.producto_id;

  FOR v_linea IN
    SELECT rl.*, i.nombre, i.precio_ref, i.unidad AS ing_unidad
    FROM recipe_lines rl
    JOIN ingredients i ON i.id = rl.ingredient_id
    WHERE rl.recipe_id = p_recipe_id
    ORDER BY rl.orden
  LOOP
    v_precio_ingrediente := COALESCE(v_linea.precio_ref, 0);
    v_line_unit := COALESCE(v_linea.unidad, v_linea.ing_unidad);
    v_ing_unit := v_linea.ing_unidad;
    v_factor := COALESCE(NULLIF(v_linea.factor_conversion, 0), 1.0);

    -- Ratio de conversión de unidades:
    -- Insumo en 'kg' y receta en 'g': ratio = 0.001
    -- Insumo en 'g' y receta en 'kg': ratio = 1000
    -- Insumo en 'l' y receta en 'ml': ratio = 0.001
    -- Insumo en 'ml' y receta en 'l': ratio = 1000
    IF v_ing_unit = 'kg' AND v_line_unit = 'g' THEN
      v_unit_ratio := 0.001;
    ELSIF v_ing_unit = 'g' AND v_line_unit = 'kg' THEN
      v_unit_ratio := 1000.0;
    ELSIF v_ing_unit = 'l' AND v_line_unit = 'ml' THEN
      v_unit_ratio := 0.001;
    ELSIF v_ing_unit = 'ml' AND v_line_unit = 'l' THEN
      v_unit_ratio := 1000.0;
    ELSE
      v_unit_ratio := 1.0;
    END IF;

    -- Costo de la línea = (cantidad * unit_ratio / factor_conversion) * precio_ref
    v_costo_linea := CEIL((v_linea.cantidad * v_unit_ratio / v_factor)::NUMERIC * v_precio_ingrediente);
    v_costo_ingredientes_total := v_costo_ingredientes_total + v_costo_linea;

    v_detalle := v_detalle || jsonb_build_object(
      'ingredient_id', v_linea.ingredient_id,
      'nombre', v_linea.nombre,
      'cantidad_receta', v_linea.cantidad,
      'unidad', v_line_unit,
      'ing_unidad', v_ing_unit,
      'estado', v_linea.estado,
      'factor_conversion', v_linea.factor_conversion,
      'cantidad_cruda', ROUND((v_linea.cantidad * v_unit_ratio / v_factor)::NUMERIC, 3),
      'precio_ref', v_precio_ingrediente,
      'costo_linea', v_costo_linea
    );
  END LOOP;

  v_costo_merma := CEIL((v_costo_ingredientes_total * v_receta.merma_pct / 100)::NUMERIC);

  v_costo_frasco := CEIL(
    (v_costo_ingredientes_total + v_costo_merma + v_receta.costo_empaque)::NUMERIC
    / NULLIF(v_receta.rendimiento_frascos, 0)
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
$$;

-- Vista con security_invoker para respetar RLS
CREATE OR REPLACE VIEW public.recipe_costing_view WITH (security_invoker = true) AS
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
FROM public.recipes r
JOIN public.productos p ON p.id = r.producto_id
WHERE r.activa = true;
