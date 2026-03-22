-- Enjambre Legado - Database Schema

-- APIARIOS
CREATE TABLE IF NOT EXISTS apiarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    health TEXT CHECK (health IN ('optimal', 'attention', 'risk')),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLMENAS
CREATE TABLE IF NOT EXISTS colmenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apiario_id UUID REFERENCES apiarios(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    health TEXT CHECK (health IN ('optimal', 'attention', 'risk')) DEFAULT 'optimal',
    queen TEXT,
    last_inspection DATE,
    production_total NUMERIC DEFAULT 0,
    floracion TEXT,
    notes TEXT,
    alzas INTEGER DEFAULT 1,
    nucleos_candidatos BOOLEAN DEFAULT FALSE,
    blockchain_hash TEXT,
    lote_activo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSPECCIONES
CREATE TABLE IF NOT EXISTS inspecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector TEXT,
    marcos_cria INTEGER,
    marcos_miel INTEGER,
    varroa NUMERIC,
    poblacion TEXT CHECK (poblacion IN ('alta', 'media', 'baja')),
    reina BOOLEAN DEFAULT TRUE,
    enjambrazon_riesgo TEXT CHECK (enjambrazon_riesgo IN ('bajo', 'medio', 'alto')),
    notes TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VARROA RECORDS
CREATE TABLE IF NOT EXISTS varroa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    level NUMERIC NOT NULL,
    method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PESO RECORDS
CREATE TABLE IF NOT EXISTS peso_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    kg NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COSTOS COLMENA
CREATE TABLE IF NOT EXISTS costos_colmena (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE CASCADE,
    horas_anuales NUMERIC DEFAULT 0,
    costo_hora NUMERIC DEFAULT 0,
    amortizacion_cajon NUMERIC DEFAULT 0,
    insumos_anuales NUMERIC DEFAULT 0,
    produccion_kg NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARBOLES PLANTADOS
CREATE TABLE IF NOT EXISTS arboles_plantados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    especie TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha TEXT,
    sector TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    co2_ton NUMERIC,
    status TEXT CHECK (status IN ('joven', 'creciendo', 'adulto')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFLEXIONES
CREATE TABLE IF NOT EXISTS reflexiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE SET NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    texto TEXT NOT NULL,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REINA HISTORY (Optional but good for completeness)
CREATE TABLE IF NOT EXISTS reina_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colmena_id UUID REFERENCES colmenas(id) ON DELETE CASCADE,
    generation TEXT NOT NULL,
    since DATE,
    origin TEXT,
    status TEXT CHECK (status IN ('activa', 'inactiva', 'ausente')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CALENDARIO TASKS
CREATE TABLE IF NOT EXISTS calendario_tasks (
    id TEXT PRIMARY KEY,
    week INTEGER NOT NULL,
    month TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    colmena TEXT,
    priority TEXT CHECK (priority IN ('alta', 'media', 'baja')),
    done BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTES (CRM)
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('B2B', 'D2C', 'Gourmet', 'Retail', 'Exportación')),
    last_purchase DATE,
    total_spent NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('activo', 'inactivo', 'prospecto', 'frecuente')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENTAS (POS)
CREATE TABLE IF NOT EXISTS ventas (
    id TEXT PRIMARY KEY,
    cliente_id TEXT REFERENCES clientes(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    total NUMERIC NOT NULL,
    productos JSONB NOT NULL,
    metodo_pago TEXT,
    estado TEXT DEFAULT 'completada',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASHFLOW (Gerente)
CREATE TABLE IF NOT EXISTS cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL UNIQUE,
    income NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Phase 4 Schema: Erradicating remaining mocks
-- Tables for Logística, Marketing, Cliente, and Alerts

-- 1. Logística Tables
CREATE TABLE IF NOT EXISTS logistica_envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tracking_code TEXT NOT NULL,
    destino TEXT NOT NULL,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    eta TEXT,
    via TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS stock_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    sachets INTEGER DEFAULT 0,
    frascos INTEGER DEFAULT 0,
    cofres INTEGER DEFAULT 0,
    ok BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    item TEXT NOT NULL,
    next_delivery TEXT,
    urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Marketing Tables
CREATE TABLE IF NOT EXISTS marketing_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    post_date TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    period TEXT NOT NULL,
    impact TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Cliente Tables
CREATE TABLE IF NOT EXISTS pedidos_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    order_date TEXT NOT NULL,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    trees_planted NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Alerts / Voz de la Colmena
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Append phase 4 definitions to the master schema.sql
