-- ─── Código de creador en checkout web ─────────────────────────────────────
-- Cierra el circuito de creadores: el código ingresado en tienda se aplica
-- post-venta (fulfill) para registrar uso + comisión → balance → retiro.
-- El descuento al comprador se aplica server-side en /api/checkout (init/quote).

ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS codigo_creador TEXT;

-- Versión invocable desde el BFF con service role (sin auth.uid(); el caller
-- ya autenticó al comprador y validó el código en init). Misma lógica y
-- triggers que aplicar_codigo_creador (on_codigo_uso_create_comision).
CREATE OR REPLACE FUNCTION public.aplicar_codigo_creador_admin(
  p_codigo TEXT,
  p_venta_id UUID,
  p_cliente_id UUID,
  p_monto_venta NUMERIC
) RETURNS TABLE(
  valido BOOLEAN,
  creador_nombre TEXT,
  descuento NUMERIC,
  comision NUMERIC
) AS $$
DECLARE
  v_creador RECORD;
  v_descuento NUMERIC;
  v_comision NUMERIC;
BEGIN
  SELECT * INTO v_creador FROM creadores
  WHERE UPPER(codigo_ref) = UPPER(p_codigo) AND estado = 'activo';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF p_cliente_id IS NOT NULL AND v_creador.user_id = p_cliente_id THEN
    RETURN QUERY SELECT false::BOOLEAN, 'No puedes usar tu propio código'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM creador_codigo_usos
    WHERE venta_id = p_venta_id AND creador_id = v_creador.id
  ) THEN
    RETURN QUERY SELECT false::BOOLEAN, 'Ya se aplicó un código a esta venta'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  v_descuento := FLOOR(p_monto_venta * v_creador.descuento_cliente / 100);
  v_comision := FLOOR(p_monto_venta * v_creador.porcentaje_comision / 100);

  INSERT INTO creador_codigo_usos (creador_id, venta_id, cliente_id, codigo_usado, monto_venta, descuento_aplicado, comision_generada)
  VALUES (v_creador.id, p_venta_id, p_cliente_id, UPPER(p_codigo), p_monto_venta, v_descuento, v_comision);

  RETURN QUERY SELECT true::BOOLEAN, v_creador.nombre_publico, v_descuento, v_comision;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.aplicar_codigo_creador_admin(TEXT, UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aplicar_codigo_creador_admin(TEXT, UUID, UUID, NUMERIC) TO service_role;
