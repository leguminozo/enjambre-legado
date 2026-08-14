-- =============================================================================
-- 20260812085000 — Únete al Enjambre: RPC de bienvenida
--
-- Acredita los puntos de bienvenida (beneficios_enjambre.welcome_points) al
-- usuario autenticado la PRIMERA vez que se une al Enjambre.
--
-- Idempotencia por índice único parcial: el INSERT en loyalty_transactions
-- actúa de lock; si ya existe la transacción 'bienvenida', ON CONFLICT no
-- inserta y se devuelve already_member SIN acreditar dos veces.
--
-- Por qué la empresa nunca puede ser NULL: agregar_puntos_usuario localiza la
-- fila con `empresa_id = p_empresa_id`; con NULL la condición nunca matchea
-- (NULL = NULL es NULL) y crearía una fila NUEVA en cada llamada, duplicando
-- el saldo. Se resuelve la primera empresa (patrón checkout de núcleo) y si
-- no existe, se aborta sin acreditar.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_bienvenida
  ON public.loyalty_transactions (user_id)
  WHERE action_type = 'bienvenida';

CREATE OR REPLACE FUNCTION public.unirse_al_enjambre()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_puntos integer;
  v_empresa_id uuid;
  v_saldo_nuevo integer;
  v_balance integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  -- Puntos de bienvenida desde la config central (fallback 100 si falta).
  SELECT valor_numerico::int INTO v_puntos
  FROM public.beneficios_enjambre
  WHERE clave = 'welcome_points';
  IF v_puntos IS NULL THEN
    v_puntos := 100;
  END IF;

  -- INSERT primero: el índice único parcial serializa la unión.
  INSERT INTO public.loyalty_transactions
    (user_id, action_type, points, balance_after, source_id, description)
  VALUES
    (v_user_id, 'bienvenida', v_puntos, 0, 'footer_enjambre', 'Bienvenida: unión al Enjambre')
  ON CONFLICT DO NOTHING
  RETURNING balance_after INTO v_balance;

  IF v_balance IS NULL THEN
    -- Ya miembro: devolver saldo actual sin acreditar de nuevo.
    SELECT COALESCE(SUM(puntos), 0)::int INTO v_balance
    FROM public.puntos_fidelizacion
    WHERE user_id = v_user_id;
    RETURN jsonb_build_object('status', 'already_member', 'puntos', v_balance);
  END IF;

  -- Empresa default (mismo patrón que checkout.ts de núcleo); NULL aborta.
  SELECT id INTO v_empresa_id
  FROM public.empresas
  ORDER BY created_at
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'empresa_no_configurada');
  END IF;

  PERFORM public.agregar_puntos_usuario(
    v_user_id, v_empresa_id, v_puntos, NULL, 'bienvenida_enjambre',
    jsonb_build_object('origen', 'footer_enjambre')
  );

  SELECT COALESCE(SUM(puntos), 0)::int INTO v_saldo_nuevo
  FROM public.puntos_fidelizacion
  WHERE user_id = v_user_id;

  UPDATE public.loyalty_transactions
  SET balance_after = v_saldo_nuevo
  WHERE user_id = v_user_id AND action_type = 'bienvenida';

  RETURN jsonb_build_object('status', 'joined', 'puntos', v_saldo_nuevo);
END;
$$;

-- El RPC es invocable por el usuario autenticado (la página del hub lo llama
-- con el client del usuario); nunca por anónimos.
REVOKE ALL ON FUNCTION public.unirse_al_enjambre() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unirse_al_enjambre() TO authenticated, service_role;
