-- Reposición con Pago Automático Flow (plan aprobado)
-- El cobro recurrente lo ejecuta Flow; este esquema guarda la inscripción,
-- los cargos (idempotencia/auditoría) y corrige el RPC de renovación.

-- 1. Inscripción recurrente en subscriptions (token + buyOrder de la inscripción)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS flow_inscription_token TEXT,
ADD COLUMN IF NOT EXISTS flow_inscription_buy_order TEXT;

-- 2. La sesión de checkout guarda el token de la inscripción para el fulfill
ALTER TABLE public.subscription_checkout_sessions
ADD COLUMN IF NOT EXISTS recurring_token TEXT;

-- 3. Cargos recurrentes (cada webhook de Flow = un cargo; flow_order único = idempotencia)
CREATE TABLE IF NOT EXISTS public.subscription_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  period_number INT NOT NULL,
  flow_order BIGINT NOT NULL UNIQUE,
  amount INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'failed')),
  charged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_charges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_charges FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_charges TO service_role;

CREATE INDEX IF NOT EXISTS idx_subscription_charges_sub
  ON public.subscription_charges (subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_charges_period
  ON public.subscription_charges (subscription_id, period_number);

-- 4. RPC v3: ya NO rueda períodos sin pago (eso lo hace el cargo de Flow vía
--    webhook). Este cron solo: (a) heala entregas de períodos ya pagados cuyo
--    webhook no completó la delivery, y (b) marca past_due las suscripciones
--    cuyo período venció sin cargo (gracia 7 días) — ahora sí alcanzable.
CREATE OR REPLACE FUNCTION public.process_ritual_renewals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_healed INT := 0;
  v_past_due INT := 0;
BEGIN
  PERFORM release_expired_stock_holds();

  -- Heal: entregas de períodos pagados (subscription_charges paid) sin delivery
  INSERT INTO subscription_deliveries (subscription_id, period_number, scheduled_for, items, status)
  SELECT sc.subscription_id, sc.period_number, s.current_period_end, COALESCE(p.included_items, '[]'::jsonb), 'scheduled'
  FROM subscription_charges sc
  JOIN subscriptions s ON s.id = sc.subscription_id
  JOIN subscription_plans p ON p.id = s.plan_id
  WHERE sc.status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM subscription_deliveries d
      WHERE d.subscription_id = sc.subscription_id
        AND d.period_number = sc.period_number
    );
  GET DIAGNOSTICS v_healed = ROW_COUNT;

  -- past_due: período vencido sin cargo (el webhook debió llegar el día del cargo)
  UPDATE subscriptions
  SET status = 'past_due', updated_at = now()
  WHERE status IN ('active', 'trialing')
    AND current_period_end < now() - interval '7 days';
  GET DIAGNOSTICS v_past_due = ROW_COUNT;

  RETURN jsonb_build_object(
    'deliveries_healed', v_healed,
    'marked_past_due', v_past_due,
    'engine', 'subscription_renewal_v3_flow'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_ritual_renewals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_ritual_renewals() TO service_role;
