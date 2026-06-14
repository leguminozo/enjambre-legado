-- Migration: QR Trazabilidad con Audit Trail Inmutable
-- Purpose: Implementar trazabilidad completa de productos desde apiario hasta cliente
-- Audit trail inmutable usando triggers y restricciones

-- Tabla de códigos QR
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  lote_id TEXT NOT NULL,
  apiario_id UUID REFERENCES apiarios(id) ON DELETE SET NULL,
  cosecha_id UUID REFERENCES cosechas(id) ON DELETE SET NULL,
  fecha_produccion DATE NOT NULL,
  fecha_vencimiento DATE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_qr_codes_codigo ON qr_codes(codigo);
CREATE INDEX idx_qr_codes_producto ON qr_codes(producto_id);
CREATE INDEX idx_qr_codes_lote ON qr_codes(lote_id);
CREATE INDEX idx_qr_codes_empresa ON qr_codes(empresa_id);

-- Tabla de audit trail inmutable (solo insert, no update/delete)
CREATE TABLE IF NOT EXISTS qr_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  evento TEXT NOT NULL CHECK (evento IN ('creado', 'escaneado', 'enviado', 'entregado', 'devuelto', 'reportado')),
  ubicacion TEXT,
  latitud NUMERIC,
  longitud NUMERIC,
  usuario_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hash inmutable para verificar integridad
  event_hash TEXT NOT NULL
);

CREATE INDEX idx_qr_audit_trail_qr ON qr_audit_trail(qr_id);
CREATE INDEX idx_qr_audit_trail_fecha ON qr_audit_trail(created_at DESC);
CREATE INDEX idx_qr_audit_trail_evento ON qr_audit_trail(evento);

