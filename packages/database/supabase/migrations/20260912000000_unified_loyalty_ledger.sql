-- =============================================================================
-- 20260912000000 — Motor Canónico de Lealtad y Economía Biocultural
--
-- Unifica los ledgers fragmentados (puntos_fidelizacion, ciclos, guardian_stamps,
-- fid_*) en una arquitectura event-driven con libro mayor inmutable y balances
-- atómicos, garantizando compatibilidad hacia atrás y bloqueo estricto anti-stacking.
-- =============================================================================

-- ── 1. Libro Mayor Inmutable de Eventos de Lealtad ───────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_events_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  canal TEXT NOT NULL CHECK (canal IN ('web', 'campo_pos', 'b2b_mesa', 'club', 'admin')),
  tipo_evento TEXT NOT NULL CHECK (
    tipo_evento IN (
      'compra_completada',
      'ticket_reclamado',
      'resena_aprobada',
      'frasco_retornado',
      'bienvenida_registro',
      'bienvenida_reposicion',
      'canje_checkout',
      'ajuste_manual'
    )
  ),
  delta_puntos INT NOT NULL DEFAULT 0,
  delta_ciclos NUMERIC NOT NULL DEFAULT 0 CHECK (delta_ciclos >= 0 OR tipo_evento = 'ajuste_manual'),
  referencia_tipo TEXT,
  referencia_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_user
  ON public.loyalty_events_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_events_ref
  ON public.loyalty_events_ledger (referencia_tipo, referencia_id);

COMMENT ON TABLE public.loyalty_events_ledger IS
  'Libro mayor inmutable y canónico de eventos de lealtad. Idempotente por clave única.';

-- ── 2. Tabla de Balances Agregados de Alta Velocidad ─────────────────────────
CREATE TABLE IF NOT EXISTS public.loyalty_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  puntos_canjeables INT NOT NULL DEFAULT 0 CHECK (puntos_canjeables >= 0),
  ciclos_historicos NUMERIC NOT NULL DEFAULT 0 CHECK (ciclos_historicos >= 0),
  tier_actual TEXT NOT NULL DEFAULT 'OBRERA',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.loyalty_balances IS
  'Balance agregado en tiempo real por custodio: puntos canjeables CLP, ciclos acumulados y tier.';

-- ── 3. Backfill inicial desde profiles, puntos_fidelizacion y ciclos ─────────
INSERT INTO public.loyalty_balances (user_id, puntos_canjeables, ciclos_historicos, tier_actual, updated_at)
SELECT
  p.id AS user_id,
  COALESCE(pf.puntos, 0) AS puntos_canjeables,
  COALESCE(c.total_ciclos, 0) AS ciclos_historicos,
  COALESCE(p.nivel_guardian, 'OBRERA') AS tier_actual,
  now()
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, SUM(puntos)::int AS puntos
  FROM public.puntos_fidelizacion
  GROUP BY user_id
) pf ON pf.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(cantidad) AS total_ciclos
  FROM public.ciclos
  GROUP BY user_id
) c ON c.user_id = p.id
ON CONFLICT (user_id) DO UPDATE SET
  puntos_canjeables = EXCLUDED.puntos_canjeables,
  ciclos_historicos = EXCLUDED.ciclos_historicos,
  tier_actual = EXCLUDED.tier_actual,
  updated_at = now();

-- ── 4. RLS y Permisos ───────────────────────────────────────────────────────
ALTER TABLE public.loyalty_events_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_events_read_own" ON public.loyalty_events_ledger;
CREATE POLICY "loyalty_events_read_own"
  ON public.loyalty_events_ledger FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_events_admin_all" ON public.loyalty_events_ledger;
CREATE POLICY "loyalty_events_admin_all"
  ON public.loyalty_events_ledger FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "loyalty_balances_read_own" ON public.loyalty_balances;
CREATE POLICY "loyalty_balances_read_own"
  ON public.loyalty_balances FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loyalty_balances_admin_all" ON public.loyalty_balances;
CREATE POLICY "loyalty_balances_admin_all"
  ON public.loyalty_balances FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.loyalty_events_ledger TO authenticated;
GRANT SELECT ON public.loyalty_balances TO authenticated;

