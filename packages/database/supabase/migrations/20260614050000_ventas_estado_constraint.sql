-- Migration: ventas_estado_constraint
-- Purpose: Add CHECK constraint for ventas.estado to ensure valid payment states
-- Fixes: Prevents invalid states in ventas table, critical for payment flow reliability

-- First, update any existing invalid states to valid defaults
UPDATE ventas 
SET estado = 'pending' 
WHERE estado IS NULL OR estado NOT IN ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- Add CHECK constraint for estado
ALTER TABLE ventas 
ADD CONSTRAINT ventas_estado_check 
CHECK (estado IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- Add comment documenting the constraint
COMMENT ON CONSTRAINT ventas_estado_check ON ventas IS 'Valid payment states: pending (awaiting payment), paid (payment successful), failed (payment rejected), refunded (money returned), cancelled (order cancelled)';
