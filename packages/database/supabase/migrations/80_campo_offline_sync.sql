-- Migration 80: Campo offline sync force stock decrement

CREATE OR REPLACE FUNCTION public.decrement_stock_force(p_id UUID, p_qty INT)
RETURNS TABLE (id UUID, stock INT, lote_id UUID, kg_restante_lote DECIMAL) AS $$
DECLARE
    v_new_stock INT;
    v_lote_id UUID;
    v_kg DECIMAL;
BEGIN
    UPDATE productos
    SET stock = stock - p_qty
    WHERE productos.id = p_id
    RETURNING productos.stock, productos.lote_id INTO v_new_stock, v_lote_id;

    IF v_new_stock IS NULL THEN
        RETURN QUERY SELECT p_id, 0, NULL::UUID, 0.0::DECIMAL;
        RETURN;
    END IF;

    v_kg := 0;
    IF v_lote_id IS NOT NULL THEN
        SELECT kg_restante INTO v_kg FROM lotes WHERE lotes.id = v_lote_id;
    END IF;

    RETURN QUERY SELECT p_id, v_new_stock, v_lote_id, COALESCE(v_kg, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_stock_force(UUID, INT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_force(UUID, INT) FROM authenticated, anon;