-- ── 5. Función RPC Atómica Canónica ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_evento_lealtad_canonica(
  p_idempotency_key TEXT,
  p_user_id UUID,
  p_actor_id UUID,
  p_canal TEXT,
  p_tipo_evento TEXT,
  p_delta_puntos INT,
  p_delta_ciclos NUMERIC,
  p_referencia_tipo TEXT DEFAULT NULL,
  p_referencia_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_saldo_puntos INT;
  v_saldo_ciclos NUMERIC;
  v_nuevo_puntos INT;
  v_nuevo_ciclos NUMERIC;
  v_tier TEXT;
  v_empresa_id UUID;
BEGIN
  -- 1. Idempotencia segura
  IF EXISTS (
    SELECT 1 FROM public.loyalty_events_ledger
    WHERE idempotency_key = p_idempotency_key
  ) THEN
    SELECT puntos_canjeables, ciclos_historicos, tier_actual
    INTO v_saldo_puntos, v_saldo_ciclos, v_tier
    FROM public.loyalty_balances
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'saldo_puntos', COALESCE(v_saldo_puntos, 0),
      'saldo_ciclos', COALESCE(v_saldo_ciclos, 0),
      'tier', COALESCE(v_tier, 'OBRERA')
    );
  END IF;

  -- 2. Asegurar fila de balance con bloqueo exclusivo
  INSERT INTO public.loyalty_balances (user_id, puntos_canjeables, ciclos_historicos, tier_actual, updated_at)
  VALUES (p_user_id, 0, 0, 'OBRERA', now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT puntos_canjeables, ciclos_historicos, tier_actual
  INTO v_saldo_puntos, v_saldo_ciclos, v_tier
  FROM public.loyalty_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 3. Validar no negatividad de puntos (ej. en canje)
  v_nuevo_puntos := v_saldo_puntos + p_delta_puntos;
  IF v_nuevo_puntos < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_points',
      'saldo_actual', v_saldo_puntos,
      'puntos_solicitados', -p_delta_puntos
    );
  END IF;

  v_nuevo_ciclos := v_saldo_ciclos + GREATEST(0, p_delta_ciclos);

  -- 4. Registrar en libro mayor inmutable
  INSERT INTO public.loyalty_events_ledger (
    idempotency_key,
    user_id,
    actor_id,
    canal,
    tipo_evento,
    delta_puntos,
    delta_ciclos,
    referencia_tipo,
    referencia_id,
    metadata
  ) VALUES (
    p_idempotency_key,
    p_user_id,
    p_actor_id,
    p_canal,
    p_tipo_evento,
    p_delta_puntos,
    p_delta_ciclos,
    p_referencia_tipo,
    p_referencia_id,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- 5. Actualizar balances agregados
  UPDATE public.loyalty_balances
  SET
    puntos_canjeables = v_nuevo_puntos,
    ciclos_historicos = v_nuevo_ciclos,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 6. Sincronización refleja con tablas legacy (cero regresiones)
  SELECT id INTO v_empresa_id FROM public.empresas ORDER BY created_at LIMIT 1;

  IF v_empresa_id IS NOT NULL THEN
    INSERT INTO public.puntos_fidelizacion (user_id, empresa_id, puntos, updated_at)
    VALUES (p_user_id, v_empresa_id, v_nuevo_puntos, now())
    ON CONFLICT (user_id, empresa_id)
    DO UPDATE SET puntos = v_nuevo_puntos, updated_at = now();

    IF p_delta_puntos <> 0 THEN
      INSERT INTO public.puntos_transacciones (
        user_id, empresa_id, venta_id, tipo, puntos,
        saldo_anterior, saldo_nuevo, motivo, metadata
      ) VALUES (
        p_user_id,
        v_empresa_id,
        CASE WHEN p_referencia_tipo = 'ventas' THEN p_referencia_id ELSE NULL END,
        CASE WHEN p_delta_puntos > 0 THEN 'ganado' ELSE 'canjeado' END,
        p_delta_puntos,
        v_saldo_puntos,
        v_nuevo_puntos,
        p_tipo_evento,
        jsonb_build_object('idempotency_key', p_idempotency_key, 'canal', p_canal)
      );
    END IF;
  END IF;

  IF p_delta_ciclos > 0 THEN
    INSERT INTO public.ciclos (user_id, cantidad, tipo, referencia_id, referencia_tabla)
    VALUES (
      p_user_id,
      p_delta_ciclos,
      CASE WHEN p_tipo_evento = 'resena_aprobada' THEN 'resena' ELSE 'compra' END,
      p_referencia_id,
      COALESCE(p_referencia_tipo, 'general')
    );
  END IF;

  -- 7. Evaluar y actualizar tier
  v_tier := public.evaluar_tier_cliente(p_user_id);

  UPDATE public.loyalty_balances
  SET tier_actual = v_tier
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'saldo_puntos', v_nuevo_puntos,
    'saldo_ciclos', v_nuevo_ciclos,
    'tier', v_tier,
    'delta_puntos', p_delta_puntos,
    'delta_ciclos', p_delta_ciclos
  );
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_evento_lealtad_canonica(TEXT, UUID, UUID, TEXT, TEXT, INT, NUMERIC, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_evento_lealtad_canonica(TEXT, UUID, UUID, TEXT, TEXT, INT, NUMERIC, TEXT, TEXT, JSONB) TO service_role, authenticated;

-- ── 6. Integración con Reclamo de Venta Presencial (Campo POS ➔ Tienda) ──────
CREATE OR REPLACE FUNCTION public.award_points_on_claim()
RETURNS TRIGGER AS $$
DECLARE
  v_puntos INT;
  v_ciclos NUMERIC;
BEGIN
  IF NEW.claim_status = 'claimed' AND (OLD.claim_status IS NULL OR OLD.claim_status = 'pending') AND NEW.claimed_by IS NOT NULL THEN
    v_puntos := FLOOR(COALESCE(NEW.total, 0) / 100);
    v_ciclos := FLOOR(COALESCE(NEW.total, 0) / 1000);

    PERFORM public.registrar_evento_lealtad_canonica(
      'claim:' || NEW.id::text,
      NEW.claimed_by::uuid,
      NEW.claimed_by::uuid,
      'campo_pos',
      'ticket_reclamado',
      v_puntos,
      v_ciclos,
      'ventas',
      NEW.id::text,
      jsonb_build_object('total', NEW.total, 'claim_token', NEW.claim_token)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_award_points ON public.ventas;
CREATE TRIGGER trigger_award_points
AFTER UPDATE OF claim_status ON public.ventas
FOR EACH ROW
EXECUTE FUNCTION public.award_points_on_claim();
