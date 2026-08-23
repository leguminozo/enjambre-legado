-- Fix del trigger de n_colmenas (20260823010000): el caso "colmena se
-- desvincula de su apiario" (UPDATE apiario_id → NULL) no refrescaba el
-- apiario viejo. Ahora v_ids se reduce al OLD cuando NEW es null.

CREATE OR REPLACE FUNCTION public.sync_apiario_registro_n_colmenas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ids uuid[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.apiario_id IS NULL THEN RETURN OLD; END IF;
    v_ids := ARRAY[OLD.apiario_id];
  ELSE
    v_ids := ARRAY[NEW.apiario_id];
    IF TG_OP = 'UPDATE' AND OLD.apiario_id IS DISTINCT FROM NEW.apiario_id THEN
      IF NEW.apiario_id IS NULL THEN
        v_ids := ARRAY[OLD.apiario_id];
      ELSIF OLD.apiario_id IS NOT NULL THEN
        v_ids := v_ids || ARRAY[OLD.apiario_id];
      END IF;
    END IF;
  END IF;

  UPDATE public.apiarios_registro ar
  SET n_colmenas = (
        SELECT count(*) FROM public.colmenas c
        WHERE c.apiario_id = v
      ),
      sincronizado_en = now()
  FROM unnest(v_ids) AS v
  WHERE ar.apiario_origen_id = v
    AND v IS NOT NULL;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_apiario_registro_n_colmenas() FROM PUBLIC, anon, authenticated;
