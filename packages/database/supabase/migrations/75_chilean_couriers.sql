-- Migration 75: Couriers chilenos — BlueExpress predeterminado, extensible por cliente.

ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS courier_code TEXT NOT NULL DEFAULT 'blueexpress',
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER NOT NULL DEFAULT 0
    CHECK (shipping_cost >= 0);

ALTER TABLE logistica_envios
  ADD COLUMN IF NOT EXISTS courier_code TEXT DEFAULT 'blueexpress',
  ADD COLUMN IF NOT EXISTS courier_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0
    CHECK (shipping_cost >= 0);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS courier_preferido TEXT DEFAULT 'blueexpress';

COMMENT ON COLUMN checkout_sessions.courier_code IS
  'Código de courier chileno elegido en checkout (default blueexpress).';
COMMENT ON COLUMN logistica_envios.courier_code IS
  'Courier asignado al envío; blueexpress si no se especifica otro.';
COMMENT ON COLUMN profiles.courier_preferido IS
  'Preferencia de courier del cliente para futuros pedidos.';

-- Backfill envíos existentes sin courier
UPDATE logistica_envios
SET courier_code = 'blueexpress'
WHERE courier_code IS NULL;

UPDATE logistica_envios
SET via = 'BlueExpress'
WHERE via IS NULL AND courier_code = 'blueexpress';