-- Función para generar hash SHA-256 del evento
CREATE OR REPLACE FUNCTION generar_event_hash(
  p_qr_id UUID,
  p_evento TEXT,
  p_created_at TIMESTAMPTZ,
  p_metadata JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT encode(
    digest(
      p_qr_id::TEXT || p_evento || to_char(p_created_at, 'YYYY-MM-DD HH24:MI:SS.US') || COALESCE(p_metadata::TEXT, ''),
      'sha256'
    ),
    'hex'
  ) INTO v_hash;
  
  RETURN v_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para generar hash automáticamente antes de insertar
CREATE OR REPLACE FUNCTION generar_hash_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  NEW.event_hash = generar_event_hash(
    NEW.qr_id,
    NEW.evento,
    NEW.created_at,
    NEW.metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_generar_hash_audit_trail
  BEFORE INSERT ON qr_audit_trail
  FOR EACH ROW
  EXECUTE FUNCTION generar_hash_audit_trail();

-- Función para verificar integridad del audit trail
CREATE OR REPLACE FUNCTION verificar_integridad_audit_trail(p_qr_id UUID)
RETURNS TABLE (
  id UUID,
  evento TEXT,
  created_at TIMESTAMPTZ,
  hash_calculado TEXT,
  hash_almacenado TEXT,
  es_valido BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.id,
    at.evento,
    at.created_at,
    generar_event_hash(at.qr_id, at.evento, at.created_at, at.metadata) as hash_calculado,
    at.event_hash as hash_almacenado,
    (generar_event_hash(at.qr_id, at.evento, at.created_at, at.metadata) = at.event_hash) as es_valido
  FROM qr_audit_trail at
  WHERE at.qr_id = p_qr_id
  ORDER BY at.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar evento de escaneo QR
CREATE OR REPLACE FUNCTION registrar_escaneo_qr(
  p_codigo TEXT,
  p_evento TEXT,
  p_ubicacion TEXT DEFAULT NULL,
  p_latitud NUMERIC DEFAULT NULL,
  p_longitud NUMERIC DEFAULT NULL,
  p_usuario_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_qr_id UUID;
  v_resultado JSONB;
BEGIN
  -- Buscar QR por código
  SELECT id INTO v_qr_id FROM qr_codes WHERE codigo = p_codigo AND activo = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'QR no encontrado o inactivo'
    );
  END IF;
  
  -- Insertar evento en audit trail
  INSERT INTO qr_audit_trail (
    qr_id,
    evento,
    ubicacion,
    latitud,
    longitud,
    usuario_id,
    metadata
  ) VALUES (
    v_qr_id,
    p_evento,
    p_ubicacion,
    p_latitud,
    p_longitud,
    p_usuario_id,
    p_metadata
  ) RETURNING id INTO v_resultado;
  
  RETURN jsonb_build_object(
    'success', true,
    'qr_id', v_qr_id,
    'audit_id', v_resultado
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial completo de un QR
CREATE OR REPLACE FUNCTION obtener_historial_qr(p_qr_id UUID)
RETURNS TABLE (
  evento TEXT,
  ubicacion TEXT,
  latitud NUMERIC,
  longitud NUMERIC,
  usuario_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  event_hash TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    at.evento,
    at.ubicacion,
    at.latitud,
    at.longitud,
    at.usuario_id,
    at.metadata,
    at.created_at,
    at.event_hash
  FROM qr_audit_trail at
  WHERE at.qr_id = p_qr_id
  ORDER BY at.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar código QR único
CREATE OR REPLACE FUNCTION generar_codigo_qr()
RETURNS TEXT AS $$
DECLARE
  v_codigo TEXT;
  v_existe BOOLEAN;
BEGIN
  LOOP
    -- Generar código alfanumérico de 12 caracteres
    v_codigo := upper(substring(encode(gen_random_bytes(8), 'base64'), 1, 12));
    
    -- Reemplazar caracteres problemáticos
    v_codigo := translate(v_codigo, '+/', 'AB');
    
    -- Verificar que no exista
    SELECT EXISTS(SELECT 1 FROM qr_codes WHERE codigo = v_codigo) INTO v_existe;
    
    IF NOT v_existe THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear QR para un producto
CREATE OR REPLACE FUNCTION crear_qr_producto(
  p_producto_id UUID,
  p_lote_id TEXT,
  p_apiario_id UUID,
  p_cosecha_id UUID,
  p_fecha_produccion DATE,
  p_empresa_id UUID,
  p_fecha_vencimiento DATE DEFAULT NULL,
  p_cantidad INT DEFAULT 1
)
RETURNS TABLE (qr_id UUID, codigo TEXT) AS $$
DECLARE
  i INT;
BEGIN
  RETURN QUERY
  SELECT 
    gen_random_uuid() as qr_id,
    generar_codigo_qr() as codigo
  FROM generate_series(1, p_cantidad) i;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS para qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY qr_codes_select ON qr_codes FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY qr_codes_insert ON qr_codes FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY qr_codes_update ON qr_codes FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY qr_codes_delete ON qr_codes FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

-- RLS para qr_audit_trail (solo lectura para todos, insert para autenticados)
ALTER TABLE qr_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY qr_audit_trail_select ON qr_audit_trail FOR SELECT USING (true);
CREATE POLICY qr_audit_trail_insert ON qr_audit_trail FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Prohibir actualizaciones y eliminaciones (audit trail inmutable)
CREATE POLICY qr_audit_trail_no_update ON qr_audit_trail FOR UPDATE USING (false);
CREATE POLICY qr_audit_trail_no_delete ON qr_audit_trail FOR DELETE USING (false);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generar_event_hash(UUID, TEXT, TIMESTAMPTZ, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION verificar_integridad_audit_trail(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION registrar_escaneo_qr(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION obtener_historial_qr(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION generar_codigo_qr() TO service_role;
GRANT EXECUTE ON FUNCTION crear_qr_producto(UUID, TEXT, UUID, UUID, DATE, UUID, DATE, INT) TO service_role;
