-- Migración 46: Sincronización de Stock y Peso entre Productos y Lotes
-- Permite que al vender un producto (unidades) se descuente el peso correspondiente del lote (kg)

-- 1. Añadir peso_neto_g a productos si no existe
ALTER TABLE productos ADD COLUMN IF NOT EXISTS peso_neto_g INT DEFAULT 0;
COMMENT ON COLUMN productos.peso_neto_g IS 'Peso neto del producto en gramos para descontar del stock del lote en kg.';

-- 2. Función para actualizar el stock del lote atómicamente
CREATE OR REPLACE FUNCTION update_lote_stock_from_product()
RETURNS TRIGGER AS $$
DECLARE
    peso_total_descontar_kg DECIMAL;
BEGIN
    -- Solo si el stock disminuyó y el producto tiene un lote asociado
    IF (OLD.stock > NEW.stock) AND (NEW.lote_id IS NOT NULL) AND (NEW.peso_neto_g > 0) THEN
        peso_total_descontar_kg := (OLD.stock - NEW.stock) * NEW.peso_neto_g / 1000.0;
        
        UPDATE lotes
        SET kg_total = GREATEST(0, kg_total - peso_total_descontar_kg)
        WHERE id = NEW.lote_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger en productos
DROP TRIGGER IF EXISTS trg_sync_lote_stock ON productos;
CREATE TRIGGER trg_sync_lote_stock
AFTER UPDATE OF stock ON productos
FOR EACH ROW
EXECUTE FUNCTION update_lote_stock_from_product();

-- 4. Mejorar decrement_stock para ser más robusto y devolver más info
DROP FUNCTION IF EXISTS decrement_stock(UUID, INT);
CREATE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS TABLE (id UUID, stock INT, lote_id UUID, kg_restante_lote DECIMAL) AS $$
DECLARE
    v_lote_id UUID;
    v_new_stock INT;
    v_kg_restante DECIMAL;
BEGIN
    -- 1. Actualizar producto y obtener datos
    UPDATE productos
    SET stock = stock - p_qty
    WHERE productos.id = p_id AND (productos.stock >= p_qty)
    RETURNING productos.id, productos.stock, productos.lote_id INTO id, v_new_stock, v_lote_id;

    IF id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Obtener kg_total del lote (el trigger ya lo actualizó)
    SELECT kg_total INTO v_kg_restante FROM lotes WHERE lotes.id = v_lote_id;

    RETURN QUERY SELECT id, v_new_stock, v_lote_id, v_kg_restante;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO service_role;

-- 5. Actualizar get_ecosystem_metrics para incluir impacto de ventas
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
  v_ventas_total_kg numeric;
BEGIN
  SELECT COALESCE(SUM(cantidad), 0), COALESCE(SUM(co2_ton), 0), COUNT(DISTINCT especie), COUNT(DISTINCT sector)
  INTO v_arboles_total, v_co2_ton, v_especies, v_sectores
  FROM arboles_plantados;

  SELECT COUNT(*) INTO v_colmenas_total FROM colmenas;
  SELECT COUNT(*) INTO v_apiarios_total FROM apiarios;

  -- Calcular impacto real basado en ventas
  -- CO2 evitado: 1kg miel vs azucar = 2.4kg CO2 evitado (valor referencia proyecto)
  SELECT 
    COALESCE(SUM(CAST(item->>'cantidad' AS INT) * CAST(p.peso_neto_g AS INT)), 0) / 1000.0
  INTO v_ventas_total_kg
  FROM ventas v, jsonb_array_elements(v.items) AS item
  JOIN productos p ON p.id = CAST(item->>'producto_id' AS UUID)
  WHERE v.estado IN ('completada', 'pagado');

  v_co2_evitado_total_kg := v_ventas_total_kg * 2.4;
  v_azucar_sustituida_g := v_ventas_total_kg * 1000.0;

  SELECT COALESCE(SUM(co2_capturado_kg), 0), COALESCE(SUM(co2_emitido_kg), 0)
  INTO v_co2_capturado_kg, v_co2_emitido_kg
  FROM irr_records;

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
    'azucar_sustituida_g', v_azucar_sustituida_g,
    'co2_evitado_total_kg', v_co2_evitado_total_kg,
    'anos_legado', v_anos_legado,
    'kg_miel_regenerada', v_ventas_total_kg
  );
END;
$$ LANGUAGE plpgsql STABLE;
