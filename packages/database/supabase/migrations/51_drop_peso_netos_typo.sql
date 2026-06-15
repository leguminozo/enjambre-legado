-- Drop the typo column; all code now uses peso_neto_g
ALTER TABLE productos DROP COLUMN IF EXISTS peso_netos;
