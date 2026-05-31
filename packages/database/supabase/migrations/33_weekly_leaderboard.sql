-- Migration 33: Weekly leaderboard for reps
-- Function returns top reps by commissions, sales count and revenue for current week

CREATE OR REPLACE FUNCTION public.weekly_leaderboard(p_empresa_id UUID)
RETURNS TABLE(rank INT, rep_id UUID, display_name TEXT, commission_tier TEXT, total_commissions NUMERIC, total_sales BIGINT, total_revenue NUMERIC) AS $$
DECLARE
  v_week_start TIMESTAMPTZ := date_trunc('week', CURRENT_TIMESTAMP);
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(cr.total_commission) DESC)::INT AS rank,
    rp.user_id AS rep_id,
    rp.display_name,
    rp.commission_tier,
    SUM(cr.total_commission) AS total_commissions,
    COUNT(cr.id) AS total_sales,
    COALESCE(SUM(v.total), 0) AS total_revenue
  FROM commission_records cr
  JOIN rep_profiles rp ON rp.user_id = cr.rep_id
  JOIN ventas v ON v.id = cr.venta_id
  WHERE cr.empresa_id = p_empresa_id
    AND cr.created_at >= v_week_start
    AND rp.active = true
  GROUP BY rp.user_id, rp.display_name, rp.commission_tier
  ORDER BY total_commissions DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.weekly_leaderboard(UUID) IS 'Top 20 reps por comisiones de la semana actual (lunes a domingo). Incluye tier, ventas y revenue.';
