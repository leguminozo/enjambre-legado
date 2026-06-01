-- Migration: 20_ventas_web_columns
-- Purpose: Add columns needed for web checkout (Flow.cl + Transbank)

-- Add web checkout columns to ventas
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS buy_order TEXT,
ADD COLUMN IF NOT EXISTS auth_code TEXT,
ADD COLUMN IF NOT EXISTS direccion_envio JSONB,
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS origen TEXT CHECK (origen IN ('local','web','pos','feria','delivery','corporativo','referido'));

-- Index for looking up sales by payment order
CREATE INDEX IF NOT EXISTS idx_ventas_buy_order ON ventas (buy_order) WHERE buy_order IS NOT NULL;

-- Index for looking up sales by cliente (customer's order history)
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas (cliente_id) WHERE cliente_id IS NOT NULL;

-- Atomic stock decrement: prevents race conditions during concurrent checkouts
CREATE OR REPLACE FUNCTION decrement_stock(p_id UUID, p_qty INT)
RETURNS TABLE (id UUID, stock INT) AS $$
UPDATE productos
SET stock = GREATEST(0, stock - p_qty)
WHERE id = p_id AND (stock IS NULL OR stock >= p_qty)
RETURNING productos.id, productos.stock;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS policy: allow service role to insert web sales (checkout commit uses admin client)
-- The existing "Vendedores can insert sales" policy requires authenticated vendedor role,
-- which the web checkout flow doesn't have (anonymous buyers).
-- We add a separate policy for the service role path used by the checkout API.
DROP POLICY IF EXISTS "Service role can insert web sales" ON ventas;
CREATE POLICY "Service role can insert web sales" ON ventas
  FOR INSERT
  WITH CHECK (origen = 'web');

-- Allow service role to update stock atomically via decrement_stock RPC
-- (SECURITY DEFINER on the function already bypasses RLS, but we keep this for clarity)
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO authenticated, anon, service_role;
