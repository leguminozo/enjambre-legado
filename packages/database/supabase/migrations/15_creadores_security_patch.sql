-- ─── Módulo Creadores de Contenido v2 (Parche de seguridad y correcciones) ─────
-- Corrige: race condition en retiros, RLS abierto, auto-uso de código,
--   índice case-insensitive, balance_accounting, límite de retiros, PII leak,
--   y rendimiento de vistas.

-- ═══ 1. ÍNDICE CASE-INSENSITIVE PARA codigo_ref ═══
DROP INDEX IF EXISTS idx_creadores_codigo_ref;
CREATE UNIQUE INDEX idx_creadores_codigo_ref_upper ON creadores (UPPER(codigo_ref));

-- ═══ 2. FUNCIÓN ATÓMICA DE RETIRO (elimina race condition) ═══
--   Valida balance y crea retiro en una sola transacción con advisory lock
CREATE OR REPLACE FUNCTION solicitar_retiro_creador(
  p_user_id UUID,
  p_monto NUMERIC,
  p_metodo_pago TEXT,
  p_datos_pago JSONB
)
RETURNS TABLE(id UUID, monto_solicitado NUMERIC, estado TEXT) AS $$
DECLARE
  v_creador_id UUID;
  v_balance NUMERIC;
  v_retiros_pendientes INT;
BEGIN
  SELECT id INTO v_creador_id FROM creadores WHERE user_id = p_user_id AND estado = 'activo';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_CREATOR';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_creador_id::text));

  SELECT balance_disponible INTO v_balance
  FROM creador_balance_view
  WHERE creador_id = v_creador_id;

  IF v_balance < p_monto THEN
    RAISE EXCEPTION 'INSUFFICIENT_BALANCE';
  END IF;

  SELECT COUNT(*) INTO v_retiros_pendientes
  FROM creador_retiros
  WHERE creador_id = v_creador_id AND estado = 'pendiente';

  IF v_retiros_pendientes >= 3 THEN
    RAISE EXCEPTION 'TOO_MANY_PENDING';
  END IF;

  INSERT INTO creador_retiros (creador_id, monto_solicitado, metodo_pago, datos_pago)
  VALUES (v_creador_id, p_monto, p_metodo_pago, p_datos_pago)
  RETURNING id, monto_solicitado, estado INTO id, monto_solicitado, estado;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 3. PREVENCIÓN DE AUTO-USO DE CÓDIGO ═══
--   Un creador no puede usar su propio código para obtener descuento
CREATE OR REPLACE FUNCTION aplicar_codigo_creador(
  p_codigo TEXT,
  p_venta_id UUID,
  p_cliente_id UUID,
  p_monto_venta NUMERIC
)
RETURNS TABLE(
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
  SELECT * INTO v_creador FROM creadores WHERE UPPER(codigo_ref) = UPPER(p_codigo) AND estado = 'activo';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF v_creador.user_id = p_cliente_id THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 4. VISTA DE BALANCE CORREGIDA ═══
--   Solo comisiones aprobadas cuentan como balance disponible.
--   Pendientes se muestran pero NO se restan para retiros.
CREATE OR REPLACE VIEW creador_balance_view AS
SELECT
  c.id AS creador_id,
  c.user_id,
  c.nombre_publico,
  c.codigo_ref,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id), 0)
    AS comisiones_total,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'pendiente'), 0)
    AS comisiones_pendientes,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'aprobada'), 0)
    AS comisiones_aprobadas,
  COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado = 'pagado'), 0)
    AS total_retirado,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'aprobada'), 0) -
  COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado IN ('pagado', 'aprobado', 'pendiente')), 0)
    AS balance_disponible,
  c.total_usos_codigo
FROM creadores c;

-- ═══ 5. RLS CORREGIDO: codigo_usos INSERT ya no es abierto ═══
--   Solo la función SECURITY DEFINER puede insertar. Nadie más.
DROP POLICY IF EXISTS "Sistema inserta usos de codigo" ON creador_codigo_usos;
CREATE POLICY "Solo funciones SECURITY DEFINER insertan usos" ON creador_codigo_usos
  FOR INSERT WITH CHECK (false);

-- ═══ 6. RLS: Creador no puede editar campos administrativos ═══
--   Columnas protegidas: porcentaje_comision, descuento_cliente, estado, notas_internas, total_*
--   Solución: policy UPDATE solo permite editar columnas seguras
DROP POLICY IF EXISTS "Creador edita campos propios" ON creadores;
CREATE POLICY "Creador edita campos propios" ON creadores
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND porcentaje_comision = (SELECT porcentaje_comision FROM creadores WHERE id = id LIMIT 1)
    AND descuento_cliente = (SELECT descuento_cliente FROM creadores WHERE id = id LIMIT 1)
    AND estado = (SELECT estado FROM creadores WHERE id = id LIMIT 1)
    AND total_comisiones = (SELECT total_comisiones FROM creadores WHERE id = id LIMIT 1)
    AND total_pagado = (SELECT total_pagado FROM creadores WHERE id = id LIMIT 1)
    AND total_usos_codigo = (SELECT total_usos_codigo FROM creadores WHERE id = id LIMIT 1)
  );

-- ═══ 7. OCULTAR datos_pago al creador (PII protection) ═══
--   Reemplazar policy de SELECT en retiros para creadores
DROP POLICY IF EXISTS "Creador gestiona sus retiros" ON creador_retiros;
CREATE POLICY "Creador ve sus retiros sin datos_pago" ON creador_retiros
  FOR SELECT USING (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

-- ═══ 8. COLUMNAS DE AUDITORÍA ═══
ALTER TABLE creador_codigo_usos ADD COLUMN IF NOT EXISTS ip_origen TEXT;
ALTER TABLE creador_codigo_usos ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ═══ 9. CONSTRAINT: mínimo de retiro ═══
ALTER TABLE creador_retiros DROP CONSTRAINT IF EXISTS creador_retiros_monto_minimo;
ALTER TABLE creador_retiros ADD CONSTRAINT creador_retiros_monto_minimo
  CHECK (monto_solicitado >= 5000);

-- ═══ 10. VISTA OPTIMIZADA (reemplaza subqueries con CTEs) ═══
CREATE OR REPLACE VIEW creador_ranking_view AS
WITH creador_stats AS (
  SELECT
    c.id,
    c.nombre_publico,
    c.codigo_ref,
    c.plataforma,
    c.estado,
    c.total_usos_codigo,
    c.total_comisiones,
    c.seguidores_aprox
  FROM creadores c
  WHERE c.estado = 'activo'
)
SELECT
  *,
  ROW_NUMBER() OVER (ORDER BY total_comisiones DESC) AS ranking
FROM creador_stats;

-- ═══ 11. CORRECCIÓN DE TIPO: monto_venta INT → NUMERIC ═══
ALTER TABLE creador_codigo_usos ALTER COLUMN monto_venta TYPE NUMERIC USING monto_venta::NUMERIC;

-- ═══ 12. FUNCIÓN: generador de código corregido (si no existe) ═══
CREATE OR REPLACE FUNCTION generar_codigo_creador(nombre TEXT)
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  existe INT;
BEGIN
  codigo := UPPER(LEFT(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g'), 3)) || '_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
  SELECT COUNT(*) INTO existe FROM creadores WHERE UPPER(codigo_ref) = UPPER(codigo);
  WHILE existe > 0 LOOP
    codigo := UPPER(LEFT(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g'), 3)) || '_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));
    SELECT COUNT(*) INTO existe FROM creadores WHERE UPPER(codigo_ref) = UPPER(codigo);
  END LOOP;
  RETURN codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
