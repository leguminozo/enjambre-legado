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
