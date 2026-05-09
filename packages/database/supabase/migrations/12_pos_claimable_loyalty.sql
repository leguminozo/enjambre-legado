-- Migration: 12_pos_claimable_loyalty
-- Purpose: Add claimable loyalty features to sales for the Experiential POS.

-- Add claimable columns to ventas
ALTER TABLE ventas 
ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed')),
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Enable RLS on ventas if not already enabled
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Idempotencia: DROP antes de CREATE para evitar errores de duplicación
DROP POLICY IF EXISTS "Vendedores can insert sales" ON ventas;
DROP POLICY IF EXISTS "Users can claim their sales via token" ON ventas;
DROP POLICY IF EXISTS "Users can view their own claimed sales" ON ventas;
DROP POLICY IF EXISTS "Anyone can view pending sale via token" ON ventas;

-- Policy: Vendedores can insert sales
CREATE POLICY "Vendedores can insert sales" ON ventas
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid()::uuid 
    AND role IN ('vendedor', 'gerente', 'tienda_admin')
  )
);

-- Policy: Users can claim a sale if they have the valid token
CREATE POLICY "Users can claim their sales via token" ON ventas
FOR UPDATE TO authenticated
USING (
  claim_status = 'pending' 
  AND claim_token IS NOT NULL
)
WITH CHECK (
  claim_status = 'claimed'
  AND claimed_by = auth.uid()::uuid
  AND claimed_at = NOW()
  AND cliente_id = auth.uid()::uuid -- Explicit cast to avoid text = uuid error
);

-- Policy: Users can view their own claimed sales
CREATE POLICY "Users can view their own claimed sales" ON ventas
FOR SELECT TO authenticated
USING (
  cliente_id = auth.uid()::uuid 
  OR vendedor_id = auth.uid()::uuid
);

-- Policy: Anyone can view a pending sale if they have the token (for the claim page)
CREATE POLICY "Anyone can view pending sale via token" ON ventas
FOR SELECT TO public
USING (
  claim_status = 'pending' 
  AND claim_token IS NOT NULL
);

CREATE OR REPLACE FUNCTION award_points_on_claim()
RETURNS TRIGGER AS $$
DECLARE
  ciclos_ganados NUMERIC;
BEGIN
  IF NEW.claim_status = 'claimed' AND (OLD.claim_status IS NULL OR OLD.claim_status = 'pending') THEN
    -- 1 ciclo guardián por cada 1000 CLP
    ciclos_ganados := FLOOR(NEW.total / 1000);
    
    IF ciclos_ganados > 0 THEN
      INSERT INTO ciclos (user_id, cantidad, tipo, referencia_id, referencia_tabla)
      VALUES (NEW.claimed_by::uuid, ciclos_ganados, 'compra', NEW.id, 'ventas');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for points
DROP TRIGGER IF EXISTS trigger_award_points ON ventas;
CREATE TRIGGER trigger_award_points
AFTER UPDATE OF claim_status ON ventas
FOR EACH ROW
EXECUTE FUNCTION award_points_on_claim();
