-- ─── Módulo Creadores de Contenido ───────────────────────────────────────────
-- Propósito: Sistema de códigos de referencia de creadores de contenido.
--   - Clientes ingresan códigos en checkout → descuento ligero + comisión al creador.
--   - Creadores tienen su propio portal con métricas y retiros.
--   - Gerente/tienda_admin administran creadores desde Vanguardia.

-- 1. TIPO ENUM
DO $$ BEGIN
  CREATE TYPE creador_estado AS ENUM ('pendiente', 'activo', 'suspendido', 'inactivo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE comision_estado AS ENUM ('pendiente', 'aprobada', 'pagada', 'rechazada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLA PRINCIPAL: CREADORES
CREATE TABLE IF NOT EXISTS creadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL,
  codigo_ref TEXT UNIQUE NOT NULL,
  plataforma TEXT CHECK (plataforma IN ('instagram', 'tiktok', 'youtube', 'blog', 'podcast', 'otro')),
  plataforma_url TEXT,
  nicho TEXT,
  seguidores_aprox INT DEFAULT 0,
  porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 30),
  descuento_cliente NUMERIC(5,2) NOT NULL DEFAULT 3.00 CHECK (descuento_cliente >= 0 AND descuento_cliente <= 15),
  estado creador_estado DEFAULT 'pendiente',
  total_comisiones NUMERIC DEFAULT 0,
  total_pagado NUMERIC DEFAULT 0,
  total_usos_codigo INT DEFAULT 0,
  avatar_url TEXT,
  bio TEXT,
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_creadores_codigo_ref ON creadores(codigo_ref);
CREATE INDEX IF NOT EXISTS idx_creadores_user_id ON creadores(user_id);
CREATE INDEX IF NOT EXISTS idx_creadores_estado ON creadores(estado);

-- 3. HISTORIAL DE USOS DE CÓDIGO (audit trail)
CREATE TABLE IF NOT EXISTS creador_codigo_usos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES creadores(id) ON DELETE CASCADE,
  venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  codigo_usado TEXT NOT NULL,
  monto_venta INT NOT NULL,
  descuento_aplicado INT NOT NULL DEFAULT 0,
  comision_generada NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_codigo_usos_creador ON creador_codigo_usos(creador_id);
CREATE INDEX IF NOT EXISTS idx_codigo_usos_venta ON creador_codigo_usos(venta_id);
CREATE INDEX IF NOT EXISTS idx_codigo_usos_fecha ON creador_codigo_usos(created_at DESC);

-- 4. COMISIONES (ledger inmutable)
CREATE TABLE IF NOT EXISTS creador_comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES creadores(id) ON DELETE CASCADE,
  uso_codigo_id UUID NOT NULL REFERENCES creador_codigo_usos(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  porcentaje_aplicado NUMERIC(5,2) NOT NULL,
  estado comision_estado DEFAULT 'pendiente',
  pagado_at TIMESTAMPTZ,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comisiones_creador ON creador_comisiones(creador_id);
CREATE INDEX IF NOT EXISTS idx_comisiones_estado ON creador_comisiones(estado);

-- 5. SOLICITUDES DE RETIRO
CREATE TABLE IF NOT EXISTS creador_retiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES creadores(id) ON DELETE CASCADE,
  monto_solicitado NUMERIC NOT NULL CHECK (monto_solicitado > 0),
  monto_aprobado NUMERIC,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'pagado', 'rechazado')),
  metodo_pago TEXT CHECK (metodo_pago IN ('transferencia', 'paypal', 'bizum', 'otro')),
  datos_pago JSONB,
  revisado_por UUID REFERENCES auth.users(id),
  revisado_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_retiros_creador ON creador_retiros(creador_id);
CREATE INDEX IF NOT EXISTS idx_retiros_estado ON creador_retiros(estado);

