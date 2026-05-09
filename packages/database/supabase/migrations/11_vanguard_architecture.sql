-- ─── Arquitectura Vanguardia OYZ (Versión Producción) ───────────────────────
-- Optimizada para escalabilidad, rendimiento e inmutabilidad de datos.

-- 1. TIPOS ENUM (Idempotentes)
DO $$ BEGIN
    CREATE TYPE accion_tipo AS ENUM ('compra', 'registro_lote', 'resena_sensorial', 'reserva_cosecha', 'referido', 'conversion_territorial');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE perfil_estado AS ENUM ('pendiente', 'activo', 'suspendido');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ROLES APILABLES
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('comprador', 'suscriptor', 'revendedor', 'embajador')),
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Perfil B2B (Revendedor)
CREATE TABLE IF NOT EXISTS revendedor_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL,
    rut TEXT NOT NULL,
    direccion TEXT,
    region TEXT,
    volumen_kg_mes NUMERIC DEFAULT 0,
    tipo_negocio TEXT,
    estado perfil_estado DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración Suscriptor
CREATE TABLE IF NOT EXISTS suscriptor_config (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT CHECK (plan IN ('mensual', 'trimestral', 'anual')),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE SET NULL,
    active_since TIMESTAMPTZ DEFAULT NOW(),
    next_billing DATE
);
CREATE INDEX IF NOT EXISTS idx_suscriptor_config_hive ON suscriptor_config(colmena_id);

-- 3. ECONOMÍA DE CICLOS (Ledger inmutable)
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cantidad NUMERIC NOT NULL CHECK (cantidad > 0), -- Los ciclos ganados son siempre positivos
    tipo accion_tipo NOT NULL,
    referencia_id UUID,
    referencia_tabla TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ciclos_user_id ON ciclos(user_id);

CREATE TABLE IF NOT EXISTS ciclos_canjeados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ciclos_usados NUMERIC NOT NULL CHECK (ciclos_usados > 0),
    beneficio_tipo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ciclos_canjeados_user_id ON ciclos_canjeados(user_id);

-- 4. HUELLA SENSORIAL
CREATE TABLE IF NOT EXISTS resenas_sensoriales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
    cristalizacion_percibida TEXT,
    familia_aromatica TEXT,
    intensidad_fondo INT CHECK (intensidad_fondo BETWEEN 1 AND 10),
    notas_personales TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_resenas_user_id ON resenas_sensoriales(user_id);
CREATE INDEX IF NOT EXISTS idx_resenas_lote_id ON resenas_sensoriales(lote_id);

-- 5. VISTAS DE RENDIMIENTO (Optimización de Tiers y Balances)

-- Vista de Tiers (Histórico Inmortal)
CREATE OR REPLACE VIEW user_tier_view AS
SELECT 
    p.id as user_id,
    COALESCE(SUM(c.cantidad), 0) as ciclos_historicos,
    CASE 
        WHEN COALESCE(SUM(c.cantidad), 0) >= 5000 THEN 'COLMENA'
        WHEN COALESCE(SUM(c.cantidad), 0) >= 2000 THEN 'REINA'
        WHEN COALESCE(SUM(c.cantidad), 0) >= 500 THEN 'ZÁNGANO'
        ELSE 'OBRERA'
    END as tier
FROM profiles p
LEFT JOIN ciclos c ON p.id = c.user_id
GROUP BY p.id;

-- Vista de Saldo Disponible (Matemática de Néctar)
CREATE OR REPLACE VIEW user_ciclos_balance AS
SELECT 
    p.id as user_id,
    COALESCE((SELECT SUM(cantidad) FROM ciclos WHERE user_id = p.id), 0) - 
    COALESCE((SELECT SUM(ciclos_usados) FROM ciclos_canjeados WHERE user_id = p.id), 0) as saldo_actual
FROM profiles p;

-- 6. RLS (Políticas Inmutables y de Administración)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE revendedor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscriptor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos_canjeados ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas_sensoriales ENABLE ROW LEVEL SECURITY;

-- Idempotencia: DROP antes de CREATE
DROP POLICY IF EXISTS "Usuarios ven sus propios roles" ON user_roles;
CREATE POLICY "Usuarios ven sus propios roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven su propio perfil B2B" ON revendedor_profile;
CREATE POLICY "Usuarios ven su propio perfil B2B" ON revendedor_profile FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios editan su propio perfil B2B" ON revendedor_profile;
CREATE POLICY "Usuarios editan su propio perfil B2B" ON revendedor_profile FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven sus ciclos" ON ciclos;
CREATE POLICY "Usuarios ven sus ciclos" ON ciclos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven sus canjes" ON ciclos_canjeados;
CREATE POLICY "Usuarios ven sus canjes" ON ciclos_canjeados FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven sus reseñas" ON resenas_sensoriales;
CREATE POLICY "Usuarios ven sus reseñas" ON resenas_sensoriales FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios crean sus reseñas" ON resenas_sensoriales;
CREATE POLICY "Usuarios crean sus reseñas" ON resenas_sensoriales FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Ciclos son inmutables" ON ciclos;
CREATE POLICY "Ciclos son inmutables" ON ciclos FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Ciclos no se borran" ON ciclos;
CREATE POLICY "Ciclos no se borran" ON ciclos FOR DELETE USING (false);

DROP POLICY IF EXISTS "Reseñas son inmutables" ON resenas_sensoriales;
CREATE POLICY "Reseñas son inmutables" ON resenas_sensoriales FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Admins ven todo en vanguardia" ON revendedor_profile;
CREATE POLICY "Admins ven todo en vanguardia" ON revendedor_profile FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'gerente' OR role = 'tienda_admin'))
);

DROP POLICY IF EXISTS "Admins ven todas las reseñas" ON resenas_sensoriales;
CREATE POLICY "Admins ven todas las reseñas" ON resenas_sensoriales FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'gerente' OR role = 'tienda_admin'))
);
