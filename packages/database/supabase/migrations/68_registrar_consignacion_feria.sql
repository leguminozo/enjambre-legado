-- 68: Consignación admin descuenta stock de almacén atómicamente
-- Ver docs/RED_INTERCAMBIO_LEGAL.md §5

CREATE OR REPLACE FUNCTION public.registrar_consignacion_feria(
  p_evento_id UUID,
  p_producto_id UUID,
  p_cantidad NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento RECORD;
  v_stock INT;
  v_total_consignado NUMERIC;
  v_existing RECORD;
  v_consignacion_id UUID;
  v_merged BOOLEAN := false;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN: solo admin puede registrar consignación';
  END IF;

  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  SELECT e.id, e.estado, c.tope_stock_consignado
  INTO v_evento
  FROM participante_evento e
  JOIN participante_contrato c ON c.id = e.contrato_id
  WHERE e.id = p_evento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENTO_NOT_FOUND';
  END IF;

  IF v_evento.estado = 'cerrado' THEN
    RAISE EXCEPTION 'EVENTO_CERRADO';
  END IF;

  SELECT stock INTO v_stock
  FROM productos
  WHERE id = p_producto_id AND COALESCE(visible, true) = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCTO_NOT_FOUND';
  END IF;

  IF v_stock IS NOT NULL AND v_stock < p_cantidad THEN
    RAISE EXCEPTION 'STOCK_INSUFFICIENT: % disponible, % solicitado', v_stock, p_cantidad;
  END IF;

  SELECT COALESCE(SUM(cantidad_entregada - cantidad_devuelta), 0)
  INTO v_total_consignado
  FROM participante_consignacion
  WHERE evento_id = p_evento_id;

  IF COALESCE(v_evento.tope_stock_consignado, 0) > 0
     AND (v_total_consignado + p_cantidad) > v_evento.tope_stock_consignado THEN
    RAISE EXCEPTION 'TOPE_CONSIGNACION_EXCEDIDO';
  END IF;

  UPDATE productos
  SET stock = stock - p_cantidad::int
  WHERE id = p_producto_id
    AND (stock IS NULL OR stock >= p_cantidad::int)
  RETURNING stock INTO v_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STOCK_INSUFFICIENT';
  END IF;

  SELECT * INTO v_existing
  FROM participante_consignacion
  WHERE evento_id = p_evento_id AND producto_id = p_producto_id
  LIMIT 1;

  IF FOUND THEN
    v_merged := true;
    UPDATE participante_consignacion
    SET cantidad_entregada = cantidad_entregada + p_cantidad
    WHERE id = v_existing.id
    RETURNING id INTO v_consignacion_id;
  ELSE
    INSERT INTO participante_consignacion (evento_id, producto_id, cantidad_entregada)
    VALUES (p_evento_id, p_producto_id, p_cantidad)
    RETURNING id INTO v_consignacion_id;
  END IF;

  RETURN jsonb_build_object(
    'consignacion_id', v_consignacion_id,
    'stock_restante', v_stock,
    'cantidad_registrada', p_cantidad,
    'merged', v_merged
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_consignacion_feria(UUID, UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.registrar_consignacion_feria IS
  'Admin registra consignación feria y descuenta productos.stock en una transacción.';