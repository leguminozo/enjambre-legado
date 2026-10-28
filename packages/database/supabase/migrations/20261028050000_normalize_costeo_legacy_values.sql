-- Normalización histórica de costos truncados por separador de miles (ej. "4.500" -> 4)
-- y recetas formuladas por 1 unidad que quedaron con rendimiento de lote (ej. 661 o 4356).

-- 1. Corregir costos unitarios truncados en inventario operativo para insumos por kg o litro
UPDATE public.inventario_items
SET costo_unitario = ROUND(costo_unitario * 1000)
WHERE unidad IN ('kg', 'l')
  AND costo_unitario >= 1
  AND costo_unitario < 50;

-- 2. Corregir precios de referencia truncados en ingredientes por kg o litro
UPDATE public.ingredients
SET precio_ref = ROUND(precio_ref * 1000),
    updated_at = NOW()
WHERE unidad IN ('kg', 'l')
  AND precio_ref >= 1
  AND precio_ref < 50;

-- 3. Alinear precio_ref de ingredientes con su ítem de inventario vinculado
UPDATE public.ingredients AS ing
SET precio_ref = inv.costo_unitario,
    updated_at = NOW()
FROM public.inventario_items AS inv
WHERE inv.ingredient_id = ing.id
  AND inv.activo = TRUE
  AND inv.costo_unitario > 0
  AND COALESCE(ing.precio_ref, 0) <> inv.costo_unitario;

-- 4. Normalizar recetas cuyas líneas BOM corresponden a 1 unidad de venta pero tenían rendimiento de lote
WITH recipe_totals AS (
  SELECT
    r.id AS recipe_id,
    r.rendimiento_frascos,
    SUM(
      CASE
        WHEN LOWER(COALESCE(rl.unidad, i.unidad, '')) IN ('kg', 'l') THEN rl.cantidad * 1000.0
        WHEN LOWER(COALESCE(rl.unidad, i.unidad, '')) IN ('g', 'ml') THEN rl.cantidad
        ELSE 0
      END
    ) AS total_gramos_ml
  FROM public.recipes r
  JOIN public.recipe_lines rl ON rl.recipe_id = r.id
  LEFT JOIN public.ingredients i ON i.id = rl.ingredient_id
  WHERE r.activa = TRUE
    AND r.rendimiento_frascos > 1
  GROUP BY r.id, r.rendimiento_frascos
)
UPDATE public.recipes AS r
SET rendimiento_frascos = 1,
    updated_at = NOW()
FROM recipe_totals rt
WHERE r.id = rt.recipe_id
  AND rt.total_gramos_ml > 0
  AND rt.total_gramos_ml <= 100
  AND rt.rendimiento_frascos > 10;

-- 5. Eliminar ingredientes huérfanos que no existen en Inventario → Insumos ni son usados en recetas
DELETE FROM public.ingredients AS ing
WHERE NOT EXISTS (
  SELECT 1
  FROM public.inventario_items inv
  WHERE inv.ingredient_id = ing.id
    AND inv.activo = TRUE
    AND inv.clase = 'insumo'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.recipe_lines rl
  WHERE rl.ingredient_id = ing.id
);
