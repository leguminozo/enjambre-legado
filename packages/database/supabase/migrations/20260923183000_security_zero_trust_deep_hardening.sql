-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 20260923183000 — Zero-Trust Deep Security Hardening
--
-- 1. profiles: Eliminar política residual "Public profiles are viewable by everyone."
--    que exponía correos, nombres y roles a usuarios anónimos. Consolidar read_own_profile
--    para que solo el propio usuario o administradores puedan leer perfiles.
-- 2. lotes: Restringir lotes_read para evitar exposición de lotes no públicos (publico = false)
--    o retenidos por control de calidad (bloqueado_calidad = true).
-- 3. decrement_stock_force_batch & decrement_stock_force: Revocar privilegios a PUBLIC y anon.
--    Añadir verificación interna de autorización (service_role, admin, gerente, rep_ventas).
-- 4. registrar_evento_lealtad_canonica: Revocar privilegios a PUBLIC, anon y authenticated.
--    Restringir a service_role con guarda interna de autorización.
-- 5. Inmutabilidad de search_path: Fijar search_path = public en 10 funciones SECURITY DEFINER
--    que carecían de configuración explícita.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Tabla profiles
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS read_own_profile ON public.profiles;

CREATE POLICY read_own_profile ON public.profiles
  FOR SELECT TO public
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_gerente()
  );

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Tabla lotes
-- ──────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS lotes_read ON public.lotes;
DROP POLICY IF EXISTS "Lotes públicos son visibles para todos" ON public.lotes;

CREATE POLICY lotes_read ON public.lotes
  FOR SELECT TO public
  USING (
    (publico = true AND COALESCE(bloqueado_calidad, false) = false)
    OR public.is_admin()
    OR public.is_gerente()
  );

