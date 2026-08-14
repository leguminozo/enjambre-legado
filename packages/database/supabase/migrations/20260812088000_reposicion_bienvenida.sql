-- =============================================================================
-- 20260812088000 — Bienvenida de Reposición: 100 pts en la primera activación
--
-- Cumple la promesa de marketing "100 pts al activar la Reposición"
-- (canje-impacto-client.tsx, copy que estaba muerto). El monto vive en
-- beneficios_enjambre.reposicion_pts (editable desde núcleo).
--
-- Idempotencia por índice único parcial: una sola vez por usuario, aunque la
-- suscripción se pause y se reactive (la promesa es de bienvenida, no por
-- ciclo). Best-effort como el trigger del POS: si no hay empresa, no
-- acredita pero nunca bloquea el cambio de estado de la suscripción.
-- =============================================================================

INSERT INTO public.beneficios_enjambre (clave, valor_numerico, descripcion)
VALUES ('reposicion_pts', 100, 'Puntos al activar la Reposición (primera vez)')
ON CONFLICT (clave) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_reposicion
  ON public.loyalty_transactions (user_id)
  WHERE action_type = 'reposicion';

CREATE OR REPLACE FUNCTION public.grant_reposicion_bienvenida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_puntos integer;
  v_empresa_id uuid;
  v_balance integer;
BEGIN
  -- El INSERT primero: el índice único parcial serializa la primera activación.
  INSERT INTO public.loyalty_transactions
    (user_id, action_type, points, balance_after, source_id, description)
  VALUES
    (NEW.user_id, 'reposicion', 0, 0, 'reposicion', 'Bienvenida: activación de la Reposición')
  ON CONFLICT DO NOTHING
  RETURNING balance_after INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN NEW; -- ya acreditado en una activación anterior
  END IF;

  SELECT valor_numerico::int INTO v_puntos
  FROM public.beneficios_enjambre
  WHERE clave = 'reposicion_pts';
  IF v_puntos IS NULL OR v_puntos <= 0 THEN
    v_puntos := 100;
  END IF;

  -- Empresa default (mismo patrón que checkout.ts); NULL → best-effort, no acredita.
  SELECT id INTO v_empresa_id
  FROM public.empresas
  ORDER BY created_at
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.agregar_puntos_usuario(
    NEW.user_id, v_empresa_id, v_puntos, NULL, 'reposicion_activada',
    jsonb_build_object('origen', 'suscripcion', 'plan_id', NEW.plan_id::text)
  );

  SELECT COALESCE(SUM(puntos), 0)::int INTO v_balance
  FROM public.puntos_fidelizacion
  WHERE user_id = NEW.user_id;

  UPDATE public.loyalty_transactions
  SET points = v_puntos, balance_after = v_balance
  WHERE user_id = NEW.user_id AND action_type = 'reposicion';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reposicion_bienvenida ON public.subscriptions;
CREATE TRIGGER trg_reposicion_bienvenida
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION public.grant_reposicion_bienvenida();
