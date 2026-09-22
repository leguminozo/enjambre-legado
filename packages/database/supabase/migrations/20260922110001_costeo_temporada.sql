-- Costeo por temporada: margen realizado por estación austral (12 meses).
-- Ingreso desde ventas.productos (JSONB tolerante a claves web/POS) y costo
-- desde recipe_costing_view. Solo líneas con costo conocido aportan al margen.

CREATE OR REPLACE FUNCTION public.admin_costeo_temporada()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  WITH lineas AS (
    SELECT
      CASE
        WHEN EXTRACT(MONTH FROM v.created_at) IN (12, 1, 2) THEN 'verano'
        WHEN EXTRACT(MONTH FROM v.created_at) IN (3, 4, 5) THEN 'otono'
        WHEN EXTRACT(MONTH FROM v.created_at) IN (6, 7, 8) THEN 'invierno'
        ELSE 'primavera'
      END AS temporada,
      v.id AS venta_id,
      COALESCE(
        NULLIF((item->>'productId'), ''),
        NULLIF((item->>'producto_id'), ''),
        NULLIF((item->>'id'), '')
      ) AS producto_id,
      COALESCE(
        NULLIF((item->>'quantity'), '')::INT,
        NULLIF((item->>'qty'), '')::INT,
        NULLIF((item->>'cantidad'), '')::INT,
        0
      ) AS qty,
      COALESCE(
        NULLIF((item->>'unitPrice'), '')::INT,
        NULLIF((item->>'unit_price'), '')::INT,
        NULLIF((item->>'precio_unitario'), '')::INT,
        NULLIF((item->>'price'), '')::INT,
        NULLIF((item->>'precio'), '')::INT,
        0
      ) AS precio_unit
    FROM public.ventas v,
      LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(v.productos) = 'array' THEN v.productos ELSE '[]'::jsonb END
      ) AS item
    WHERE v.created_at >= now() - INTERVAL '12 months'
      AND v.estado IN ('paid', 'confirmado', 'completada', 'despachado', 'fulfilled')
  ),
  valorizadas AS (
    SELECT
      l.temporada,
      l.qty,
      l.precio_unit,
      NULLIF(rcv.costo_frasco, '')::INT AS costo_frasco
    FROM lineas l
    LEFT JOIN public.recipe_costing_view rcv ON rcv.producto_id::TEXT = l.producto_id
    WHERE l.qty > 0
  )
  SELECT jsonb_object_agg(t.temporada, t.datos) INTO v_result
  FROM (
    SELECT
      temporada,
      jsonb_build_object(
        'ventas', (SELECT count(DISTINCT venta_id) FROM lineas l2 WHERE l2.temporada = valorizadas.temporada),
        'unidades', COALESCE(sum(qty), 0),
        'ingreso', COALESCE(sum(qty * precio_unit), 0),
        'unidades_con_costo', COALESCE(sum(CASE WHEN costo_frasco IS NOT NULL THEN qty ELSE 0 END), 0),
        'costo', COALESCE(sum(CASE WHEN costo_frasco IS NOT NULL THEN qty * costo_frasco ELSE 0 END), 0),
        'margen', COALESCE(sum(CASE WHEN costo_frasco IS NOT NULL THEN qty * (precio_unit - costo_frasco) ELSE 0 END), 0)
      ) AS datos
    FROM valorizadas
    GROUP BY temporada
  ) t;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_costeo_temporada() TO authenticated;
