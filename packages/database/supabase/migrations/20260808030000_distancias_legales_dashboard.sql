-- =============================================================================
-- Semana 3-4 — Distancias legales (Ley 21.102) + planes digitales territoriales.
--
-- 1. apiarios_externos: evidencia de verificación de distancia mínima legal
--    (500 m – 2,2 km según carga, zona Valparaíso–Los Lagos). Las coordenadas
--    son aproximadas (±1 km) → la verificación es indicativa y las
--    declaraciones que la violan quedan en estado 'suspendido' para revisión
--    humana antes de hacerse visibles para la red.
-- 2. Planes Trazabilidad / Apiario Pro (suscripción mensual, Flow Pago
--    Automático). included_items marcados como digitales para que el motor
--    de entregas físicas (subscription_deliveries) no los agende.
-- 3. process_ritual_renewals: no "sanar" entregas de planes digitales.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Evidencia de distancia legal en declaraciones trashumantes
-- -----------------------------------------------------------------------------
ALTER TABLE public.apiarios_externos
  ADD COLUMN IF NOT EXISTS distancia_verificada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS distancia_minima_km NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS distancia_km_menor NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS distancia_verificada_at TIMESTAMPTZ;

COMMENT ON COLUMN public.apiarios_externos.distancia_verificada IS
  'true si la declaración cumple la distancia mínima legal (Ley 21.102) al apiario registrado más cercano; false si quedó suspendida por violación o se declaró sin coordenadas.';

-- -----------------------------------------------------------------------------
-- 2. Planes digitales territoriales (precios de lanzamiento — ajustables en
--    una fila de subscription_plans)
-- -----------------------------------------------------------------------------
INSERT INTO public.subscription_plans (name, key, price_clp, frequency, description, included_items, active)
SELECT v.name, v.key, v.price_clp, v.frequency, v.description, v.included_items::jsonb, true
FROM (VALUES
  (
    'Trazabilidad',
    'trazabilidad',
    2990,
    'monthly',
    'Pasaportes QR ilimitados por lote, página pública personalizada, estadísticas de escaneos y descarga de QR para etiquetas.',
    '[{"type":"digital","feature":"pasaportes_qr_ilimitados"},{"type":"digital","feature":"estadisticas_escaneos"}]'
  ),
  (
    'Apiario Pro',
    'apiario_pro',
    5990,
    'monthly',
    'Todo lo de Trazabilidad + Cuaderno de Campo digital conforme a Res. SAG 4590/2025: registros sanitarios, tratamientos varroa/nosema, muestreos y respaldo exportable PDF para fiscalización.',
    '[{"type":"digital","feature":"pasaportes_qr_ilimitados"},{"type":"digital","feature":"estadisticas_escaneos"},{"type":"digital","feature":"cuaderno_campo_res_4590"}]'
  )
) AS v(name, key, price_clp, frequency, description, included_items)
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. RPC de renovación v3: no sanar entregas de planes digitales (no hay
--    envío físico; la entrega sería ruido de auditoría)
-- -----------------------------------------------------------------------------
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

  -- Heal: entregas de períodos pagados (subscription_charges paid) sin delivery.
  -- Los planes digitales (included_items contiene {"type":"digital"}) no
  -- agendan entregas físicas y no deben sanearse.
  INSERT INTO subscription_deliveries (subscription_id, period_number, scheduled_for, items, status)
  SELECT sc.subscription_id, sc.period_number, s.current_period_end, COALESCE(p.included_items, '[]'::jsonb), 'scheduled'
  FROM subscription_charges sc
  JOIN subscriptions s ON s.id = sc.subscription_id
  JOIN subscription_plans p ON p.id = s.plan_id
  WHERE sc.status = 'paid'
    AND NOT (p.included_items @> '[{"type":"digital"}]'::jsonb)
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