-- ──────────────────────────────────────────────────────────────────────────
-- 3. RPCs decrement_stock_force y decrement_stock_force_batch
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decrement_stock_force(p_id uuid, p_qty integer)
 RETURNS TABLE(id uuid, stock integer, lote_id uuid, kg_restante_lote numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_new_stock INT;
    v_lote_id UUID;
    v_kg DECIMAL;
BEGIN
    IF current_setting('role', true) <> 'service_role'
       AND NOT public.is_admin()
       AND public.current_role() NOT IN ('rep_ventas', 'admin', 'gerente', 'vendedor') THEN
      RAISE EXCEPTION 'forbidden: caller not authorized' USING ERRCODE = '42501';
    END IF;

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
$function$;

REVOKE ALL ON FUNCTION public.decrement_stock_force(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock_force(uuid, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.decrement_stock_force_batch(p_items jsonb)
 RETURNS TABLE(id uuid, stock integer, lote_id uuid, kg_restante_lote numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_item JSONB;
    v_id UUID;
    v_qty INT;
    v_new_stock INT;
    v_lote_id UUID;
    v_kg DECIMAL;
BEGIN
    IF current_setting('role', true) <> 'service_role'
       AND NOT public.is_admin()
       AND public.current_role() NOT IN ('rep_ventas', 'admin', 'gerente', 'vendedor') THEN
      RAISE EXCEPTION 'forbidden: caller not authorized' USING ERRCODE = '42501';
    END IF;

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
$function$;

REVOKE ALL ON FUNCTION public.decrement_stock_force_batch(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock_force_batch(jsonb) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 4. RPC registrar_evento_lealtad_canonica
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_evento_lealtad_canonica(
  p_idempotency_key text,
  p_user_id uuid,
  p_actor_id uuid,
  p_canal text,
  p_tipo_evento text,
  p_delta_puntos integer,
  p_delta_ciclos numeric,
  p_referencia_tipo text DEFAULT NULL::text,
  p_referencia_id text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_saldo_puntos INT;
  v_saldo_ciclos NUMERIC;
  v_nuevo_puntos INT;
  v_nuevo_ciclos NUMERIC;
  v_tier TEXT;
  v_empresa_id UUID;
  v_ciclo_ref_id UUID := NULL;
BEGIN
  -- Zero-Trust: sólo service_role (BFF autenticado) o admin verificado en BD
  IF current_setting('role', true) <> 'service_role'
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller not authorized' USING ERRCODE = '42501';
  END IF;

  -- 1. Idempotencia segura
  IF EXISTS (
    SELECT 1 FROM public.loyalty_events_ledger
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    SELECT puntos_canjeables, ciclos_historicos, tier_actual
    INTO v_saldo_puntos, v_saldo_ciclos, v_tier
    FROM public.loyalty_balances
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'saldo_puntos', COALESCE(v_saldo_puntos, 0),
      'saldo_ciclos', COALESCE(v_saldo_ciclos, 0),
      'tier', COALESCE(v_tier, 'OBRERA')
    );
  END IF;

  -- 2. Asegurar fila de balance con bloqueo exclusivo
  INSERT INTO public.loyalty_balances (user_id, puntos_canjeables, ciclos_historicos, tier_actual, updated_at)
  VALUES (p_user_id, 0, 0, 'OBRERA', now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT puntos_canjeables, ciclos_historicos, tier_actual
  INTO v_saldo_puntos, v_saldo_ciclos, v_tier
  FROM public.loyalty_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 3. Validar no negatividad de puntos (ej. en canje)
  v_nuevo_puntos := v_saldo_puntos + p_delta_puntos;
  IF v_nuevo_puntos < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_POINTS',
      'saldo_actual', v_saldo_puntos,
      'puntos_solicitados', abs(p_delta_puntos)
    );
  END IF;

  v_nuevo_ciclos := GREATEST(0, v_saldo_ciclos + p_delta_ciclos);

  -- 4. Registrar en ledger inmutable de lealtad
  INSERT INTO public.loyalty_events_ledger (
    idempotency_key,
    user_id,
    actor_id,
    canal,
    tipo_evento,
    delta_puntos,
    delta_ciclos,
    referencia_tipo,
    referencia_id,
    metadata
  ) VALUES (
    p_idempotency_key,
    p_user_id,
    p_actor_id,
    p_canal,
    p_tipo_evento,
    p_delta_puntos,
    p_delta_ciclos,
    p_referencia_tipo,
    p_referencia_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- 5. Actualizar saldo consolidado
  UPDATE public.loyalty_balances
  SET
    puntos_canjeables = v_nuevo_puntos,
    ciclos_historicos = v_nuevo_ciclos,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 6. Espejar en tablas de dominio legacy si aplica
  IF p_delta_ciclos > 0 AND p_tipo_evento = 'huella_sensorial' THEN
    SELECT empresa_id INTO v_empresa_id
    FROM public.usuarios_empresas
    WHERE user_id = p_user_id
    LIMIT 1;

    INSERT INTO public.ciclos (
      user_id,
      ciclos_otorgados,
      descripcion,
      metadata,
      empresa_id
    ) VALUES (
      p_user_id,
      p_delta_ciclos,
      'Reconocimiento canónico por huella sensorial',
      p_metadata,
      v_empresa_id
    ) RETURNING id INTO v_ciclo_ref_id;
  END IF;

  IF p_delta_puntos <> 0 THEN
    INSERT INTO public.puntos_fidelidad (
      user_id,
      puntos,
      tipo_accion,
      ciclo_id,
      origen
    ) VALUES (
      p_user_id,
      p_delta_puntos,
      (CASE
        WHEN p_tipo_evento = 'frasco_retornado' THEN 'retorno_envase'
        WHEN p_tipo_evento = 'canje_recompensa' THEN 'canje'
        WHEN p_tipo_evento = 'bono_bienvenida' THEN 'bienvenida'
        ELSE 'compra'
      END)::public.accion_tipo,
      v_ciclo_ref_id,
      COALESCE(p_referencia_tipo, 'general')
    );
  END IF;

  -- 7. Evaluar y actualizar tier
  v_tier := public.evaluar_tier_cliente(p_user_id);

  UPDATE public.loyalty_balances
  SET tier_actual = v_tier
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'saldo_puntos', v_nuevo_puntos,
    'saldo_ciclos', v_nuevo_ciclos,
    'tier', v_tier,
    'delta_puntos', p_delta_puntos,
    'delta_ciclos', p_delta_ciclos
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_evento_lealtad_canonica(text, uuid, uuid, text, text, integer, numeric, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_evento_lealtad_canonica(text, uuid, uuid, text, text, integer, numeric, text, text, jsonb) TO service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Fijación de search_path en funciones SECURITY DEFINER
-- ──────────────────────────────────────────────────────────────────────────
ALTER FUNCTION public.aplicar_codigo_creador(text, uuid, uuid, integer) SET search_path = public;
ALTER FUNCTION public.aplicar_codigo_creador(text, uuid, uuid, numeric) SET search_path = public;
ALTER FUNCTION public.calcular_descuento(uuid, integer) SET search_path = public;
ALTER FUNCTION public.calcular_puntos_compra(uuid, uuid, integer) SET search_path = public;
ALTER FUNCTION public.canjear_recompensa(uuid, uuid, uuid) SET search_path = public;
ALTER FUNCTION public.crear_tarea_crm(uuid, uuid, text, date, uuid, text, text, time without time zone, text) SET search_path = public;
ALTER FUNCTION public.es_descuento_aplicable(uuid, uuid, text, uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.generar_event_hash(uuid, text, timestamp with time zone, jsonb) SET search_path = public;
ALTER FUNCTION public.mover_lead_pipeline(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION public.registrar_escaneo_qr(text, text, text, numeric, numeric, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.registrar_interaccion_crm(uuid, uuid, uuid, text, text, text, text, timestamp with time zone, integer, date, jsonb) SET search_path = public;

COMMIT;
