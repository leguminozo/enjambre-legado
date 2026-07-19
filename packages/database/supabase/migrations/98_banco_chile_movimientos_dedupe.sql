-- 98: Dedupe key for bank movements (sync re-run must not multiply rows)
-- Go-live: POST /banco-chile/sync upserts on (cuenta_id, external_key).

ALTER TABLE public.banco_chile_movimientos
  ADD COLUMN IF NOT EXISTS external_key TEXT;

-- Backfill stable key for existing rows
UPDATE public.banco_chile_movimientos
SET external_key = COALESCE(
  NULLIF(TRIM(numero_operacion), ''),
  md5(
    COALESCE(fecha_contable::text, '') || '|' ||
    COALESCE(monto::text, '') || '|' ||
    COALESCE(tipo, '') || '|' ||
    COALESCE(LEFT(descripcion, 120), '')
  )
)
WHERE external_key IS NULL OR TRIM(external_key) = '';

-- Drop exact duplicate rows keeping the oldest id per (cuenta_id, external_key)
DELETE FROM public.banco_chile_movimientos a
USING public.banco_chile_movimientos b
WHERE a.cuenta_id = b.cuenta_id
  AND a.external_key IS NOT NULL
  AND b.external_key IS NOT NULL
  AND a.external_key = b.external_key
  AND a.ctid > b.ctid;

-- Full unique for PostgREST onConflict=cuenta_id,external_key
ALTER TABLE public.banco_chile_movimientos
  ALTER COLUMN external_key SET DEFAULT '';

-- Ensure no nulls before constraint
UPDATE public.banco_chile_movimientos
SET external_key = id::text
WHERE external_key IS NULL OR TRIM(external_key) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'banco_chile_movimientos_cuenta_external_key_key'
  ) THEN
    ALTER TABLE public.banco_chile_movimientos
      ADD CONSTRAINT banco_chile_movimientos_cuenta_external_key_key
      UNIQUE (cuenta_id, external_key);
  END IF;
END $$;

COMMENT ON COLUMN public.banco_chile_movimientos.external_key IS
  'Idempotency key: numero_operacion or hash(fecha|monto|tipo|descripcion)';
