-- Migration: CRM Vendedores con Pipeline y Seguimiento
-- Purpose: Implementar sistema de gestión de relaciones con clientes para vendedores
-- Features: Pipeline de ventas, seguimiento de leads, historial de interacciones

-- Tabla de leads/prospectos
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  empresa TEXT,
  origen TEXT CHECK (origen IN ('web', 'feria', 'referido', 'redes', 'directo', 'otro')),
  estado TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'cerrado_ganado', 'cerrado_perdido')),
  etapa_pipeline TEXT NOT NULL DEFAULT 'prospecto' CHECK (etapa_pipeline IN ('prospecto', 'cualificado', 'reunion_agendada', 'propuesta_enviada', 'negociacion', 'cerrado')),
  valor_estimado INT CHECK (valor_estimado >= 0),
  probabilidad_cierre INT CHECK (probabilidad_cierre >= 0 AND probabilidad_cierre <= 100),
  fecha_cierre_estimada DATE,
  notas TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_leads_empresa ON crm_leads(empresa_id);
CREATE INDEX idx_crm_leads_vendedor ON crm_leads(vendedor_id);
CREATE INDEX idx_crm_leads_estado ON crm_leads(estado);
CREATE INDEX idx_crm_leads_etapa ON crm_leads(etapa_pipeline);
CREATE INDEX idx_crm_leads_fecha_cierre ON crm_leads(fecha_cierre_estimada);

-- Tabla de interacciones con leads
CREATE TABLE IF NOT EXISTS crm_interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada', 'email', 'reunion', 'nota', 'whatsapp', 'visita')),
  resultado TEXT CHECK (resultado IN ('exitoso', 'pendiente', 'sin_respuesta', 'reagendado', 'cancelado')),
  asunto TEXT,
  descripcion TEXT,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  duracion_minutos INT CHECK (duracion_minutos >= 0),
  proximo_seguimiento DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_crm_interacciones_lead ON crm_interacciones(lead_id);
CREATE INDEX idx_crm_interacciones_empresa ON crm_interacciones(empresa_id);
CREATE INDEX idx_crm_interacciones_vendedor ON crm_interacciones(vendedor_id);
CREATE INDEX idx_crm_interacciones_fecha ON crm_interacciones(fecha_hora DESC);
CREATE INDEX idx_crm_interacciones_proximo ON crm_interacciones(proximo_seguimiento);

-- Tabla de tareas/recordatorios
CREATE TABLE IF NOT EXISTS crm_tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT CHECK (tipo IN ('llamada', 'email', 'reunion', 'visita', 'otro')),
  fecha_vencimiento DATE NOT NULL,
  hora TIME,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  completada_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_tareas_empresa ON crm_tareas(empresa_id);
CREATE INDEX idx_crm_tareas_vendedor ON crm_tareas(vendedor_id);
CREATE INDEX idx_crm_tareas_vencimiento ON crm_tareas(fecha_vencimiento);
CREATE INDEX idx_crm_tareas_estado ON crm_tareas(estado);
CREATE INDEX idx_crm_tareas_prioridad ON crm_tareas(prioridad);

-- Tabla de oportunidades de venta
CREATE TABLE IF NOT EXISTS crm_oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  etapa TEXT NOT NULL DEFAULT 'prospecto' CHECK (etapa IN ('prospecto', 'cualificado', 'propuesta', 'negociacion', 'cerrado_ganado', 'cerrado_perdido')),
  valor INT NOT NULL CHECK (valor >= 0),
  moneda TEXT DEFAULT 'CLP',
  probabilidad INT CHECK (probabilidad >= 0 AND probabilidad <= 100),
  fecha_cierre_estimada DATE,
  fecha_cierre_real DATE,
  motivo_perdida TEXT,
  productos JSONB DEFAULT '[]'::jsonb,
  competencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_oportunidades_empresa ON crm_oportunidades(empresa_id);
CREATE INDEX idx_crm_oportunidades_vendedor ON crm_oportunidades(vendedor_id);
CREATE INDEX idx_crm_oportunidades_etapa ON crm_oportunidades(etapa);
CREATE INDEX idx_crm_oportunidades_fecha_cierre ON crm_oportunidades(fecha_cierre_estimada);

