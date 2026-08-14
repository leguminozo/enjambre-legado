-- =============================================================================
-- Batch de decremento de stock para POS multi-línea (rep-ventas /quick).
-- El BFF llamaba decrement_stock_force una vez por línea de carrito (N RPCs
-- seriales). Esta variante procesa el array en una sola llamada: una sola
-- sentencia SQL, atómica por statement (cualquier error revierte todo).
-- Semántica por ítem idéntica a decrement_stock_force: producto inexistente
-- devuelve fila con stock 0 (el cliente lo registra como sobregiro, no error).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.decrement_stock_force_batch(p_items JSONB)
RETURNS TABLE (id UUID, stock INT, lote_id UUID, kg_restante_lote DECIMAL) AS $$
DECLARE
    v_item JSONB;
    v_id UUID;
    v_qty INT;
    v_new_stock INT;
    v_lote_id UUID;
    v_kg DECIMAL;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_id := (v_item->>'id')::UUID;
        v_qty := (v_item->>'qty')::INT;

        UPDATE productos
        SET stock = stock - v_qty
        WHERE productos.id = v_id
        RETURNING productos.stock, productos.lote_id INTO v_new_stock, v_lote_id;

        IF v_new_stock IS NULL THEN
            RETURN QUERY SELECT v_id, 0, NULL::UUID, 0.0::DECIMAL;
            CONTINUE;
        END IF;

        v_kg := 0;
        IF v_lote_id IS NOT NULL THEN
            SELECT kg_restante INTO v_kg FROM lotes WHERE lotes.id = v_lote_id;
        END IF;

        RETURN QUERY SELECT v_id, v_new_stock, v_lote_id, COALESCE(v_kg, 0);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_stock_force_batch(JSONB) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_force_batch(JSONB) FROM authenticated, anon;
