-- Migration 29: Automatic rep tier evaluation
-- Tier progression: base → senior → elite → legend
-- Evaluated automatically after each sale and session close

-- ─── 1. FUNCION: evaluar_tier_rep ──────────────────────────────────
-- Determina el tier máximo alcanzado por un rep según sus métricas acumuladas.
-- Solo sube (nunca baja). Admin puede override manual con tier_override.

CREATE OR REPLACE FUNCTION public.evaluar_tier_rep(p_rep_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_sales INT;
  v_revenue NUMERIC(19,4);
  v_best_streak INT;
  v_clients INT;
  v_current_tier TEXT;
  v_override TEXT;
  v_new_tier TEXT := 'base';
BEGIN
  SELECT
    total_sales_lifetime,
    total_revenue_lifetime,
    best_streak_days,
    clients_captured,
    commission_tier,
    tier_override
  INTO v_sales, v_revenue, v_best_streak, v_clients, v_current_tier, v_override
  FROM rep_profiles WHERE user_id = p_rep_id;

  IF NOT FOUND THEN RETURN 'base'; END IF;

  IF v_override IS NOT NULL THEN
    RETURN v_override;
  END IF;

  IF v_sales >= 250 AND v_revenue >= 15000000 AND v_best_streak >= 30 AND v_clients >= 20 THEN
    v_new_tier := 'legend';
  ELSIF v_sales >= 100 AND v_revenue >= 5000000 AND v_best_streak >= 14 THEN
    v_new_tier := 'elite';
  ELSIF v_sales >= 30 AND v_revenue >= 1000000 THEN
    v_new_tier := 'senior';
  END IF;

  IF v_new_tier > v_current_tier THEN
    UPDATE rep_profiles
    SET commission_tier = v_new_tier,
        tier_promoted_at = now(),
        updated_at = now()
    WHERE user_id = p_rep_id;
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. FUNCION: tier_progress_rep ─────────────────────────────────
-- Retorna métricas actuales y umbrales del siguiente tier (para UI).

CREATE OR REPLACE FUNCTION public.tier_progress_rep(p_rep_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'current_tier', rp.commission_tier,
    'tier_override', rp.tier_override,
    'metrics', jsonb_build_object(
      'sales', rp.total_sales_lifetime,
      'revenue', rp.total_revenue_lifetime,
      'best_streak', rp.best_streak_days,
      'clients', rp.clients_captured
    ),
    'next_tier', CASE
      WHEN rp.commission_tier = 'base' THEN 'senior'
      WHEN rp.commission_tier = 'senior' THEN 'elite'
      WHEN rp.commission_tier = 'elite' THEN 'legend'
      ELSE NULL
    END,
    'thresholds', CASE
      WHEN rp.commission_tier = 'base' THEN jsonb_build_object(
        'sales', 30, 'revenue', 1000000, 'best_streak', 0, 'clients', 0
      )
      WHEN rp.commission_tier = 'senior' THEN jsonb_build_object(
        'sales', 100, 'revenue', 5000000, 'best_streak', 14, 'clients', 0
      )
      WHEN rp.commission_tier = 'elite' THEN jsonb_build_object(
        'sales', 250, 'revenue', 15000000, 'best_streak', 30, 'clients', 20
      )
      ELSE NULL
    END,
    'progress', CASE
      WHEN rp.commission_tier = 'base' THEN jsonb_build_object(
        'sales', LEAST(1.0, rp.total_sales_lifetime::NUMERIC / 30),
        'revenue', LEAST(1.0, rp.total_revenue_lifetime / 1000000),
        'best_streak', 1.0,
        'clients', 1.0,
        'overall', LEAST(1.0, GREATEST(
          rp.total_sales_lifetime::NUMERIC / 30,
          rp.total_revenue_lifetime / 1000000
        ))
      )
      WHEN rp.commission_tier = 'senior' THEN jsonb_build_object(
        'sales', LEAST(1.0, rp.total_sales_lifetime::NUMERIC / 100),
        'revenue', LEAST(1.0, rp.total_revenue_lifetime / 5000000),
        'best_streak', LEAST(1.0, rp.best_streak_days::NUMERIC / 14),
        'clients', 1.0,
        'overall', LEAST(1.0, GREATEST(
          rp.total_sales_lifetime::NUMERIC / 100,
          rp.total_revenue_lifetime / 5000000,
          rp.best_streak_days::NUMERIC / 14
        ))
      )
      WHEN rp.commission_tier = 'elite' THEN jsonb_build_object(
        'sales', LEAST(1.0, rp.total_sales_lifetime::NUMERIC / 250),
        'revenue', LEAST(1.0, rp.total_revenue_lifetime / 15000000),
        'best_streak', LEAST(1.0, rp.best_streak_days::NUMERIC / 30),
        'clients', LEAST(1.0, rp.clients_captured::NUMERIC / 20),
        'overall', LEAST(1.0, GREATEST(
          rp.total_sales_lifetime::NUMERIC / 250,
          rp.total_revenue_lifetime / 15000000,
          rp.best_streak_days::NUMERIC / 30,
          rp.clients_captured::NUMERIC / 20
        ))
      )
      ELSE jsonb_build_object(
        'sales', 1.0, 'revenue', 1.0, 'best_streak', 1.0, 'clients', 1.0, 'overall', 1.0
      )
    END
  ) INTO v_result
  FROM rep_profiles rp
  WHERE rp.user_id = p_rep_id;

  RETURN COALESCE(v_result, '{"current_tier":"base","next_tier":"senior","thresholds":{"sales":30,"revenue":1000000},"progress":{"overall":0}}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. ALTER TABLE: tier_override + tier_promoted_at ──────────────

ALTER TABLE public.rep_profiles
  ADD COLUMN IF NOT EXISTS tier_override TEXT CHECK (tier_override IS NULL OR tier_override IN ('base','senior','elite','legend')),
  ADD COLUMN IF NOT EXISTS tier_promoted_at TIMESTAMPTZ;

-- ─── 4. TRIGGER: evaluar tier después de actualizar stats ──────────

CREATE OR REPLACE FUNCTION public.on_rep_profile_tier_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_sales_lifetime IS DISTINCT FROM OLD.total_sales_lifetime
     OR NEW.total_revenue_lifetime IS DISTINCT FROM OLD.total_revenue_lifetime
     OR NEW.best_streak_days IS DISTINCT FROM OLD.best_streak_days
     OR NEW.clients_captured IS DISTINCT FROM OLD.clients_captured
  THEN
    PERFORM evaluar_tier_rep(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_rep_profile_tier_check ON rep_profiles;
CREATE TRIGGER trigger_rep_profile_tier_check
  AFTER UPDATE ON rep_profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_rep_profile_tier_check();

-- ─── 5. RLS para nuevas columnas ───────────────────────────────────
-- (Las policies existentes cubren toda la tabla rep_profiles, no se necesitan nuevas)

-- ─── 6. COMENTARIOS ────────────────────────────────────────────────

COMMENT ON FUNCTION public.evaluar_tier_rep(UUID) IS 'Evalúa métricas del rep y sube tier si cumple umbrales. Solo sube, nunca baja. Admin puede override con tier_override.';
COMMENT ON FUNCTION public.tier_progress_rep(UUID) IS 'Retorna métricas actuales, umbrales del siguiente tier y porcentaje de progreso por métrica.';
COMMENT ON COLUMN public.rep_profiles.tier_override IS 'Override manual del tier por admin. Si no es NULL, se usa este valor en lugar del calculado.';
COMMENT ON COLUMN public.rep_profiles.tier_promoted_at IS 'Fecha del último ascenso automático de tier.';
