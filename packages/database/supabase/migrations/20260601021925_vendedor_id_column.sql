-- Add vendedor_id column to ventas, backfilled from user_id
-- The commission calculation functions and triggers reference vendedor_id
-- but the live DB only has user_id. This column bridges the gap.

ALTER TABLE public.ventas
  ADD COLUMN IF NOT EXISTS vendedor_id UUID;

-- Backfill: copy user_id into vendedor_id for existing rows
UPDATE public.ventas
SET vendedor_id = user_id
WHERE vendedor_id IS NULL AND user_id IS NOT NULL;

-- Keep vendedor_id in sync with user_id on insert
DROP TRIGGER IF EXISTS trigger_sync_vendedor_id ON public.ventas;
CREATE OR REPLACE FUNCTION public.sync_vendedor_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vendedor_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.vendedor_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_vendedor_id
  BEFORE INSERT ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vendedor_id();