-- 6. MÉTRICAS MENSUALES (snapshot para dashboard)
CREATE TABLE IF NOT EXISTS creador_metricas_mes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creador_id UUID NOT NULL REFERENCES creadores(id) ON DELETE CASCADE,
  mes TEXT NOT NULL,
  usos_codigo INT DEFAULT 0,
  ventas_generadas INT DEFAULT 0,
  comisiones_generadas NUMERIC DEFAULT 0,
  nuevos_clientes INT DEFAULT 0,
  ticket_promedio NUMERIC DEFAULT 0,
  UNIQUE(creador_id, mes)
);
CREATE INDEX IF NOT EXISTS idx_metricas_creador_mes ON creador_metricas_mes(creador_id, mes);

-- 7. VISTAS

-- Vista: Balance disponible del creador (comisiones aprobadas - retiros pagados)
CREATE OR REPLACE VIEW creador_balance_view AS
SELECT
  c.id AS creador_id,
  c.user_id,
  c.nombre_publico,
  c.codigo_ref,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'aprobada'), 0) +
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado = 'pendiente'), 0)
    AS comisiones_total,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado IN ('aprobada', 'pendiente')), 0)
    AS comisiones_pendientes,
  COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado = 'pagado'), 0)
    AS total_retirado,
  COALESCE((SELECT SUM(monto) FROM creador_comisiones WHERE creador_id = c.id AND estado IN ('aprobada', 'pendiente')), 0) -
  COALESCE((SELECT SUM(monto_solicitado) FROM creador_retiros WHERE creador_id = c.id AND estado IN ('pagado', 'aprobado')), 0)
    AS balance_disponible,
  c.total_usos_codigo
FROM creadores c;

-- Vista: Ranking de creadores
CREATE OR REPLACE VIEW creador_ranking_view AS
SELECT
  c.id,
  c.nombre_publico,
  c.codigo_ref,
  c.plataforma,
  c.estado,
  c.total_usos_codigo,
  c.total_comisiones,
  c.seguidores_aprox,
  ROW_NUMBER() OVER (ORDER BY c.total_comisiones DESC) AS ranking
FROM creadores c
WHERE c.estado = 'activo';

-- 8. FUNCIONES

-- Generar código de referencia único
CREATE OR REPLACE FUNCTION generar_codigo_creador(nombre TEXT)
RETURNS TEXT AS $$
DECLARE
  base TEXT;
  codigo TEXT;
  intentos INT := 0;
