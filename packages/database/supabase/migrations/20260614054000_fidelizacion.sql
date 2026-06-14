-- Migration: Sistema de Fidelización
-- Purpose: Implementar sistema de puntos, niveles y recompensas para clientes
-- Features: Acumulación de puntos por compras, niveles de fidelización, canje de recompensas

-- Tabla de puntos de fidelización
CREATE TABLE IF NOT EXISTS puntos_fidelizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  puntos INT NOT NULL DEFAULT 0 CHECK (puntos >= 0),
  nivel_actual TEXT NOT NULL DEFAULT 'bronze' CHECK (nivel_actual IN ('bronze', 'silver', 'gold', 'platinum')),
  puntos_acumulados_total INT NOT NULL DEFAULT 0 CHECK (puntos_acumulados_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

CREATE INDEX idx_puntos_fidelizacion_user ON puntos_fidelizacion(user_id);
CREATE INDEX idx_puntos_fidelizacion_empresa ON puntos_fidelizacion(empresa_id);
CREATE INDEX idx_puntos_fidelizacion_nivel ON puntos_fidelizacion(nivel_actual);

-- Tabla de transacciones de puntos (historial inmutable)
CREATE TABLE IF NOT EXISTS puntos_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  venta_id TEXT REFERENCES ventas(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ganado', 'canjeado', 'expirado', 'ajuste')),
  puntos INT NOT NULL,
  saldo_anterior INT NOT NULL,
  saldo_nuevo INT NOT NULL,
  motivo TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_puntos_transacciones_user ON puntos_transacciones(user_id);
CREATE INDEX idx_puntos_transacciones_empresa ON puntos_transacciones(empresa_id);
CREATE INDEX idx_puntos_transacciones_venta ON puntos_transacciones(venta_id);
CREATE INDEX idx_puntos_transacciones_fecha ON puntos_transacciones(created_at DESC);

-- Tabla de niveles de fidelización (configuración)
CREATE TABLE IF NOT EXISTS niveles_fidelizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nivel TEXT NOT NULL CHECK (nivel IN ('bronze', 'silver', 'gold', 'platinum')),
  puntos_requeridos INT NOT NULL CHECK (puntos_requeridos >= 0),
  multiplicador_puntos NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (multiplicador_puntos >= 1.00),
  beneficios JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_niveles_fidelizacion_empresa ON niveles_fidelizacion(empresa_id);
CREATE INDEX idx_niveles_fidelizacion_nivel ON niveles_fidelizacion(nivel);
CREATE UNIQUE INDEX IF NOT EXISTS idx_niveles_fidelizacion_empresa_nivel
  ON niveles_fidelizacion(empresa_id, nivel);

-- Tabla de recompensas canjeables
CREATE TABLE IF NOT EXISTS recompensas_fidelizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  puntos_requeridos INT NOT NULL CHECK (puntos_requeridos > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('descuento', 'producto', 'envio', 'experiencia')),
  valor JSONB NOT NULL, -- { monto: 5000, tipo: 'porcentaje' } o { producto_id: 'uuid' }
  stock INT CHECK (stock >= 0),
  stock_ilimitado BOOLEAN DEFAULT true,
  nivel_minimo TEXT CHECK (nivel_minimo IN ('bronze', 'silver', 'gold', 'platinum')),
  fecha_inicio DATE,
  fecha_fin DATE,
  activa BOOLEAN DEFAULT true,
  imagen_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recompensas_fidelizacion_empresa ON recompensas_fidelizacion(empresa_id);
CREATE INDEX idx_recompensas_fidelizacion_activa ON recompensas_fidelizacion(activa) WHERE activa = true;

-- Tabla de canjes de recompensas
CREATE TABLE IF NOT EXISTS canjes_recompensas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  recompensa_id UUID REFERENCES recompensas_fidelizacion(id) ON DELETE SET NULL,
  puntos_usados INT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'expirado')),
  codigo_canje TEXT UNIQUE,
  fecha_canje TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_canjes_recompensas_user ON canjes_recompensas(user_id);
CREATE INDEX idx_canjes_recompensas_empresa ON canjes_recompensas(empresa_id);
CREATE INDEX idx_canjes_recompensas_codigo ON canjes_recompensas(codigo_canje);
CREATE INDEX idx_canjes_recompensas_estado ON canjes_recompensas(estado);

-- Función para calcular puntos por compra (basado en nivel)
CREATE OR REPLACE FUNCTION calcular_puntos_compra(
  p_user_id UUID,
  p_empresa_id UUID,
  p_monto_compra INT
)
RETURNS INT AS $$
DECLARE
  v_nivel TEXT;
  v_multiplicador NUMERIC(3, 2);
  v_puntos_base INT;
  v_puntos_finales INT;
