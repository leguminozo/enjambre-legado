-- 1012: datos documentales mínimos en movimientos de inventario
-- (orientación funcional: factura / orden / comprobante — no DTE legal completo)

ALTER TABLE public.inventario_movimientos
  ADD COLUMN IF NOT EXISTS doc_tipo TEXT
    CHECK (doc_tipo IS NULL OR doc_tipo IN (
      'factura', 'boleta', 'guia', 'orden_compra', 'comprobante', 'otro'
    )),
  ADD COLUMN IF NOT EXISTS doc_numero TEXT,
  ADD COLUMN IF NOT EXISTS doc_fecha DATE;

COMMENT ON COLUMN public.inventario_movimientos.doc_tipo IS
  'Tipo documental de referencia (funcional, no fiscal completo)';
COMMENT ON COLUMN public.inventario_movimientos.doc_numero IS
  'Nº factura / orden / comprobante asociado al movimiento';
COMMENT ON COLUMN public.inventario_movimientos.doc_fecha IS
  'Fecha del documento de referencia';

-- Ampliar RPC para aceptar documentos opcionales
CREATE OR REPLACE FUNCTION public.inventario_aplicar_movimiento(
  p_item_id UUID,
  p_tipo TEXT,
  p_cantidad NUMERIC,
  p_motivo TEXT DEFAULT NULL,
  p_ref_tipo TEXT DEFAULT NULL,
  p_ref_id TEXT DEFAULT NULL,
  p_doc_tipo TEXT DEFAULT NULL,
  p_doc_numero TEXT DEFAULT NULL,
  p_doc_fecha DATE DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock NUMERIC;
  v_nuevo NUMERIC;
  v_uid UUID := auth.uid();
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad inválida' USING ERRCODE = '22023';
  END IF;
  IF p_tipo NOT IN ('entrada', 'salida', 'ajuste', 'merma') THEN
    RAISE EXCEPTION 'tipo inválido' USING ERRCODE = '22023';
  END IF;

  SELECT stock INTO v_stock
  FROM public.inventario_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ítem no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF p_tipo = 'entrada' THEN
    v_nuevo := v_stock + p_cantidad;
  ELSIF p_tipo = 'ajuste' THEN
    v_nuevo := p_cantidad;
  ELSE
    v_nuevo := v_stock - p_cantidad;
    IF v_nuevo < 0 THEN
      RAISE EXCEPTION 'stock insuficiente' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.inventario_items
  SET stock = v_nuevo
  WHERE id = p_item_id;

  INSERT INTO public.inventario_movimientos (
    item_id, user_id, tipo, cantidad, stock_antes, stock_despues,
    motivo, ref_tipo, ref_id, doc_tipo, doc_numero, doc_fecha
  ) VALUES (
    p_item_id,
    v_uid,
    p_tipo,
    CASE WHEN p_tipo = 'ajuste' THEN ABS(v_nuevo - v_stock) ELSE p_cantidad END,
    v_stock,
    v_nuevo,
    p_motivo,
    p_ref_tipo,
    p_ref_id,
    p_doc_tipo,
    NULLIF(trim(p_doc_numero), ''),
    p_doc_fecha
  );

  RETURN json_build_object(
    'item_id', p_item_id,
    'stock_antes', v_stock,
    'stock_despues', v_nuevo,
    'tipo', p_tipo
  );
END;
$$;

-- Re-grant (signature cambió)
REVOKE EXECUTE ON FUNCTION public.inventario_aplicar_movimiento(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
-- Nueva firma 9 args
GRANT EXECUTE ON FUNCTION public.inventario_aplicar_movimiento(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, DATE)
  TO authenticated, service_role;
