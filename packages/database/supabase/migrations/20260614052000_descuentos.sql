-- Migration: descuentos
-- Purpose: Tabla de descuentos y promociones con reglas temporales
-- Fixes: Escalar a temporadas o distribuidores con política de precios dinámica

CREATE TABLE IF NOT EXISTS descuentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'monto_fijo', 'buy_x_get_y', 'envio_gratis')),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  valor_minimo_compra INT CHECK (valor_minimo_compra >= 0),
  max_usos INT CHECK (max_usos > 0),
  usos_actuales INT DEFAULT 0 CHECK (usos_actuales >= 0),
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,
  activo BOOLEAN DEFAULT true,
  productos_aplicables UUID[], -- NULL = todos los productos
  categorias_aplicables TEXT[], -- NULL = todas las categorías
  clientes_aplicables UUID[], -- NULL = todos los clientes
  canales_aplicables TEXT[] CHECK (array_position(canales_aplicables, 'web') IS NOT NULL OR array_position(canales_aplicables, 'local') IS NOT NULL OR array_position(canales_aplicables, 'feria') IS NOT NULL OR array_position(canales_aplicables, 'delivery') IS NOT NULL),
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_descuentos_empresa ON descuentos(empresa_id);
CREATE INDEX idx_descuentos_codigo ON descuentos(codigo);
CREATE INDEX idx_descuentos_fecha ON descuentos(fecha_inicio, fecha_fin);
CREATE INDEX idx_descuentos_activo ON descuentos(activo) WHERE activo = true;

-- Función para verificar si un descuento es aplicable
CREATE OR REPLACE FUNCTION es_descuento_aplicable(
  p_descuento_id UUID,
  p_producto_id UUID,
  p_categoria TEXT,
  p_cliente_id UUID,
  p_canal TEXT,
  p_monto_compra INT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_descuento RECORD;
  v_fecha_actual TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_descuento FROM descuentos WHERE id = p_descuento_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si está activo y dentro del rango de fechas
  IF NOT v_descuento.activo THEN
    RETURN FALSE;
  END IF;
  
  IF v_fecha_actual < v_descuento.fecha_inicio OR v_fecha_actual > v_descuento.fecha_fin THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si alcanzó el máximo de usos
  IF v_descuento.max_usos IS NOT NULL AND v_descuento.usos_actuales >= v_descuento.max_usos THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar monto mínimo de compra
  IF v_descuento.valor_minimo_compra IS NOT NULL AND p_monto_compra < v_descuento.valor_minimo_compra THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar producto aplicable
  IF v_descuento.productos_aplicables IS NOT NULL AND NOT (p_producto_id = ANY(v_descuento.productos_aplicables)) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar categoría aplicable
  IF v_descuento.categorias_aplicables IS NOT NULL AND NOT (p_categoria = ANY(v_descuento.categorias_aplicables)) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar cliente aplicable
  IF v_descuento.clientes_aplicables IS NOT NULL AND NOT (p_cliente_id = ANY(v_descuento.clientes_aplicables)) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar canal aplicable
  IF v_descuento.canales_aplicables IS NOT NULL AND NOT (p_canal = ANY(v_descuento.canales_aplicables)) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular descuento
CREATE OR REPLACE FUNCTION calcular_descuento(
  p_descuento_id UUID,
  p_monto_original INT
)
RETURNS INT AS $$
DECLARE
  v_descuento RECORD;
  v_descuento_calculado INT := 0;
BEGIN
  SELECT * INTO v_descuento FROM descuentos WHERE id = p_descuento_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  CASE v_descuento.tipo
    WHEN 'porcentaje' THEN
      v_descuento_calculado := ROUND(p_monto_original * (v_descuento.valor / 100));
    WHEN 'monto_fijo' THEN
      v_descuento_calculado := LEAST(v_descuento.valor::INT, p_monto_original);
    ELSE
      v_descuento_calculado := 0;
  END CASE;
  
  RETURN v_descuento_calculado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para incrementar contador de usos
CREATE OR REPLACE FUNCTION incrementar_usos_descuento(p_descuento_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE descuentos
  SET usos_actuales = usos_actuales + 1,
      updated_at = now()
  WHERE id = p_descuento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_descuentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_descuentos_updated_at
  BEFORE UPDATE ON descuentos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_descuentos_updated_at();

-- RLS
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY descuentos_select ON descuentos FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY descuentos_insert ON descuentos FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY descuentos_update ON descuentos FOR UPDATE USING (has_empresa_access(empresa_id) AND is_gerente());
CREATE POLICY descuentos_delete ON descuentos FOR DELETE USING (has_empresa_access(empresa_id) AND is_gerente());

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION es_descuento_aplicable(UUID, UUID, TEXT, UUID, TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION calcular_descuento(UUID, INT) TO service_role;
GRANT EXECUTE ON FUNCTION incrementar_usos_descuento(UUID) TO service_role;
