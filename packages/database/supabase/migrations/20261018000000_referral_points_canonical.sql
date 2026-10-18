-- Canoniza los puntos de referidos al ledger unificado.
-- Antes caían en profiles.puntos_acumulados (saldo muerto desde 20260802160000):
-- invisibles en billetera y no canjeables.

CREATE OR REPLACE FUNCTION public.complete_referral_signup(
  p_referrer_id uuid,
  p_new_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_exists boolean;
  v_existing_referrer uuid;
  v_points integer := 50;
  v_canonical jsonb;
  v_new_balance integer;
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

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_referrer_id) INTO v_referrer_exists;
  IF NOT v_referrer_exists THEN
    RETURN json_build_object('error', 'Referrer not found', 'status', 404);
  END IF;

  SELECT referred_by INTO v_existing_referrer
  FROM public.profiles
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

  UPDATE public.profiles
  SET referred_by = p_referrer_id
  WHERE id = p_new_user_id;

  v_canonical := public.registrar_evento_lealtad_canonica(
    'referral_signup:' || p_new_user_id::text,
    p_referrer_id,
    NULL,
    'tienda',
    'referido_signup',
    v_points,
    0,
    'profiles',
    p_new_user_id::text,
    jsonb_build_object('source', 'referral_signup')
  );

  IF COALESCE((v_canonical ->> 'success')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'referral credit rejected by canonical ledger: %', v_canonical;
  END IF;

  v_new_balance := COALESCE((v_canonical ->> 'saldo_puntos')::integer, 0);

  INSERT INTO public.loyalty_transactions (
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

-- Backfill idempotente: canoniza los créditos históricos que quedaron atrapados
-- en el saldo muerto. La clave referral_backfill:<user> garantiza una sola pasada.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id, (COUNT(*) * 50)::integer AS points
    FROM public.loyalty_transactions
    WHERE action_type = 'referido'
    GROUP BY user_id
  LOOP
    PERFORM public.registrar_evento_lealtad_canonica(
      'referral_backfill:' || r.user_id::text,
      r.user_id,
      NULL,
      'tienda',
      'referido_signup_backfill',
      r.points,
      0,
      'profiles',
      NULL,
      jsonb_build_object('source', 'referral_backfill')
    );
  END LOOP;
END;
$$;
