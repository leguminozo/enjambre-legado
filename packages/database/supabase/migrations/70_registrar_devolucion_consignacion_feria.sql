-- 70: Devolución de stock consignado — simetría con migración 68
-- Ver docs/RED_INTERCAMBIO_LEGAL.md §5

CREATE OR REPLACE FUNCTION public.registrar_devolucion_consignacion_feria(
  p_consignacion_id UUID,
  p_cantidad NUMERIC,
  p_reponer_almacen BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_pendiente NUMERIC;
  v_stock INT;
  v_is_admin BOOLEAN := public.is_admin();
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  SELECT
    pc.id,
    pc.evento_id,
    pc.producto_id,
    pc.cantidad_entregada,
    pc.cantidad_vendida,
    pc.cantidad_devuelta,
    e.estado AS evento_estado,
    c.user_id AS operador_user_id,
    c.estado AS contrato_estado
  INTO v_row
  FROM participante_consignacion pc
  JOIN participante_evento e ON e.id = pc.evento_id
  JOIN participante_contrato c ON c.id = e.contrato_id
  WHERE pc.id = p_consignacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CONSIGNACION_NOT_FOUND';
  END IF;

  IF v_row.evento_estado = 'cerrado' THEN
    RAISE EXCEPTION 'EVENTO_CERRADO';
  END IF;

  IF v_is_admin THEN
    NULL;
  ELSIF v_row.operador_user_id = auth.uid()
        AND v_row.contrato_estado = 'activo'
        AND v_row.evento_estado = 'en_curso' THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  v_pendiente := v_row.cantidad_entregada - v_row.cantidad_vendida - v_row.cantidad_devuelta;

  IF v_pendiente < p_cantidad THEN
    RAISE EXCEPTION 'PENDIENTE_INSUFFICIENT: % disponible, % solicitado', v_pendiente, p_cantidad;
  END IF;

  UPDATE participante_consignacion
  SET cantidad_devuelta = cantidad_devuelta + p_cantidad
  WHERE id = p_consignacion_id
    AND (cantidad_entregada - cantidad_vendida - cantidad_devuelta) >= p_cantidad
  RETURNING
    cantidad_devuelta,
    (cantidad_entregada - cantidad_vendida - cantidad_devuelta) INTO v_row.cantidad_devuelta, v_pendiente;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PENDIENTE_INSUFFICIENT';
  END IF;

  IF p_reponer_almacen AND v_row.producto_id IS NOT NULL THEN
    UPDATE productos
    SET stock = COALESCE(stock, 0) + p_cantidad::int
    WHERE id = v_row.producto_id
    RETURNING stock INTO v_stock;
  END IF;

  RETURN jsonb_build_object(
    'consignacion_id', p_consignacion_id,
    'cantidad_devuelta_total', v_row.cantidad_devuelta,
    'pendiente_restante', v_pendiente,
    'stock_almacen', v_stock,
    'reponer_almacen', p_reponer_almacen AND v_row.producto_id IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_devolucion_consignacion_feria(UUID, NUMERIC, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.registrar_devolucion_consignacion_feria IS
  'Registra devolución física de consignación feria. Admin en eventos abiertos; operador solo en su evento en_curso. Opcionalmente repone productos.stock.';