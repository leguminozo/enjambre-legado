-- 1. Identidad y roles (tabla maestra)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('apicultor','vendedor','gerente','logistica','marketing','cliente','tienda_admin')),
  nivel_guardian TEXT DEFAULT 'brotes', -- brotes, corriente, delta
  puntos_acumulados INT DEFAULT 0,
  arboles_personal INT DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dominio apícola (núcleo)
CREATE TABLE apiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  ubicacion GEOMETRY(Point, 4326),
  sector TEXT, -- Pureo, Yerba Loza, etc.
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE colmenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id UUID REFERENCES apiarios(id),
  numero_caja INT,
  estado TEXT CHECK (estado IN ('optima','atencion','riesgo')),
  reina_info JSONB,
  peso_kg DECIMAL,
  ultima_inspeccion DATE,
  notas TEXT,
  fotos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cosechas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id UUID REFERENCES colmenas(id),
  fecha DATE,
  kg DECIMAL,
  floracion TEXT, -- ulmo, tepu, tiaque, avellano
  lote_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosecha_ids UUID[],
  kg_total DECIMAL,
  blockchain_hash TEXT UNIQUE,
  arboles_asociados INT,
  estado TEXT DEFAULT 'disponible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arboles_plantados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id UUID REFERENCES apiarios(id),
  especie TEXT,
  fecha DATE,
  coordenadas GEOMETRY(Point, 4326),
  foto_url TEXT,
  lote_id UUID REFERENCES lotes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dominio comercial (tienda)
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  descripcion_regenerativa TEXT,
  precio INT,
  stock INT,
  formato TEXT, -- sachet, frasco 250g, cofre
  lote_id UUID REFERENCES lotes(id),
  fotos TEXT[],
  video_url TEXT,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES profiles(id),
  origen TEXT CHECK (origen IN ('web','feria','local')),
  estado TEXT,
  total INT,
  items JSONB,
  metodo_pago TEXT,
  arboles_plantados_por_pedido INT,
  offline_synced BOOLEAN DEFAULT false,
  evento_id UUID, -- For POS
  vendedor_id UUID REFERENCES profiles(id), -- For POS
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materialized View for Cashflow
CREATE MATERIALIZED VIEW cashflow AS
SELECT 
  date_trunc('month', created_at) AS month,
  sum(total) AS income,
  0 AS expenses -- Expenses would come from another table, for now zero
FROM ventas
GROUP BY date_trunc('month', created_at);

-- 4. Dominio presencial (campo)
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  ubicacion GEOMETRY(Point, 4326),
  stock_asignado JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tickets_fidelizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES profiles(id),
  evento_id UUID REFERENCES eventos(id),
  producto_id UUID REFERENCES productos(id),
  cantidad INT,
  puntos_usados INT,
  canjeado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_own_profile ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY update_own_profile ON profiles FOR UPDATE USING (id = auth.uid());

ALTER TABLE colmenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY apicultor_see_own_colmenas ON colmenas
  FOR SELECT USING (apiario_id IN (SELECT id FROM apiarios WHERE created_by = auth.uid()) OR (auth.jwt() ->> 'role' = 'gerente'));

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY todos_ven_productos ON productos FOR SELECT USING (true);
CREATE POLICY tienda_admin_modifica ON productos
  FOR ALL USING (auth.jwt() ->> 'role' = 'tienda_admin' OR auth.jwt() ->> 'role' = 'gerente');

-- Storage policy examples to be expanded via the Supabase dashboard
