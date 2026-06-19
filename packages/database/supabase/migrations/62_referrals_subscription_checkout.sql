-- Migration 62: Referral signup tracking + subscription checkout sessions (Flow)

-- Track who referred each guardian
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON public.profiles (referred_by)
  WHERE referred_by IS NOT NULL;

-- Persistent subscription payment sessions (prefix SUB-)
CREATE TABLE IF NOT EXISTS public.subscription_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_order text UNIQUE NOT NULL,
  session_id text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('transbank', 'flow')),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  total integer NOT NULL CHECK (total > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired')),
  payment_authorization_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sub_checkout_buy_order
  ON public.subscription_checkout_sessions (buy_order);

CREATE INDEX IF NOT EXISTS idx_sub_checkout_pending
  ON public.subscription_checkout_sessions (status)
  WHERE status = 'pending';

ALTER TABLE public.subscription_checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on subscription_checkout_sessions"
  ON public.subscription_checkout_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.subscription_checkout_sessions FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.subscription_checkout_sessions TO service_role;

-- Idempotent referral completion: link new user + credit referrer
CREATE OR REPLACE FUNCTION public.complete_referral_signup(
  p_referrer_id uuid,
  p_new_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_balance integer;
  v_new_balance integer;
  v_existing_referrer uuid;
  v_referrer_exists boolean;
  v_points integer := 50;
BEGIN
  IF p_referrer_id IS NULL OR p_new_user_id IS NULL THEN
    RETURN json_build_object('error', 'Missing referrer or user', 'status', 400);
  END IF;

  IF p_referrer_id = p_new_user_id THEN
    RETURN json_build_object('error', 'Self-referral not allowed', 'status', 400);
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_new_user_id THEN
    RETURN json_build_object('error', 'Unauthorized', 'status', 403);
  END IF;

  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_referrer_id) INTO v_referrer_exists;
  IF NOT v_referrer_exists THEN
    RETURN json_build_object('error', 'Referrer not found', 'status', 404);
  END IF;

  SELECT referred_by INTO v_existing_referrer
  FROM profiles
  WHERE id = p_new_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found', 'status', 404);
  END IF;

  IF v_existing_referrer IS NOT NULL THEN
    IF v_existing_referrer = p_referrer_id THEN
      RETURN json_build_object('success', true, 'already_completed', true, 'points_awarded', 0);
    END IF;
    RETURN json_build_object('error', 'Referral already attributed', 'status', 409);
  END IF;

  UPDATE profiles
  SET referred_by = p_referrer_id
  WHERE id = p_new_user_id;

  SELECT COALESCE(puntos_acumulados, 0) INTO v_referrer_balance
  FROM profiles
  WHERE id = p_referrer_id
  FOR UPDATE;

  v_new_balance := v_referrer_balance + v_points;

  UPDATE profiles
  SET puntos_acumulados = v_new_balance
  WHERE id = p_referrer_id;

  INSERT INTO loyalty_transactions (
    user_id, action_type, points, balance_after, source_id, description
  ) VALUES (
    p_referrer_id,
    'referido',
    v_points,
    v_new_balance,
    p_new_user_id::text,
    'Referido: nuevo guardián registrado'
  );

  RETURN json_build_object(
    'success', true,
    'already_completed', false,
    'points_awarded', v_points,
    'referrer_new_balance', v_new_balance
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_referral_signup(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_referral_signup(uuid, uuid) TO service_role;