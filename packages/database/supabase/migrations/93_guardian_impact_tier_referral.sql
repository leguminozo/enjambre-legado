-- Migration 93: Guardian Impact Footprint + Cliente Tier + Referral Code
-- Agrega RPC para impacto agregado, evaluación automática de tier cliente, código referido legible, override admin

-- ─── 1. RPC: get_user_impact_footprint ───────────────────────────────
-- Agrega order_regenerative_footprint por user_id (via ventas.user_id / vendedor_id)
-- Retorna totales exactos server-side (CO₂, bosque m², azúcar, IRR, árboles plantados, ciclos)

CREATE OR REPLACE FUNCTION public.get_user_impact_footprint(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_co2 NUMERIC := 0;
  v_total_bosque NUMERIC := 0;
  v_total_azucar NUMERIC := 0;
  v_best_irr NUMERIC := 0;
  v_arboles_cant INT := 0;
  v_arboles_co2 NUMERIC := 0;
  v_especies JSONB := '[]'::jsonb;
  v_ciclos_historicos NUMERIC := 0;
BEGIN
  -- Validación: solo el propio usuario o admin puede consultar
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo puedes consultar tu propio impacto';
  END IF;

  -- 1. Agregar footprint de órdenes (order_regenerative_footprint via ventas)
  SELECT
    COALESCE(SUM(orf.co2_evitado_kg), 0),
    COALESCE(SUM(orf.bosque_m2_protegido), 0),
    COALESCE(SUM(orf.azucar_sustituida_g), 0),
    COALESCE(MAX(orf.irr_score), 0)
  INTO v_total_co2, v_total_bosque, v_total_azucar, v_best_irr
  FROM public.order_regenerative_footprint orf
  JOIN public.ventas v ON v.id = orf.venta_id
  WHERE v.user_id = p_user_id OR v.vendedor_id = p_user_id;

  -- 2. Agregar árboles plantados directos
  SELECT
    COALESCE(SUM(ap.cantidad), 0),
    COALESCE(SUM(ap.co2_ton), 0) * 1000, -- ton a kg
    COALESCE(jsonb_agg(DISTINCT ap.especie) FILTER (WHERE ap.especie IS NOT NULL), '[]'::jsonb)
  INTO v_arboles_cant, v_arboles_co2, v_especies
  FROM public.arboles_plantados ap
  WHERE ap.user_id = p_user_id;

  -- 3. Ciclos históricos (desde ciclos)
  SELECT COALESCE(SUM(c.cantidad), 0)
  INTO v_ciclos_historicos
  FROM public.ciclos c
  WHERE c.user_id = p_user_id;

  -- 4. Construir resultado
  v_result := jsonb_build_object(
    'co2_evitado_kg', ROUND((v_total_co2 + v_arboles_co2)::numeric, 2),
    'bosque_m2_protegido', ROUND(v_total_bosque::numeric, 2),
    'azucar_sustituida_g', ROUND(v_total_azucar::numeric, 2),
    'irr_score', ROUND(v_best_irr::numeric, 4),
    'arboles_plantados', v_arboles_cant,
    'especies_arboles', v_especies,
    'ciclos_historicos', ROUND(v_ciclos_historicos::numeric, 2),
    'calculado_en', now()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_user_impact_footprint(UUID) IS 'Retorna impacto regenerativo agregado del usuario: CO₂ kg, bosque m², azúcar g, IRR, árboles, especies, ciclos. Solo accesible por el propio usuario o admin.';


-- ─── 2. FUNCION: evaluar_tier_cliente ────────────────────────────────
-- Patrón idéntico a evaluar_tier_rep (mig 29) pero métricas de cliente

CREATE OR REPLACE FUNCTION public.evaluar_tier_cliente(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_ciclos NUMERIC;
  v_spent NUMERIC(19,4);
  v_referrals INT;
  v_trees INT;
  v_current_tier TEXT;
  v_override TEXT;
  v_new_tier TEXT := 'OBRERA';
BEGIN
  -- Leer métricas
  SELECT
    COALESCE(SUM(c.cantidad), 0)
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

  -- Leer tier actual y override
  SELECT nivel_guardian, tier_override
  INTO v_current_tier, v_override
  FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN 'OBRERA'; END IF;

  -- Admin override
  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  -- Lógica de tier (umbrales coherentes con user_tier_view + métricas adicionales)
  IF v_ciclos >= 5000 AND v_spent >= 1000000 AND v_trees >= 10 THEN
    v_new_tier := 'COLMENA';
  ELSIF v_ciclos >= 2000 AND v_spent >= 300000 AND v_trees >= 5 THEN
    v_new_tier := 'REINA';
  ELSIF v_ciclos >= 500 AND v_spent >= 50000 THEN
    v_new_tier := 'ZÁNGANO';
  END IF;

  -- Solo sube, nunca baja
  IF v_new_tier = 'COLMENA' AND v_current_tier NOT IN ('COLMENA') THEN
    v_new_tier := 'COLMENA';
  ELSIF v_new_tier = 'REINA' AND v_current_tier NOT IN ('REINA', 'COLMENA') THEN
    v_new_tier := 'REINA';
  ELSIF v_new_tier = 'ZÁNGANO' AND v_current_tier NOT IN ('ZÁNGANO', 'REINA', 'COLMENA') THEN
    v_new_tier := 'ZÁNGANO';
  ELSE
    v_new_tier := COALESCE(v_current_tier, 'OBRERA');
  END IF;

  -- Actualizar si cambió
  IF v_new_tier IS DISTINCT FROM v_current_tier THEN
    UPDATE public.profiles
    SET nivel_guardian = v_new_tier,
        tier_promoted_at = now(),
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.evaluar_tier_cliente(UUID) IS 'Evalúa métricas del cliente y sube tier si cumple umbrales. Solo sube, nunca baja. Admin puede override con tier_override.';


-- ─── 3. FUNCION: tier_progress_cliente ───────────────────────────────
-- Retorna métricas actuales, umbrales del siguiente tier y progreso por métrica

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

  -- Determinar siguiente tier y umbrales
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.tier_progress_cliente(UUID) IS 'Retorna métricas, umbrales y progreso 0-1 por métrica para UI del tier cliente.';


-- ─── 4. COLUMNAS EN PROFILES: referral_code + tier_override ──────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS tier_override TEXT CHECK (tier_override IS NULL OR tier_override IN ('OBRERA','ZÁNGANO','REINA','COLMENA')),
  ADD COLUMN IF NOT EXISTS tier_promoted_at TIMESTAMPTZ;

-- Índice único para referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN public.profiles.referral_code IS 'Código legible para compartir (ej. OYZ-MARIA-123). Auto-generado al crear perfil.';
COMMENT ON COLUMN public.profiles.tier_override IS 'Override manual del tier por admin. Si no es NULL, se usa este valor en lugar del calculado.';
COMMENT ON COLUMN public.profiles.tier_promoted_at IS 'Fecha del último ascenso automático de tier.';


-- ─── 5. TRIGGER: generar referral_code al crear perfil ──────────────

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  v_base TEXT;
  v_code TEXT;
  v_attempt INT := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Base: OYZ + primeras 4 letras del nombre/email + 3 dígitos
  v_base := 'OYZ-' || UPPER(SUBSTRING(COALESCE(NEW.nombre, NEW.email, 'USER'), 1, 4));
  v_code := v_base || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

  -- Garantizar unicidad (máx 10 intentos)
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      v_code := v_base || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
      EXIT;
    END IF;
    v_code := v_base || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END LOOP;

  NEW.referral_code := v_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();


-- ─── 6. TRIGGER: evaluar tier tras insert/update en ciclos ────────────

CREATE OR REPLACE FUNCTION public.on_ciclos_tier_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.evaluar_tier_cliente(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_ciclos_tier_check ON public.ciclos;
CREATE TRIGGER trigger_ciclos_tier_check
  AFTER INSERT OR UPDATE ON public.ciclos
  FOR EACH ROW
  EXECUTE FUNCTION public.on_ciclos_tier_check();


-- ─── 7. TRIGGER: evaluar tier tras insert en ventas (gasto/cliente) ──

CREATE OR REPLACE FUNCTION public.on_ventas_tier_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.evaluar_tier_cliente(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_ventas_tier_check ON public.ventas;
CREATE TRIGGER trigger_ventas_tier_check
  AFTER INSERT ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.on_ventas_tier_check();


-- ─── 8. TRIGGER: evaluar tier tras nuevo referido ─────────────────────

CREATE OR REPLACE FUNCTION public.on_referral_tier_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    PERFORM public.evaluar_tier_cliente(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_referral_tier_check ON public.profiles;
CREATE TRIGGER trigger_referral_tier_check
  AFTER UPDATE OF referred_by ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referred_by IS NOT NULL AND NEW.referred_by IS DISTINCT FROM OLD.referred_by)
  EXECUTE FUNCTION public.on_referral_tier_check();


-- ─── 9. RLS: asegurar políticas para nuevas columnas ─────────────────
-- profiles ya tiene RLS; las nuevas columnas heredan las policies existentes.
-- is_admin() y user_id = auth.uid() cubren tier_override, tier_promoted_at, referral_code.

-- ─── 10. COMENTARIOS ────────────────────────────────────────────────

COMMENT ON TRIGGER trigger_ciclos_tier_check ON public.ciclos IS 'Reevalúa tier cliente cuando cambian ciclos (ganados o canjeados).';
COMMENT ON TRIGGER trigger_ventas_tier_check ON public.ventas IS 'Reevalúa tier cliente tras nueva venta/compra.';
COMMENT ON TRIGGER trigger_referral_tier_check ON public.profiles IS 'Reevalúa tier del referidor cuando se completa un referido.';