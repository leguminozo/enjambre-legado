-- Migration 42: Idempotent Loyalty Redemption RPC

-- Bootstrap loyalty tables if migration 41 was never applied on remote
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('exclusive_harvest', 'territorial_content', 'early_access', 'experience')),
  metadata jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id),
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'expired')),
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type public.accion_tipo NOT NULL,
  points integer NOT NULL,
  balance_after integer NOT NULL,
  source_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 1. Add 'canje' to accion_tipo if it doesn't exist
DO $$ BEGIN
  ALTER TYPE public.accion_tipo ADD VALUE IF NOT EXISTS 'canje';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 2. Add idempotency_key to loyalty_redemptions
ALTER TABLE public.loyalty_redemptions
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_redemptions_idempotency
  ON public.loyalty_redemptions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3. Create the RPC function
CREATE OR REPLACE FUNCTION public.redeem_loyalty_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_idempotency_key text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost integer;
  v_balance integer;
  v_reward_name text;
  v_active boolean;
  v_new_balance integer;
  v_redemption_id uuid;
BEGIN
  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, points_spent INTO v_redemption_id, v_cost
    FROM loyalty_redemptions
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN json_build_object(
        'success', true,
        'message', 'Already redeemed',
        'redemption_id', v_redemption_id,
        'points_spent', v_cost
      );
    END IF;
  END IF;

  -- 2. Fetch Reward
  SELECT points_cost, name, active INTO v_cost, v_reward_name, v_active
  FROM loyalty_rewards
  WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Reward not found', 'status', 404);
  END IF;

  IF NOT v_active THEN
    RETURN json_build_object('error', 'Reward unavailable', 'status', 400);
  END IF;

  -- 3. Fetch and lock profile balance
  SELECT puntos_acumulados INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Row-level lock prevents race conditions

  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  IF v_balance < v_cost THEN
    RETURN json_build_object('error', 'Insufficient points', 'status', 400, 'balance', v_balance, 'cost', v_cost);
  END IF;

  -- 4. Deduct points
  v_new_balance := v_balance - v_cost;
  
  UPDATE profiles 
  SET puntos_acumulados = v_new_balance 
  WHERE id = p_user_id;

  -- 5. Record Transaction
  INSERT INTO loyalty_transactions (user_id, action_type, points, balance_after, source_id, description)
  VALUES (
    p_user_id,
    'canje',
    -v_cost,
    v_new_balance,
    p_reward_id::text,
    CONCAT('Canje: ', v_reward_name)
  );

  -- 6. Record Redemption
  INSERT INTO loyalty_redemptions (user_id, reward_id, points_spent, status, idempotency_key)
  VALUES (p_user_id, p_reward_id, v_cost, 'pending', p_idempotency_key)
  RETURNING id INTO v_redemption_id;

  RETURN json_build_object(
    'success', true,
    'reward', v_reward_name,
    'points_spent', v_cost,
    'new_balance', v_new_balance,
    'redemption_id', v_redemption_id
  );
END;
$$;
