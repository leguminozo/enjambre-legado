-- ============================================================
-- Migration 20260802150000: cierre de ciclos económicos
-- 1. ventas.tercero_id — el cliente que selecciona el POS es un
--    tercero contable (tipo 'cliente'); antes se enviaba su id en
--    ventas.cliente_id (FK a profiles) → violación de FK que rompía
--    el sync offline. Ahora el vínculo correcto vive aquí.
-- 2. Trigger ventas_ganar_puntos_pos — fidelización desde el POS:
--    resuelve el usuario por email del tercero y acumula puntos
--    (mismo motor que la tienda: calcular_puntos_compra +
--    agregar_puntos_usuario). Best-effort: jamás bloquea la venta.
-- ============================================================

-- 1. Vínculo POS → tercero contable
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS tercero_id UUID
  REFERENCES public.terceros(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_tercero ON public.ventas(tercero_id);

-- 2. Trigger de puntos POS
CREATE OR REPLACE FUNCTION public.ventas_ganar_puntos_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_puntos INT;
BEGIN
  -- Solo ventas de punto de venta con origen presencial
  IF NEW.origen NOT IN ('feria', 'local', 'pos') THEN
    RETURN NEW;
  END IF;

  -- Resolver usuario de fidelización: tercero → email → profile
  IF NEW.tercero_id IS NOT NULL THEN
    SELECT p.id INTO v_user_id
    FROM public.terceros t
    JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
    WHERE t.id = NEW.tercero_id
      AND t.email IS NOT NULL AND t.email <> ''
      AND p.email IS NOT NULL AND p.email <> ''
    LIMIT 1;
  END IF;

  -- Fallback: cliente_id explícito (profile id)
  IF v_user_id IS NULL THEN
    v_user_id := NEW.cliente_id;
  END IF;

  IF v_user_id IS NULL OR NEW.empresa_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Idempotencia: un solo registro 'ganado' por venta
  IF EXISTS (
    SELECT 1 FROM public.puntos_transacciones
    WHERE venta_id = NEW.id::text AND tipo = 'ganado'
  ) THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT public.calcular_puntos_compra(v_user_id, NEW.empresa_id, NEW.total)
      INTO v_puntos;
    IF v_puntos IS NOT NULL AND v_puntos > 0 THEN
      PERFORM public.agregar_puntos_usuario(
        v_user_id,
        NEW.empresa_id,
        v_puntos,
        NEW.id::text,
        'Compra POS',
        jsonb_build_object('channel', NEW.origen)
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear la venta por un fallo de fidelización
    NULL;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ventas_puntos_pos_trigger ON public.ventas;
CREATE TRIGGER ventas_puntos_pos_trigger
  AFTER INSERT ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.ventas_ganar_puntos_pos();
