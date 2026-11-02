-- Migration 20261102140000: Hardening de RPCs de tier (P0 auditoría Tienda)
-- - evaluar_tier_cliente: validación de identidad + REVOKE de anon/authenticated
--   (solo triggers SECURITY DEFINER y service_role pueden ejecutarla)
-- - tier_progress_cliente: validación de identidad (self o admin), REVOKE de anon

-- 1. evaluar_tier_cliente (versión dinámica) — añadir guard de identidad.
--    En contexto de trigger auth.uid() es NULL, por lo que se permite la ejecución
--    interna; las llamadas directas por RPC quedan restringidas a self/admin.
CREATE OR REPLACE FUNCTION public.evaluar_tier_cliente(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ciclos NUMERIC;
  v_spent NUMERIC(19,4);
  v_referrals INT;
  v_trees INT;
  v_current_tier TEXT;
  v_override TEXT;
  v_initial_tier TEXT := 'OBRERA';
  v_new_tier TEXT;
  v_tier_row RECORD;
  v_curr_prio INT := 1;
  v_new_prio INT := 1;
BEGIN
  -- Guard de identidad: solo el propio usuario, admin, o contexto interno (trigger, auth.uid() NULL)
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo puedes evaluar tu propio tier';
  END IF;

  -- 1. Determinar tier inicial según menor prioridad activa
  SELECT tier INTO v_initial_tier
  FROM public.guardian_tier_configs
  WHERE activo = true
  ORDER BY priority ASC
  LIMIT 1;

  v_initial_tier := COALESCE(v_initial_tier, 'OBRERA');
  v_new_tier := v_initial_tier;

  -- 2. Leer métricas acumuladas del usuario
  SELECT COALESCE(SUM(c.cantidad), 0)
  INTO v_ciclos
  FROM public.ciclos c WHERE c.user_id = p_user_id;

  SELECT COALESCE(SUM(v.total), 0)
  INTO v_spent
  FROM public.ventas v WHERE v.user_id = p_user_id;

  SELECT COUNT(*)
  INTO v_referrals
  FROM public.profiles p WHERE p.referred_by = p_user_id;

  SELECT COALESCE(SUM(ap.cantidad), 0)
  INTO v_trees
  FROM public.arboles_plantados ap WHERE ap.user_id = p_user_id;

  -- 3. Leer tier actual y override manual
  SELECT nivel_guardian, tier_override
  INTO v_current_tier, v_override
  FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN v_initial_tier; END IF;

  -- Admin override directo
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- 4. Evaluación dinámica según guardian_tier_configs en orden de prioridad descendente
  FOR v_tier_row IN
    SELECT tier, min_ciclos, min_spent, min_trees, priority
    FROM public.guardian_tier_configs
    WHERE activo = true
    ORDER BY priority DESC
  LOOP
    IF v_ciclos >= v_tier_row.min_ciclos
       AND v_spent >= v_tier_row.min_spent
       AND v_trees >= v_tier_row.min_trees
    THEN
      v_new_tier := v_tier_row.tier;
      v_new_prio := v_tier_row.priority;
      EXIT;
    END IF;
  END LOOP;

  -- 5. Regla de oro: solo sube de nivel, nunca desciende
  IF v_current_tier IS NOT NULL THEN
    SELECT priority INTO v_curr_prio
    FROM public.guardian_tier_configs
    WHERE tier = v_current_tier;

    IF COALESCE(v_curr_prio, 1) > v_new_prio THEN
      v_new_tier := v_current_tier;
    END IF;
  END IF;

  -- 6. Actualizar perfiles y balances si hubo promoción
  IF v_new_tier IS DISTINCT FROM v_current_tier THEN
    UPDATE public.profiles
    SET nivel_guardian = v_new_tier,
        tier_promoted_at = now(),
        updated_at = now()
    WHERE id = p_user_id;

    UPDATE public.loyalty_balances
    SET tier_actual = v_new_tier,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 2. tier_progress_cliente: añadir guard de identidad
CREATE OR REPLACE FUNCTION public.tier_progress_cliente(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_ciclos NUMERIC := 0;
  v_spent NUMERIC(19,4) := 0;
  v_referrals INT := 0;
  v_trees INT := 0;
  v_current_tier TEXT := 'OBRERA';
  v_override TEXT;
  v_next_tier TEXT;
  v_thresholds JSONB;
  v_progress JSONB;
BEGIN
  -- Guard de identidad
  IF auth.uid() IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo puedes consultar tu propio progreso';
  END IF;

  -- Leer métricas
  SELECT COALESCE(SUM(c.cantidad), 0)
  INTO v_ciclos FROM public.ciclos c WHERE c.user_id = p_user_id;

  SELECT COALESCE(SUM(v.total), 0)
  INTO v_spent FROM public.ventas v WHERE v.user_id = p_user_id;

  SELECT COUNT(*)
  INTO v_referrals FROM public.profiles p WHERE p.referred_by = p_user_id;

  SELECT COALESCE(SUM(ap.cantidad), 0)
  INTO v_trees FROM public.arboles_plantados ap WHERE ap.user_id = p_user_id;

  SELECT nivel_guardian, tier_override
  INTO v_current_tier, v_override
  FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{"current_tier":"OBRERA","next_tier":"ZÁNGANO","thresholds":{"ciclos":500,"spent":50000,"trees":0,"referrals":0},"progress":{"ciclos":0,"spent":0,"trees":0,"referrals":0,"overall":0}}'::JSONB;
  END IF;

  CASE v_current_tier
    WHEN 'OBRERA' THEN
      v_next_tier := 'ZÁNGANO';
      v_thresholds := jsonb_build_object('ciclos', 500, 'spent', 50000, 'trees', 0, 'referrals', 0);
      v_progress := jsonb_build_object(
        'ciclos', LEAST(1.0, v_ciclos / 500),
        'spent', LEAST(1.0, v_spent / 50000),
        'trees', 1.0,
        'referrals', 1.0,
        'overall', LEAST(1.0, GREATEST(v_ciclos / 500, v_spent / 50000))
      );
    WHEN 'ZÁNGANO' THEN
      v_next_tier := 'REINA';
      v_thresholds := jsonb_build_object('ciclos', 2000, 'spent', 300000, 'trees', 5, 'referrals', 0);
      v_progress := jsonb_build_object(
        'ciclos', LEAST(1.0, v_ciclos / 2000),
        'spent', LEAST(1.0, v_spent / 300000),
        'trees', LEAST(1.0, v_trees::numeric / 5),
        'referrals', 1.0,
        'overall', LEAST(1.0, GREATEST(v_ciclos / 2000, v_spent / 300000, v_trees::numeric / 5))
      );
    WHEN 'REINA' THEN
      v_next_tier := 'COLMENA';
      v_thresholds := jsonb_build_object('ciclos', 5000, 'spent', 1000000, 'trees', 10, 'referrals', 0);
      v_progress := jsonb_build_object(
        'ciclos', LEAST(1.0, v_ciclos / 5000),
        'spent', LEAST(1.0, v_spent / 1000000),
        'trees', LEAST(1.0, v_trees::numeric / 10),
        'referrals', 1.0,
        'overall', LEAST(1.0, GREATEST(v_ciclos / 5000, v_spent / 1000000, v_trees::numeric / 10))
      );
    ELSE
      v_next_tier := NULL;
      v_thresholds := jsonb_build_object('ciclos', 1.0, 'spent', 1.0, 'trees', 1.0, 'referrals', 1.0);
      v_progress := jsonb_build_object('ciclos', 1.0, 'spent', 1.0, 'trees', 1.0, 'referrals', 1.0, 'overall', 1.0);
  END CASE;

  v_result := jsonb_build_object(
    'current_tier', v_current_tier,
    'tier_override', v_override,
    'metrics', jsonb_build_object(
      'ciclos', v_ciclos,
      'spent', v_spent,
      'referrals', v_referrals,
      'trees', v_trees
    ),
    'next_tier', v_next_tier,
    'thresholds', v_thresholds,
    'progress', v_progress
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. Revocar ejecución pública de evaluar_tier_cliente (solo service_role + owner/triggers)
REVOKE ALL ON FUNCTION public.evaluar_tier_cliente(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluar_tier_cliente(UUID) TO service_role;

-- 4. tier_progress_cliente: revocar anon (authenticated mantiene, guard interno protege IDOR)
REVOKE ALL ON FUNCTION public.tier_progress_cliente(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.tier_progress_cliente(UUID) TO authenticated, service_role;
