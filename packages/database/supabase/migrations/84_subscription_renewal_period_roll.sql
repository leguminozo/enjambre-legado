-- Renovación reposición: agenda entregas, avanza período vencido, marca past_due.
-- Reemplaza process_ritual_renewals (mismo nombre RPC para Núcleo cron).

CREATE OR REPLACE FUNCTION public.process_ritual_renewals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_count INT := 0;
  v_period INT;
  v_interval interval;
BEGIN
  PERFORM release_expired_stock_holds();

  FOR v_sub IN
    SELECT s.*, p.frequency, p.included_items
    FROM subscriptions s
    JOIN subscription_plans p ON p.id = s.plan_id
    WHERE s.status IN ('active', 'trialing')
      AND s.current_period_end <= now() + interval '3 days'
  LOOP
    v_interval := CASE v_sub.frequency
      WHEN 'monthly' THEN interval '1 month'
      WHEN 'quarterly' THEN interval '3 months'
      ELSE interval '1 year'
    END;

    SELECT COALESCE(MAX(period_number), 0) + 1 INTO v_period
    FROM subscription_deliveries
    WHERE subscription_id = v_sub.id;

    IF NOT EXISTS (
      SELECT 1 FROM subscription_deliveries
      WHERE subscription_id = v_sub.id
        AND period_number = v_period
    ) THEN
      INSERT INTO subscription_deliveries (
        subscription_id,
        period_number,
        scheduled_for,
        items,
        status
      ) VALUES (
        v_sub.id,
        v_period,
        v_sub.current_period_end,
        COALESCE(v_sub.included_items, '[]'::jsonb),
        'scheduled'
      );
      v_count := v_count + 1;
    END IF;

    IF v_sub.current_period_end <= now() THEN
      UPDATE subscriptions
      SET
        current_period_start = v_sub.current_period_end,
        current_period_end = v_sub.current_period_end + v_interval,
        updated_at = now()
      WHERE id = v_sub.id
        AND status IN ('active', 'trialing');
    END IF;
  END LOOP;

  UPDATE subscriptions
  SET status = 'past_due', updated_at = now()
  WHERE status IN ('active', 'trialing')
    AND current_period_end < now() - interval '7 days';

  RETURN jsonb_build_object(
    'deliveries_scheduled', v_count,
    'engine', 'subscription_renewal_v2'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_ritual_renewals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_ritual_renewals() TO service_role;