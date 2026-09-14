-- Migration: Fix get_ecosystem_metrics RPC
-- Context: Uses v.productos instead of non-existent v.items, with safe array parsing and robust exception handling.
-- Follows CONSTITUTION.md: STABLE SECURITY DEFINER SET search_path = ''.

CREATE OR REPLACE FUNCTION public.get_ecosystem_metrics()
RETURNS json AS $$
DECLARE
  v_arboles_total integer;
  v_co2_ton numeric;
  v_especies integer;
  v_sectores integer;
  v_colmenas_total integer;
  v_apiarios_total integer;
  v_irr_ecosistema numeric;
  v_co2_capturado_kg numeric;
  v_co2_emitido_kg numeric;
  v_productos_activos integer;
  v_azucar_sustituida_g numeric;
  v_co2_evitado_total_kg numeric;
  v_anos_legado text;
  v_ventas_total_kg numeric := 0;
BEGIN
  SELECT COALESCE(SUM(cantidad), 0), COALESCE(SUM(co2_ton), 0), COUNT(DISTINCT especie), COUNT(DISTINCT sector)
  INTO v_arboles_total, v_co2_ton, v_especies, v_sectores
  FROM public.arboles_plantados;

  SELECT COUNT(*) INTO v_colmenas_total FROM public.colmenas;
  SELECT COUNT(*) INTO v_apiarios_total FROM public.apiarios;
  SELECT COUNT(*) INTO v_productos_activos FROM public.productos WHERE visible = true;

  -- Calcular impacto real basado en ventas (productos JSONB)
  BEGIN
    SELECT 
      COALESCE(SUM(
        COALESCE(NULLIF(regexp_replace(item->>'cantidad', '[^0-9]', '', 'g'), '')::INT, 1) * 
        COALESCE(p.peso_neto_g, 500)
      ), 0) / 1000.0
    INTO v_ventas_total_kg
    FROM public.ventas v
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(v.productos::jsonb) = 'array' THEN v.productos::jsonb
        WHEN jsonb_typeof(v.productos::jsonb->'lines') = 'array' THEN (v.productos::jsonb->'lines')
        ELSE '[]'::jsonb
      END
    ) AS item
    JOIN public.productos p ON p.id = CAST(item->>'producto_id' AS UUID)
    WHERE v.estado IN ('completada', 'pagado');
  EXCEPTION WHEN OTHERS THEN
    v_ventas_total_kg := 0;
  END;

  v_co2_evitado_total_kg := ROUND(v_ventas_total_kg * 2.4, 2);
  v_azucar_sustituida_g := ROUND(v_ventas_total_kg * 1000.0, 2);

  SELECT COALESCE(SUM(co2_capturado_kg), 0), COALESCE(SUM(co2_emitido_kg), 0)
  INTO v_co2_capturado_kg, v_co2_emitido_kg
  FROM public.irr_records;

  v_anos_legado := '2008–' || EXTRACT(YEAR FROM NOW())::text;

  IF v_co2_emitido_kg > 0 THEN
    v_irr_ecosistema := ROUND(v_co2_capturado_kg / v_co2_emitido_kg, 2);
  ELSE
    v_irr_ecosistema := NULL;
  END IF;

  RETURN json_build_object(
    'arboles_total', v_arboles_total,
    'co2_ton', v_co2_ton,
    'especies_nativas', v_especies,
    'sectores', v_sectores,
    'colmenas_total', v_colmenas_total,
    'apiarios_total', v_apiarios_total,
    'irr_ecosistema', v_irr_ecosistema,
    'co2_capturado_kg', v_co2_capturado_kg,
    'co2_emitido_kg', v_co2_emitido_kg,
    'productos_activos', v_productos_activos,
    'azucar_sustituida_g', v_azucar_sustituida_g,
    'co2_evitado_total_kg', v_co2_evitado_total_kg,
    'anos_legado', v_anos_legado,
    'kg_miel_regenerada', v_ventas_total_kg
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_ecosystem_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ecosystem_metrics() TO anon, authenticated, service_role;