BEGIN
  -- Obtener nivel actual del usuario
  SELECT nivel_actual INTO v_nivel
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  
  IF v_nivel IS NULL THEN
    v_nivel := 'bronze';
  END IF;
  
  -- Obtener multiplicador del nivel
  SELECT multiplicador_puntos INTO v_multiplicador
  FROM niveles_fidelizacion
  WHERE empresa_id = p_empresa_id AND nivel = v_nivel AND activo = true;
  
  IF v_multiplicador IS NULL THEN
    v_multiplicador := 1.00;
  END IF;
  
  -- Calcular puntos (1 punto por cada $100 CLP, ajustado por multiplicador)
  v_puntos_base := p_monto_compra / 100;
  v_puntos_finales := ROUND(v_puntos_base * v_multiplicador);
  
  RETURN v_puntos_finales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar puntos a usuario
CREATE OR REPLACE FUNCTION agregar_puntos_usuario(
  p_user_id UUID,
  p_empresa_id UUID,
  p_puntos INT,
  p_venta_id TEXT DEFAULT NULL,
  p_motivo TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_saldo_anterior INT;
  v_saldo_nuevo INT;
  v_nivel_anterior TEXT;
  v_nuevo_nivel TEXT;
  v_transaccion_id UUID;
BEGIN
  -- Obtener saldo anterior
  SELECT COALESCE(puntos, 0), nivel_actual INTO v_saldo_anterior, v_nivel_anterior
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  
  IF v_saldo_anterior IS NULL THEN
    v_saldo_anterior := 0;
    v_nivel_anterior := 'bronze';
    
    -- Crear registro si no existe
    INSERT INTO puntos_fidelizacion (user_id, empresa_id, puntos, nivel_actual, puntos_acumulados_total)
    VALUES (p_user_id, p_empresa_id, p_puntos, 'bronze', p_puntos);
  ELSE
    -- Actualizar puntos
    UPDATE puntos_fidelizacion
    SET 
      puntos = puntos + p_puntos,
      puntos_acumulados_total = puntos_acumulados_total + p_puntos,
      updated_at = now()
    WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  END IF;
  
  v_saldo_nuevo := v_saldo_anterior + p_puntos;
  
  -- Registrar transacción
  INSERT INTO puntos_transacciones (
    user_id, empresa_id, venta_id, tipo, puntos, 
    saldo_anterior, saldo_nuevo, motivo, metadata
  ) VALUES (
    p_user_id, p_empresa_id, p_venta_id, 'ganado', p_puntos,
    v_saldo_anterior, v_saldo_nuevo, p_motivo, p_metadata
  ) RETURNING id INTO v_transaccion_id;
  
  -- Verificar si el usuario subió de nivel
  SELECT nivel INTO v_nuevo_nivel
  FROM (
    SELECT nivel
    FROM niveles_fidelizacion
    WHERE empresa_id = p_empresa_id AND activo = true AND puntos_requeridos <= v_saldo_nuevo
    ORDER BY puntos_requeridos DESC
    LIMIT 1
  ) sub;
  
  IF v_nuevo_nivel IS NULL THEN
    v_nuevo_nivel := 'bronze';
  END IF;
  
  -- Actualizar nivel si cambió
  IF v_nuevo_nivel != v_nivel_anterior THEN
    UPDATE puntos_fidelizacion
    SET nivel_actual = v_nuevo_nivel, updated_at = now()
    WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  END IF;
  
  RETURN v_transaccion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para canjear recompensa
CREATE OR REPLACE FUNCTION canjear_recompensa(
  p_user_id UUID,
  p_empresa_id UUID,
  p_recompensa_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_recompensa RECORD;
  v_puntos_usuario INT;
  v_codigo_canje TEXT;
  v_fecha_expiracion DATE;
BEGIN
  -- Obtener recompensa
  SELECT * INTO v_recompensa
  FROM recompensas_fidelizacion
  WHERE id = p_recompensa_id AND empresa_id = p_empresa_id AND activa = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa no encontrada o inactiva');
  END IF;
  
  -- Verificar stock
  IF NOT v_recompensa.stock_ilimitado AND v_recompensa.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa agotada');
  END IF;
  
  -- Verificar fechas
  IF v_recompensa.fecha_inicio IS NOT NULL AND CURRENT_DATE < v_recompensa.fecha_inicio THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa aún no disponible');
  END IF;
  
  IF v_recompensa.fecha_fin IS NOT NULL AND CURRENT_DATE > v_recompensa.fecha_fin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa expirada');
  END IF;
  
  -- Obtener puntos del usuario
  SELECT puntos INTO v_puntos_usuario
  FROM puntos_fidelizacion
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  
  IF v_puntos_usuario IS NULL OR v_puntos_usuario < v_recompensa.puntos_requeridos THEN
    RETURN jsonb_build_object('success', false, 'error', 'Puntos insuficientes');
  END IF;
  
  -- Verificar nivel mínimo
  IF v_recompensa.nivel_minimo IS NOT NULL THEN
    DECLARE
      v_nivel_usuario TEXT;
    BEGIN
      SELECT nivel_actual INTO v_nivel_usuario
      FROM puntos_fidelizacion
      WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
      
      IF v_nivel_usuario IS NULL OR v_nivel_usuario != v_recompensa.nivel_minimo THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nivel insuficiente');
      END IF;
    END;
  END IF;
  
  -- Generar código de canje
  v_codigo_canje := 'CANJE-' || upper(substring(encode(gen_random_bytes(8), 'base64'), 1, 8));
  v_fecha_expiracion := CURRENT_DATE + INTERVAL '30 days';
  
  -- Registrar canje
  INSERT INTO canjes_recompensas (
    user_id, empresa_id, recompensa_id, puntos_usados,
    codigo_canje, fecha_expiracion
  ) VALUES (
    p_user_id, p_empresa_id, p_recompensa_id, v_recompensa.puntos_requeridos,
    v_codigo_canje, v_fecha_expiracion
  );
  
  -- Restar puntos del usuario
  UPDATE puntos_fidelizacion
  SET puntos = puntos - v_recompensa.puntos_requeridos,
      updated_at = now()
  WHERE user_id = p_user_id AND empresa_id = p_empresa_id;
  
  -- Registrar transacción de canje
  INSERT INTO puntos_transacciones (
    user_id, empresa_id, tipo, puntos,
    saldo_anterior, saldo_nuevo, motivo
  ) VALUES (
    p_user_id, p_empresa_id, 'canjeado', -v_recompensa.puntos_requeridos,
    v_puntos_usuario, v_puntos_usuario - v_recompensa.puntos_requeridos,
    'Canje: ' || v_recompensa.nombre
  );
  
  -- Actualizar stock si no es ilimitado
  IF NOT v_recompensa.stock_ilimitado THEN
    UPDATE recompensas_fidelizacion
    SET stock = stock - 1
    WHERE id = p_recompensa_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'codigo_canje', v_codigo_canje,
    'fecha_expiracion', v_fecha_expiracion,
    'puntos_usados', v_recompensa.puntos_requeridos
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_fidelizacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_puntos_fidelizacion_updated_at
  BEFORE UPDATE ON puntos_fidelizacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fidelizacion_updated_at();

CREATE TRIGGER trigger_niveles_fidelizacion_updated_at
  BEFORE UPDATE ON niveles_fidelizacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fidelizacion_updated_at();

CREATE TRIGGER trigger_recompensas_fidelizacion_updated_at
  BEFORE UPDATE ON recompensas_fidelizacion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fidelizacion_updated_at();

-- RLS
ALTER TABLE puntos_fidelizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY puntos_fidelizacion_select ON puntos_fidelizacion FOR SELECT USING (user_id = auth.uid() OR has_empresa_access(empresa_id));
CREATE POLICY puntos_fidelizacion_insert ON puntos_fidelizacion FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY puntos_fidelizacion_update ON puntos_fidelizacion FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());

ALTER TABLE puntos_transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY puntos_transacciones_select ON puntos_transacciones FOR SELECT USING (user_id = auth.uid() OR has_empresa_access(empresa_id));
CREATE POLICY puntos_transacciones_insert ON puntos_transacciones FOR INSERT WITH CHECK (has_empresa_access(empresa_id));
CREATE POLICY puntos_transacciones_no_update ON puntos_transacciones FOR UPDATE USING (false);
CREATE POLICY puntos_transacciones_no_delete ON puntos_transacciones FOR DELETE USING (false);

ALTER TABLE niveles_fidelizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY niveles_fidelizacion_select ON niveles_fidelizacion FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY niveles_fidelizacion_insert ON niveles_fidelizacion FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY niveles_fidelizacion_update ON niveles_fidelizacion FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());