BEGIN
  base := LOWER(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g'));
  IF LENGTH(base) > 8 THEN base := LEFT(base, 8); END IF;
  IF LENGTH(base) < 3 THEN base := base || 'CREA'; END IF;

  LOOP
    intentos := intentos + 1;
    IF intentos = 1 THEN
      codigo := base;
    ELSE
      codigo := base || FLOOR(RANDOM() * 900 + 100)::TEXT;
    END IF;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM creadores WHERE codigo_ref = codigo);
    IF intentos > 20 THEN
      codigo := 'CR' || FLOOR(RANDOM() * 90000 + 10000)::TEXT;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM creadores WHERE codigo_ref = codigo);
    END IF;
  END LOOP;

  RETURN UPPER(codigo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: actualizar contadores del creador al registrar uso de código
CREATE OR REPLACE FUNCTION on_codigo_uso_update_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creadores SET
    total_usos_codigo = total_usos_codigo + 1,
    total_comisiones = total_comisiones + NEW.comision_generada,
    updated_at = NOW()
  WHERE id = NEW.creador_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_codigo_uso_stats ON creador_codigo_usos;
CREATE TRIGGER trigger_codigo_uso_stats
  AFTER INSERT ON creador_codigo_usos
  FOR EACH ROW
  EXECUTE FUNCTION on_codigo_uso_update_stats();

-- Trigger: crear comisión automáticamente al registrar uso de código
CREATE OR REPLACE FUNCTION on_codigo_uso_create_comision()
RETURNS TRIGGER AS $$
DECLARE
  v_porcentaje NUMERIC;
BEGIN
  SELECT porcentaje_comision INTO v_porcentaje
  FROM creadores WHERE id = NEW.creador_id;

  IF v_porcentaje > 0 THEN
    INSERT INTO creador_comisiones (creador_id, uso_codigo_id, monto, porcentaje_aplicado, estado)
    VALUES (NEW.creador_id, NEW.id, NEW.comision_generada, v_porcentaje, 'pendiente');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_codigo_uso_comision ON creador_codigo_usos;
CREATE TRIGGER trigger_codigo_uso_comision
  AFTER INSERT ON creador_codigo_usos
  FOR EACH ROW
  EXECUTE FUNCTION on_codigo_uso_create_comision();

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_creador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_creador_updated_at ON creadores;
CREATE TRIGGER trigger_creador_updated_at
  BEFORE UPDATE ON creadores
  FOR EACH ROW
  EXECUTE FUNCTION update_creador_updated_at();

-- Función: Validar y aplicar código de creador en una venta
CREATE OR REPLACE FUNCTION aplicar_codigo_creador(
  p_codigo TEXT,
  p_venta_id UUID,
  p_cliente_id UUID,
  p_monto_venta INT
)
RETURNS TABLE(
  valido BOOLEAN,
  creador_nombre TEXT,
  descuento INT,
  comision NUMERIC
) AS $$
DECLARE
  v_creador RECORD;
  v_descuento INT;
  v_comision NUMERIC;
BEGIN
  SELECT * INTO v_creador FROM creadores WHERE UPPER(codigo_ref) = UPPER(p_codigo) AND estado = 'activo';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 0::INT, 0::NUMERIC;
    RETURN;
  END IF;

  v_descuento := FLOOR(p_monto_venta * v_creador.descuento_cliente / 100);
  v_comision := FLOOR(p_monto_venta * v_creador.porcentaje_comision / 100);

  INSERT INTO creador_codigo_usos (creador_id, venta_id, cliente_id, codigo_usado, monto_venta, descuento_aplicado, comision_generada)
  VALUES (v_creador.id, p_venta_id, p_cliente_id, p_codigo, p_monto_venta, v_descuento, v_comision);

  RETURN QUERY SELECT true::BOOLEAN, v_creador.nombre_publico, v_descuento, v_comision;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Snapshots mensuales de métricas (ejecutar vía cron o manualmente)
CREATE OR REPLACE FUNCTION calcular_metricas_creadores_mes(p_mes TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO creador_metricas_mes (creador_id, mes, usos_codigo, ventas_generadas, comisiones_generadas, nuevos_clientes, ticket_promedio)
  SELECT
    cu.creador_id,
    p_mes,
    COUNT(*)::INT,
    COALESCE(SUM(cu.monto_venta), 0)::INT,
    COALESCE(SUM(cu.comision_generada), 0),
    COUNT(DISTINCT cu.cliente_id)::INT,
    CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(cu.monto_venta)::NUMERIC, 0) ELSE 0 END
  FROM creador_codigo_usos cu
  WHERE TO_CHAR(cu.created_at, 'YYYY-MM') = p_mes
  GROUP BY cu.creador_id
  ON CONFLICT (creador_id, mes) DO UPDATE SET
    usos_codigo = EXCLUDED.usos_codigo,
    ventas_generadas = EXCLUDED.ventas_generadas,
    comisiones_generadas = EXCLUDED.comisiones_generadas,
    nuevos_clientes = EXCLUDED.nuevos_clientes,
    ticket_promedio = EXCLUDED.ticket_promedio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS

ALTER TABLE creadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE creador_codigo_usos ENABLE ROW LEVEL SECURITY;
ALTER TABLE creador_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE creador_retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE creador_metricas_mes ENABLE ROW LEVEL SECURITY;

-- Creadores: un creador ve su propio registro
DROP POLICY IF EXISTS "Creador ve su propio perfil" ON creadores;
CREATE POLICY "Creador ve su propio perfil" ON creadores
  FOR SELECT USING (auth.uid() = user_id);

-- Creadores: admins ven y gestionan todo
DROP POLICY IF EXISTS "Admins gestionan creadores" ON creadores;
CREATE POLICY "Admins gestionan creadores" ON creadores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin', 'marketing'))
  );

