-- ─── Pasaporte verificable: reparar crear_qr_producto ──────────────────────
-- El RPC original generaba códigos sin persistirlos (SELECT puro, sin INSERT),
-- dejando la cadena de custodia vacía. Esta versión inserta el QR + registra
-- el evento 'creado' en el audit trail inmutable (trigger genera el hash).

CREATE OR REPLACE FUNCTION public.crear_qr_producto(
  p_producto_id UUID,
  p_lote_id TEXT,
  p_apiario_id UUID,
  p_cosecha_id UUID,
  p_fecha_produccion DATE,
  p_empresa_id UUID,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_cantidad INT DEFAULT 1
) RETURNS TABLE (qr_id UUID, codigo TEXT) AS $$
DECLARE
  v_qr_id UUID;
  v_codigo TEXT;
  i INT;
BEGIN
  IF p_cantidad < 1 OR p_cantidad > 100 THEN
    RAISE EXCEPTION 'cantidad fuera de rango (1-100)';
  END IF;

  FOR i IN 1..p_cantidad LOOP
    v_qr_id := gen_random_uuid();
    v_codigo := generar_codigo_qr();

    INSERT INTO qr_codes (id, codigo, producto_id, lote_id, apiario_id, cosecha_id, fecha_produccion, fecha_vencimiento, empresa_id, activo, created_by)
    VALUES (v_qr_id, v_codigo, p_producto_id, p_lote_id, p_apiario_id, p_cosecha_id, p_fecha_produccion, p_fecha_vencimiento, p_empresa_id, true, auth.uid());

    -- Primer eslabón de la cadena: el nacimiento del frasco
    INSERT INTO qr_audit_trail (qr_id, evento, metadata)
    VALUES (v_qr_id, 'creado', jsonb_build_object('producto_id', p_producto_id, 'lote_id', p_lote_id));

    RETURN QUERY SELECT v_qr_id, v_codigo;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.crear_qr_producto(UUID, TEXT, UUID, UUID, DATE, UUID, DATE, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_qr_producto(UUID, TEXT, UUID, UUID, DATE, UUID, DATE, INT) TO service_role;
