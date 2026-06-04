-- ============================================================
-- Migration 36: RPC get_ecosystem_metrics()
-- Aggregated ecosystem metrics for landing, impacto, ciencia
-- ============================================================

CREATE OR REPLACE FUNCTION get_ecosystem_metrics()
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
BEGIN
  SELECT COALESCE(SUM(cantidad), 0), COALESCE(SUM(co2_ton), 0), COUNT(DISTINCT especie), COUNT(DISTINCT sector)
  INTO v_arboles_total, v_co2_ton, v_especies, v_sectores
  FROM arboles_plantados;

  SELECT COUNT(*) INTO v_colmenas_total FROM colmenas;
  SELECT COUNT(*) INTO v_apiarios_total FROM apiarios;

  SELECT COALESCE(SUM(co2_capturado_kg), 0), COALESCE(SUM(co2_emitido_kg), 0)
  INTO v_co2_capturado_kg, v_co2_emitido_kg
  FROM irr_records;

  SELECT COUNT(*), COALESCE(SUM(sustituye_azucar_g), 0), COALESCE(SUM(co2_evitado_kg), 0)
  INTO v_productos_activos, v_azucar_sustituida_g, v_co2_evitado_total_kg
  FROM productos WHERE visible = true;

  v_anos_legado := '2008–2026';

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
    'anos_legado', v_anos_legado
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_ecosystem_metrics IS 'Agrega métricas del ecosistema: árboles, CO₂, colmenas, IRR. Para landing, impacto, ciencia.';
