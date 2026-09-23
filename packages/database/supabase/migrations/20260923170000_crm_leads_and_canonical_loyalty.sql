-- =============================================================================
-- 20260923170000 — CRM Leads Unificados y Acreditación Canónica de Lealtad
--
-- 1. Permite leads anónimos en clientes (user_id DROP NOT NULL para prospectos web/B2B).
-- 2. Asegura valor 'retorno_envase' en enum accion_tipo.
-- 3. Actualiza moderar_resena_producto para acreditar puntos canónicos (500 pts)
--    mediante registrar_evento_lealtad_canonica al aprobar una huella sensorial.
-- =============================================================================

-- 1. Clientes: permitir prospectos web sin cuenta de usuario creada aún
ALTER TABLE public.clientes
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Asegurar tipo de acción en enum de lealtad
ALTER TYPE public.accion_tipo ADD VALUE IF NOT EXISTS 'retorno_envase';

-- 3. Actualización de moderar_resena_producto con acreditación canónica
CREATE OR REPLACE FUNCTION public.moderar_resena_producto(
  p_resena_id UUID,
  p_estado TEXT,
  p_moderator_id UUID,
  p_ciclos_guardian NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resena public.resenas_producto%ROWTYPE;
  v_ciclos NUMERIC := 0;
  v_default_ciclos NUMERIC := 5;
  v_puntos_resena INT := 500;
  v_loyalty_res JSONB;
BEGIN
  IF p_estado NOT IN ('aprobada', 'rechazada', 'oculta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_estado');
  END IF;

  SELECT * INTO v_resena
  FROM public.resenas_producto
  WHERE id = p_resena_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_resena.estado = p_estado THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  UPDATE public.resenas_producto
  SET
    estado = p_estado,
    moderated_at = now(),
    moderated_by = p_moderator_id,
    updated_at = now()
  WHERE id = p_resena_id;

  -- Al aprobar reseña de guardián vinculada a usuario
  IF p_estado = 'aprobada'
    AND v_resena.modo = 'guardian'
    AND v_resena.user_id IS NOT NULL
  THEN
    -- Calcular ciclos
    IF p_ciclos_guardian IS NOT NULL THEN
      v_ciclos := GREATEST(p_ciclos_guardian, 0);
    ELSE
      SELECT COALESCE(valor_numerico, 5) INTO v_default_ciclos
      FROM public.beneficios_enjambre
      WHERE clave = 'ciclos_por_resena';
      v_ciclos := GREATEST(COALESCE(v_default_ciclos, 5), 0);
    END IF;

    -- Obtener valor de puntos por reseña si está configurado en beneficios_enjambre
    SELECT COALESCE(valor_numerico::int, 500) INTO v_puntos_resena
    FROM public.beneficios_enjambre
    WHERE clave = 'puntos_por_resena';

    -- Acreditación canónica mediante registrar_evento_lealtad_canonica
    IF v_resena.ciclos_otorgados = 0 THEN
      v_loyalty_res := public.registrar_evento_lealtad_canonica(
        p_idempotency_key := 'resena_aprobada_' || p_resena_id::text,
        p_user_id := v_resena.user_id,
        p_actor_id := p_moderator_id,
        p_canal := 'web',
        p_tipo_evento := 'resena_aprobada',
        p_delta_puntos := v_puntos_resena,
        p_delta_ciclos := v_ciclos,
        p_referencia_tipo := 'resenas_producto',
        p_referencia_id := p_resena_id::text,
        p_metadata := jsonb_build_object(
          'producto_id', v_resena.producto_id,
          'rating', v_resena.rating,
          'venta_id', v_resena.venta_id
        )
      );

      UPDATE public.resenas_producto
      SET ciclos_otorgados = v_ciclos
      WHERE id = p_resena_id;
    END IF;

    -- Registrar estampilla en pasaporte si aplica
    PERFORM bonus_stamp_resena(v_resena.user_id, v_resena.producto_id, p_resena_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'estado', p_estado,
    'resena_id', p_resena_id,
    'ciclos_otorgados', v_ciclos,
    'puntos_otorgados', CASE WHEN p_estado = 'aprobada' THEN v_puntos_resena ELSE 0 END
  );
END;
$$;

COMMENT ON FUNCTION public.moderar_resena_producto IS
  'Modera reseñas de producto y acredita ciclos y puntos en el libro mayor canónico al aprobar.';
