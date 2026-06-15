-- Migración 48: Trazabilidad rápida de stock sin blockchain
-- Habilita pgcrypto para generar hashes criptográficos únicos internamente
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Modificar decrement_stock para devolver el hash de trazabilidad (blockchain_hash)
DROP FUNCTION IF EXISTS decrement_stock(UUID, INT);
CREATE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS TABLE (id UUID, stock INT, lote_id UUID, kg_restante_lote DECIMAL, traceability_hash TEXT) AS $$
DECLARE
    v_lote_id UUID;
    v_new_stock INT;
    v_kg_restante DECIMAL;
    v_hash TEXT;
BEGIN
    -- 1. Actualizar producto y obtener datos
    UPDATE productos
    SET stock = stock - p_qty
    WHERE productos.id = p_id AND (productos.stock >= p_qty)
    RETURNING productos.id, productos.stock, productos.lote_id INTO id, v_new_stock, v_lote_id;

    IF id IS NULL THEN
        RETURN;
    END IF;

    -- 2. Obtener datos del lote
    IF v_lote_id IS NOT NULL THEN
        SELECT kg_total, blockchain_hash INTO v_kg_restante, v_hash FROM lotes WHERE lotes.id = v_lote_id;
    END IF;

    RETURN QUERY SELECT id, v_new_stock, v_lote_id, v_kg_restante, v_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO authenticated;

-- 2. Crear función para agregar stock con auto-validación y generación de hash
CREATE OR REPLACE FUNCTION add_traceable_stock(p_producto_id UUID, p_qty INT)
RETURNS json AS $$
DECLARE
    v_peso_neto INT;
    v_current_stock INT;
    v_new_lote_id UUID;
    v_hash TEXT;
    v_kg_agregado DECIMAL;
BEGIN
    -- 1. Obtener producto y validar
    SELECT peso_neto_g, stock INTO v_peso_neto, v_current_stock FROM productos WHERE id = p_producto_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;

    -- 2. Generar Hash Criptográfico Único (SHA256)
    -- Concatenamos el id del producto, el tiempo actual y un salt aleatorio para unicidad garantizada
    v_hash := encode(digest(p_producto_id::text || now()::text || gen_random_uuid()::text, 'sha256'), 'hex');

    -- 3. Calcular KG (Si no tiene peso neto, asumimos 0)
    IF v_peso_neto IS NULL THEN
        v_peso_neto := 0;
    END IF;
    v_kg_agregado := (p_qty * v_peso_neto) / 1000.0;

    -- 4. Crear nuevo lote trazable
    INSERT INTO lotes (kg_total, blockchain_hash, estado)
    VALUES (v_kg_agregado, v_hash, 'disponible')
    RETURNING id INTO v_new_lote_id;

    -- 5. Actualizar el stock del producto y apuntar al nuevo lote
    UPDATE productos
    SET stock = COALESCE(stock, 0) + p_qty,
        lote_id = v_new_lote_id
    WHERE id = p_producto_id;

    -- 6. Retornar los datos del nuevo stock y hash
    RETURN json_build_object(
        'producto_id', p_producto_id,
        'stock_anterior', v_current_stock,
        'stock_nuevo', COALESCE(v_current_stock, 0) + p_qty,
        'lote_id', v_new_lote_id,
        'traceability_hash', v_hash
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_traceable_stock(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_traceable_stock(UUID, INT) TO service_role;
