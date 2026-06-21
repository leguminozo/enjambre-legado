-- 69: Parche Zero-Trust — roles, RPCs SECURITY DEFINER, claim ventas POS
-- Ver auditoría ofensiva jun 2026

-- ═══ 1. SIGNUP: nunca confiar en user_metadata.role ═══
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'cliente'
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, '', 'cliente');
  RETURN NEW;
END;
$$;

-- ═══ 2. profiles.role inmutable salvo admin ═══
CREATE OR REPLACE FUNCTION public.guard_profiles_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'ROLE_IMMUTABLE';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_role ON public.profiles;
CREATE TRIGGER trg_guard_profiles_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profiles_role();

-- ═══ 3. solicitar_retiro_creador — solo el propio creador ═══
CREATE OR REPLACE FUNCTION public.solicitar_retiro_creador(
  p_user_id UUID,
  p_monto NUMERIC,
  p_metodo_pago TEXT,
  p_datos_pago JSONB
)
RETURNS TABLE(id UUID, monto_solicitado NUMERIC, estado TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creador_id UUID;
  v_balance NUMERIC;
  v_retiros_pendientes INT;
  v_caps JSONB;
  v_puede_retirar BOOLEAN;
  v_tope_mensual NUMERIC;
  v_retirado_mes NUMERIC;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT c.id, c.capabilities
  INTO v_creador_id, v_caps
  FROM public.creadores c
  WHERE c.user_id = p_user_id AND c.estado = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_CREATOR';
  END IF;

  v_puede_retirar := COALESCE((v_caps->>'puede_retirar')::boolean, true);
  IF NOT v_puede_retirar THEN
    RAISE EXCEPTION 'RETIROS_DISABLED';
  END IF;

  v_tope_mensual := COALESCE((v_caps->>'tope_retiro_mensual')::numeric, 500000);

  PERFORM pg_advisory_xact_lock(hashtext(v_creador_id::text));

  SELECT balance_disponible INTO v_balance
  FROM public.creador_balance_view
  WHERE creador_id = v_creador_id;

  IF v_balance < p_monto THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  SELECT COALESCE(SUM(r.monto_solicitado), 0) INTO v_retirado_mes
  FROM public.creador_retiros r
  WHERE r.creador_id = v_creador_id
    AND r.estado IN ('pendiente', 'aprobado', 'pagado')
    AND r.created_at >= date_trunc('month', NOW());

  IF v_retirado_mes + p_monto > v_tope_mensual THEN
    RAISE EXCEPTION 'MONTHLY_LIMIT_EXCEEDED';
  END IF;

  SELECT COUNT(*) INTO v_retiros_pendientes
  FROM public.creador_retiros
  WHERE creador_id = v_creador_id AND estado = 'pendiente';

  IF v_retiros_pendientes >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY_PENDING';
  END IF;

  INSERT INTO public.creador_retiros (creador_id, monto_solicitado, metodo_pago, datos_pago)
  VALUES (v_creador_id, p_monto, p_metodo_pago, p_datos_pago)
  RETURNING creador_retiros.id, creador_retiros.monto_solicitado, creador_retiros.estado
  INTO id, monto_solicitado, estado;

  RETURN NEXT;
END;
$$;

-- ═══ 4. RPCs feria — atar p_user_id a auth.uid() ═══
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
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

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
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.ventas v
    WHERE v.id = p_venta_id
      AND v.vendedor_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'VENTA_OWNERSHIP';
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.revertir_consignacion_feria(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revertir_consignacion_feria(UUID, JSONB) TO service_role;

-- ═══ 5. Claim ventas POS — sin SELECT público masivo ═══
DROP POLICY IF EXISTS "Anyone can view pending sale via token" ON public.ventas;
DROP POLICY IF EXISTS "Users can claim their sales via token" ON public.ventas;

CREATE OR REPLACE FUNCTION public.obtener_venta_por_claim_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', v.id,
    'total', v.total,
    'items', COALESCE(v.productos, '[]'::jsonb),
    'claim_status', v.claim_status
  )
  INTO v_result
  FROM public.ventas v
  WHERE v.claim_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reclamar_venta_por_claim_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  UPDATE public.ventas
  SET
    claim_status = 'claimed',
    claimed_by = auth.uid(),
    claimed_at = NOW(),
    cliente_id = auth.uid()
  WHERE claim_token = p_token
    AND claim_status = 'pending'
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND_OR_ALREADY_CLAIMED';
  END IF;

  RETURN jsonb_build_object('id', v_id, 'claimed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_venta_por_claim_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_venta_por_claim_token(UUID) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.reclamar_venta_por_claim_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclamar_venta_por_claim_token(UUID) TO authenticated;