-- Función para mover lead a siguiente etapa del pipeline
CREATE OR REPLACE FUNCTION mover_lead_pipeline(
  p_lead_id UUID,
  p_nueva_etapa TEXT,
  p_vendedor_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_lead RECORD;
BEGIN
  -- Validar etapa
  IF p_nueva_etapa NOT IN ('prospecto', 'cualificado', 'reunion_agendada', 'propuesta_enviada', 'negociacion', 'cerrado') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Etapa inválida');
  END IF;
  
  -- Obtener lead actual
  SELECT * INTO v_lead FROM crm_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead no encontrado');
  END IF;
  
  -- Actualizar etapa
  UPDATE crm_leads
  SET 
    etapa_pipeline = p_nueva_etapa,
    updated_at = now(),
    vendedor_id = COALESCE(p_vendedor_id, vendedor_id)
  WHERE id = p_lead_id;
  
  -- Actualizar probabilidad según etapa
  UPDATE crm_leads
  SET probabilidad_cierre = CASE
    WHEN p_nueva_etapa = 'prospecto' THEN 10
    WHEN p_nueva_etapa = 'cualificado' THEN 30
    WHEN p_nueva_etapa = 'reunion_agendada' THEN 50
    WHEN p_nueva_etapa = 'propuesta_enviada' THEN 70
    WHEN p_nueva_etapa = 'negociacion' THEN 85
    WHEN p_nueva_etapa = 'cerrado' THEN 100
    ELSE probabilidad_cierre
  END
  WHERE id = p_lead_id;
  
  RETURN jsonb_build_object('success', true, 'etapa', p_nueva_etapa);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para registrar interacción
CREATE OR REPLACE FUNCTION registrar_interaccion_crm(
  p_lead_id UUID,
  p_empresa_id UUID,
  p_vendedor_id UUID,
  p_tipo TEXT,
  p_resultado TEXT DEFAULT NULL,
  p_asunto TEXT DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_fecha_hora TIMESTAMPTZ DEFAULT now(),
  p_duracion_minutos INT DEFAULT NULL,
  p_proximo_seguimiento DATE DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_interaccion_id UUID;
BEGIN
  INSERT INTO crm_interacciones (
    lead_id, empresa_id, vendedor_id, tipo, resultado,
    asunto, descripcion, fecha_hora, duracion_minutos,
    proximo_seguimiento, metadata
  ) VALUES (
    p_lead_id, p_empresa_id, p_vendedor_id, p_tipo, p_resultado,
    p_asunto, p_descripcion, p_fecha_hora, p_duracion_minutos,
    p_proximo_seguimiento, p_metadata
  ) RETURNING id INTO v_interaccion_id;
  
  -- Actualizar fecha de última interacción del lead
  UPDATE crm_leads
  SET updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN v_interaccion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear tarea
CREATE OR REPLACE FUNCTION crear_tarea_crm(
  p_empresa_id UUID,
  p_vendedor_id UUID,
  p_titulo TEXT,
  p_fecha_vencimiento DATE,
  p_lead_id UUID DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL,
  p_tipo TEXT DEFAULT 'otro',
  p_hora TIME DEFAULT NULL,
  p_prioridad TEXT DEFAULT 'media'
)
RETURNS UUID AS $$
DECLARE
  v_tarea_id UUID;
BEGIN
  INSERT INTO crm_tareas (
    lead_id, empresa_id, vendedor_id, titulo, descripcion,
    tipo, fecha_vencimiento, hora, prioridad
  ) VALUES (
    p_lead_id, p_empresa_id, p_vendedor_id, p_titulo, p_descripcion,
    p_tipo, p_fecha_vencimiento, p_hora, p_prioridad
  ) RETURNING id INTO v_tarea_id;
  
  RETURN v_tarea_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener métricas del pipeline
CREATE OR REPLACE FUNCTION obtener_metricas_pipeline(p_empresa_id UUID)
RETURNS TABLE (
  etapa TEXT,
  cantidad_leads INT,
  valor_total INT,
  valor_promedio INT,
  probabilidad_promedio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.etapa_pipeline as etapa,
    COUNT(*) as cantidad_leads,
    COALESCE(SUM(l.valor_estimado), 0) as valor_total,
    COALESCE(AVG(l.valor_estimado), 0) as valor_promedio,
    COALESCE(AVG(l.probabilidad_cierre), 0) as probabilidad_promedio
  FROM crm_leads l
  WHERE l.empresa_id = p_empresa_id
  GROUP BY l.etapa_pipeline
  ORDER BY 
    CASE l.etapa_pipeline
      WHEN 'prospecto' THEN 1
      WHEN 'cualificado' THEN 2
      WHEN 'reunion_agendada' THEN 3
      WHEN 'propuesta_enviada' THEN 4
      WHEN 'negociacion' THEN 5
      WHEN 'cerrado' THEN 6
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener tareas vencidas
CREATE OR REPLACE FUNCTION obtener_tareas_vencidas(p_empresa_id UUID, p_vendedor_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  fecha_vencimiento DATE,
  prioridad TEXT,
  vendedor_id UUID,
  lead_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.titulo,
    t.fecha_vencimiento,
    t.prioridad,
    t.vendedor_id,
    t.lead_id
  FROM crm_tareas t
  WHERE 
    t.empresa_id = p_empresa_id
    AND t.estado = 'pendiente'
    AND t.fecha_vencimiento < CURRENT_DATE
    AND (p_vendedor_id IS NULL OR t.vendedor_id = p_vendedor_id)
  ORDER BY t.fecha_vencimiento ASC, t.prioridad DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_crm_updated_at();

CREATE TRIGGER trigger_crm_tareas_updated_at
  BEFORE UPDATE ON crm_tareas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_crm_updated_at();

CREATE TRIGGER trigger_crm_oportunidades_updated_at
  BEFORE UPDATE ON crm_oportunidades
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_crm_updated_at();

CREATE OR REPLACE FUNCTION set_crm_tarea_completada_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM 'completada' AND NEW.estado = 'completada' THEN
    NEW.completada_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_crm_tareas_completada_at
  BEFORE UPDATE ON crm_tareas
  FOR EACH ROW
  EXECUTE FUNCTION set_crm_tarea_completada_at();

-- RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_leads_select ON crm_leads FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY crm_leads_insert ON crm_leads FOR INSERT WITH CHECK (has_empresa_access(empresa_id));
CREATE POLICY crm_leads_update ON crm_leads FOR UPDATE USING (has_empresa_access(empresa_id));
CREATE POLICY crm_leads_delete ON crm_leads FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

ALTER TABLE crm_interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_interacciones_select ON crm_interacciones FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY crm_interacciones_insert ON crm_interacciones FOR INSERT WITH CHECK (has_empresa_access(empresa_id));
CREATE POLICY crm_interacciones_update ON crm_interacciones FOR UPDATE USING (has_empresa_access(empresa_id));
CREATE POLICY crm_interacciones_delete ON crm_interacciones FOR DELETE USING (has_empresa_access(empresa_id));

ALTER TABLE crm_tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_tareas_select ON crm_tareas FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY crm_tareas_insert ON crm_tareas FOR INSERT WITH CHECK (has_empresa_access(empresa_id));
CREATE POLICY crm_tareas_update ON crm_tareas FOR UPDATE USING (has_empresa_access(empresa_id));
CREATE POLICY crm_tareas_delete ON crm_tareas FOR DELETE USING (has_empresa_access(empresa_id));

ALTER TABLE crm_oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_oportunidades_select ON crm_oportunidades FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY crm_oportunidades_insert ON crm_oportunidades FOR INSERT WITH CHECK (has_empresa_access(empresa_id));
CREATE POLICY crm_oportunidades_update ON crm_oportunidades FOR UPDATE USING (has_empresa_access(empresa_id));
CREATE POLICY crm_oportunidades_delete ON crm_oportunidades FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION mover_lead_pipeline(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION registrar_interaccion_crm(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, INT, DATE, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION crear_tarea_crm(UUID, UUID, TEXT, DATE, UUID, TEXT, TEXT, TIME, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION obtener_metricas_pipeline(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION obtener_tareas_vencidas(UUID, UUID) TO service_role;