-- Creadores: un creador puede actualizar su propio perfil (campos limitados)
DROP POLICY IF EXISTS "Creador edita campos propios" ON creadores;
CREATE POLICY "Creador edita campos propios" ON creadores
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Código usos: creador ve los usos de su código
DROP POLICY IF EXISTS "Creador ve usos de su codigo" ON creador_codigo_usos;
CREATE POLICY "Creador ve usos de su codigo" ON creador_codigo_usos
  FOR SELECT USING (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

-- Código usos: admins ven todo
DROP POLICY IF EXISTS "Admins ven usos de codigos" ON creador_codigo_usos;
CREATE POLICY "Admins ven usos de codigos" ON creador_codigo_usos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin', 'marketing'))
  );

-- Código usos: sistema inserta (via SECURITY DEFINER)
DROP POLICY IF EXISTS "Sistema inserta usos de codigo" ON creador_codigo_usos;
CREATE POLICY "Sistema inserta usos de codigo" ON creador_codigo_usos
  FOR INSERT WITH CHECK (true);

-- Comisiones: creador ve sus comisiones
DROP POLICY IF EXISTS "Creador ve sus comisiones" ON creador_comisiones;
CREATE POLICY "Creador ve sus comisiones" ON creador_comisiones
  FOR SELECT USING (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

-- Comisiones: admins gestionan todo
DROP POLICY IF EXISTS "Admins gestionan comisiones" ON creador_comisiones;
CREATE POLICY "Admins gestionan comisiones" ON creador_comisiones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin'))
  );

-- Comisiones son inmutables una vez creadas (solo admins cambian estado)
DROP POLICY IF EXISTS "Comisiones inmutables para creadores" ON creador_comisiones;
CREATE POLICY "Comisiones inmutables para creadores" ON creador_comisiones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin'))
  );

-- Retiros: creador ve y crea sus retiros
DROP POLICY IF EXISTS "Creador gestiona sus retiros" ON creador_retiros;
CREATE POLICY "Creador gestiona sus retiros" ON creador_retiros
  FOR SELECT USING (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creador crea retiros" ON creador_retiros;
CREATE POLICY "Creador crea retiros" ON creador_retiros
  FOR INSERT WITH CHECK (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

-- Retiros: admins ven y gestionan todo
DROP POLICY IF EXISTS "Admins gestionan retiros" ON creador_retiros;
CREATE POLICY "Admins gestionan retiros" ON creador_retiros
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin'))
  );

-- Métricas: creador ve sus métricas
DROP POLICY IF EXISTS "Creador ve sus metricas" ON creador_metricas_mes;
CREATE POLICY "Creador ve sus metricas" ON creador_metricas_mes
  FOR SELECT USING (
    creador_id IN (SELECT id FROM creadores WHERE user_id = auth.uid())
  );

-- Métricas: admins ven todo
DROP POLICY IF EXISTS "Admins ven metricas creadores" ON creador_metricas_mes;
CREATE POLICY "Admins ven metricas creadores" ON creador_metricas_mes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('gerente', 'tienda_admin', 'marketing'))
  );

-- 10. ACTUALIZAR ROL 'marketing' EN PROFILES
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('apicultor','vendedor','gerente','logistica','marketing','cliente','tienda_admin','creador'));

-- 11. ACTUALIZAR user_roles para incluir creador
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('comprador', 'suscriptor', 'revendedor', 'embajador', 'creador'));