ALTER TABLE recompensas_fidelizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY recompensas_fidelizacion_select ON recompensas_fidelizacion FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY recompensas_fidelizacion_insert ON recompensas_fidelizacion FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY recompensas_fidelizacion_update ON recompensas_fidelizacion FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());

ALTER TABLE canjes_recompensas ENABLE ROW LEVEL SECURITY;

CREATE POLICY canjes_recompensas_select ON canjes_recompensas FOR SELECT USING (user_id = auth.uid() OR has_empresa_access(empresa_id));
CREATE POLICY canjes_recompensas_insert ON canjes_recompensas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY canjes_recompensas_update ON canjes_recompensas FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION calcular_puntos_compra(UUID, UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION agregar_puntos_usuario(UUID, UUID, INT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION canjear_recompensa(UUID, UUID, UUID) TO service_role;

-- Insertar niveles por defecto
INSERT INTO niveles_fidelizacion (empresa_id, nivel, puntos_requeridos, multiplicador_puntos, beneficios, activo)
SELECT 
  id,
  unnest(ARRAY['bronze', 'silver', 'gold', 'platinum']),
  unnest(ARRAY[0, 1000, 5000, 15000]),
  unnest(ARRAY[1.00, 1.25, 1.50, 2.00]),
  unnest(ARRAY[
    '{"descuento": 0, "envio_gratis": false}'::jsonb,
    '{"descuento": 5, "envio_gratis": false}'::jsonb,
    '{"descuento": 10, "envio_gratis": true}'::jsonb,
    '{"descuento": 15, "envio_gratis": true, "prioridad": true}'::jsonb
  ]),
  true
FROM empresas
ON CONFLICT (empresa_id, nivel) DO NOTHING;
