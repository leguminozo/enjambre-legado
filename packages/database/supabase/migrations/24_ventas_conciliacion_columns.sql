-- Migration: 24_ventas_conciliacion_columns
-- Purpose: Add empresa_id and conciliado columns to ventas for banco-chile conciliation

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id),
  ADD COLUMN IF NOT EXISTS conciliado BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ventas_empresa_id ON ventas (empresa_id) WHERE empresa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_conciliado ON ventas (conciliado) WHERE conciliado = false;
