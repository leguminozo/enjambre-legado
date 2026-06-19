-- Migration: 59_sumup_pos_terminal
-- Purpose: Add SumUp terminal integration columns to ventas for POS reader checkout tracking

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS sumup_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS sumup_transaction_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ventas_sumup_checkout ON ventas (sumup_checkout_id) WHERE sumup_checkout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_sumup_transaction ON ventas (sumup_transaction_id) WHERE sumup_transaction_id IS NOT NULL;

COMMENT ON COLUMN ventas.sumup_checkout_id IS 'SumUp reader checkout ID when payment processed via POS terminal';
COMMENT ON COLUMN ventas.sumup_transaction_id IS 'SumUp transaction ID after successful terminal payment';
