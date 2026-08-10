-- =============================================================================
-- Planes de temporada (one-shot anual) — el "producto estrella" del modelo:
-- se cobra una vez al año, idealmente post-cosecha (marzo–abril), cuando el
-- apicultor tiene plata, en vez de perseguir 12 cobros mensuales.
--
-- - frequency 'season' se suma al CHECK existente (monthly/quarterly/annual).
-- - El cobro one-shot (Transbank/transferencia) lo maneja el checkout de
--   nucleo; aquí solo existen las filas de catálogo para que la página
--   pública /planes-territoriales muestre precios reales desde la DB.
-- - Los keys llevan sufijo _temporada para no colisionar con los mensuales.
-- =============================================================================

ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_frequency_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_frequency_check
  CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'season'));

INSERT INTO public.subscription_plans (name, key, price_clp, frequency, description, included_items, active)
SELECT v.name, v.key, v.price_clp, v.frequency, v.description, v.included_items::jsonb, true
FROM (VALUES
  (
    'Trazabilidad Temporada',
    'trazabilidad_temporada',
    29990,
    'season',
    'Pasaportes QR ilimitados por lote por una temporada completa, en un solo pago anual (ideal post-cosecha). Incluye página pública de lotes, estadísticas de escaneos y descarga de QR para etiquetas.',
    '[{"type":"digital","feature":"pasaportes_qr_ilimitados"},{"type":"digital","feature":"estadisticas_escaneos"}]'
  ),
  (
    'Apiario Pro Temporada',
    'apiario_pro_temporada',
    59990,
    'season',
    'Todo lo de Trazabilidad + Cuaderno de Campo digital conforme a Res. SAG 4590/2025 por una temporada completa, en un solo pago anual: registros sanitarios, tratamientos varroa/nosema, muestreos y respaldo exportable PDF para fiscalización.',
    '[{"type":"digital","feature":"pasaportes_qr_ilimitados"},{"type":"digital","feature":"estadisticas_escaneos"},{"type":"digital","feature":"cuaderno_campo_res_4590"}]'
  )
) AS v(name, key, price_clp, frequency, description, included_items)
ON CONFLICT (key) DO NOTHING;
