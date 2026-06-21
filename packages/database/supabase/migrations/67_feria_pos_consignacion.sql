-- 67: Campo POS ↔ consignación feria + trazabilidad venta
-- Ver docs/RED_INTERCAMBIO_LEGAL.md §5

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS participante_evento_id UUID
  REFERENCES public.participante_evento(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_participante_evento
  ON public.ventas(participante_evento_id)
  WHERE participante_evento_id IS NOT NULL;

COMMENT ON COLUMN public.ventas.participante_evento_id IS
  'Evento feria activo al momento de la venta POS (channel=feria).';

-- Valida stock consignado pendiente antes de confirmar venta feria
CREATE OR REPLACE FUNCTION public.validar_consignacion_feria(
  p_user_id UUID,
  p_items JSONB,
  p_channel TEXT DEFAULT 'feria'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento_id UUID;
  v_item JSONB;
  v_producto_id UUID;
  v_qty NUMERIC;
  v_consignacion RECORD;
  v_pendiente NUMERIC;
  v_errors JSONB := '[]'::jsonb;
BEGIN
  IF p_channel IS DISTINCT FROM 'feria' THEN
    RETURN jsonb_build_object('required', false, 'ok', true);
  END IF;

  SELECT e.id INTO v_evento_id
  FROM participante_evento e
  JOIN participante_contrato c ON c.id = e.contrato_id
  WHERE c.user_id = p_user_id
    AND c.estado = 'activo'
    AND e.estado = 'en_curso'
  ORDER BY e.fecha_inicio DESC NULLS LAST
  LIMIT 1;

  IF v_evento_id IS NULL THEN
    RETURN jsonb_build_object('required', false, 'ok', true, 'reason', 'no_evento_en_curso');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_qty := COALESCE((v_item->>'cantidad')::numeric, 0);

    IF v_qty <= 0 THEN CONTINUE; END IF;

    SELECT * INTO v_consignacion
    FROM participante_consignacion
    WHERE evento_id = v_evento_id AND producto_id = v_producto_id
    LIMIT 1;

    IF NOT FOUND THEN
      v_errors := v_errors || jsonb_build_object(
        'producto_id', v_producto_id,
        'error', 'sin_consignacion',
        'message', 'Producto no consignado para este evento'
      );
      CONTINUE;
    END IF;

    v_pendiente := v_consignacion.cantidad_entregada
      - v_consignacion.cantidad_vendida
      - v_consignacion.cantidad_devuelta;

    IF v_pendiente < v_qty THEN
      v_errors := v_errors || jsonb_build_object(
        'producto_id', v_producto_id,
        'error', 'stock_insuficiente',
        'pendiente', v_pendiente,
        'solicitado', v_qty
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object(
      'required', true,
      'ok', false,
      'evento_id', v_evento_id,
      'errors', v_errors
    );
  END IF;

  RETURN jsonb_build_object('required', true, 'ok', true, 'evento_id', v_evento_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validar_consignacion_feria TO authenticated;

-- Aplica venta: descuenta consignación y vincula venta al evento feria.
-- Comisión rep: commission_records (trigger ventas) → incentivo_unificado_view.
CREATE OR REPLACE FUNCTION public.aplicar_venta_feria_post_venta(
  p_user_id UUID,
  p_venta_id UUID,
  p_items JSONB,
  p_total NUMERIC,
  p_channel TEXT DEFAULT 'feria'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento_id UUID;
  v_contrato_id UUID;
  v_comision_pct NUMERIC;
  v_item JSONB;
  v_producto_id UUID;
  v_qty NUMERIC;
  v_consignacion_id UUID;
  v_updates JSONB := '[]'::jsonb;
BEGIN
  IF p_channel IS DISTINCT FROM 'feria' THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'not_feria_channel');
  END IF;

  SELECT e.id, c.id, c.comision_base_pct
  INTO v_evento_id, v_contrato_id, v_comision_pct
  FROM participante_evento e
  JOIN participante_contrato c ON c.id = e.contrato_id
  WHERE c.user_id = p_user_id
    AND c.estado = 'activo'
    AND e.estado = 'en_curso'
  ORDER BY e.fecha_inicio DESC NULLS LAST
  LIMIT 1;

  IF v_evento_id IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'no_evento_en_curso');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_qty := COALESCE((v_item->>'cantidad')::numeric, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    UPDATE participante_consignacion
    SET cantidad_vendida = cantidad_vendida + v_qty
    WHERE evento_id = v_evento_id
      AND producto_id = v_producto_id
      AND (cantidad_entregada - cantidad_vendida - cantidad_devuelta) >= v_qty
    RETURNING id INTO v_consignacion_id;

    IF v_consignacion_id IS NULL THEN
      RAISE EXCEPTION 'CONSIGNACION_INSUFFICIENT';
    END IF;

    v_updates := v_updates || jsonb_build_object(
      'consignacion_id', v_consignacion_id,
      'producto_id', v_producto_id,
      'cantidad', v_qty
    );
  END LOOP;

  UPDATE ventas
  SET participante_evento_id = v_evento_id
  WHERE id = p_venta_id;

  RETURN jsonb_build_object(
    'applied', true,
    'evento_id', v_evento_id,
    'contrato_id', v_contrato_id,
    'comision_pct_contrato', v_comision_pct,
    'updates', v_updates
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aplicar_venta_feria_post_venta TO authenticated;

-- Revierte consignación si falla rollback de venta
CREATE OR REPLACE FUNCTION public.revertir_consignacion_feria(
  p_evento_id UUID,
  p_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_producto_id UUID;
  v_qty NUMERIC;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_qty := COALESCE((v_item->>'cantidad')::numeric, 0);
    IF v_qty <= 0 THEN CONTINUE; END IF;

    UPDATE participante_consignacion
    SET cantidad_vendida = GREATEST(0, cantidad_vendida - v_qty)
    WHERE evento_id = p_evento_id AND producto_id = v_producto_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revertir_consignacion_feria TO authenticated;