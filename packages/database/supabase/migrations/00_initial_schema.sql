-- Enjambre Legado — esquema canónico único (fuente de verdad en packages/database)
-- Deprecado: apps/nucleo/supabase/*.sql (solo referencia histórica; aplicar migraciones desde aquí)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Identidad ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'apicultor','vendedor','gerente','logistica','marketing','cliente','tienda_admin'
  )),
  nivel_guardian TEXT DEFAULT 'brotes',
  puntos_acumulados INT DEFAULT 0,
  arboles_personal INT DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Núcleo apícola ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  ubicacion GEOGRAPHY(Point, 4326),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  sector TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS colmenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id UUID REFERENCES apiarios(id) ON DELETE SET NULL,
  name TEXT,
  numero_caja INT,
  estado TEXT CHECK (estado IN ('optima','atencion','riesgo')),
  reina_info JSONB,
  queen TEXT,
  peso_kg DECIMAL,
  ultima_inspeccion DATE,
  last_inspection DATE,
  production_total NUMERIC,
  floracion TEXT,
  notas TEXT,
  notes TEXT,
  fotos TEXT[],
  blockchain_hash TEXT,
  lote_activo TEXT,
  alzas INT DEFAULT 1,
  nucleos_candidatos BOOLEAN DEFAULT false,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id UUID NOT NULL REFERENCES colmenas(id) ON DELETE CASCADE,
  date DATE,
  inspector TEXT,
  marcos_cria INT,
  marcos_miel INT,
  varroa NUMERIC,
  poblacion TEXT,
  reina BOOLEAN,
  enjambrazon_riesgo TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS varroa_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id UUID NOT NULL REFERENCES colmenas(id) ON DELETE CASCADE,
  date DATE,
  level NUMERIC,
  method TEXT
);

CREATE TABLE IF NOT EXISTS peso_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id UUID NOT NULL REFERENCES colmenas(id) ON DELETE CASCADE,
  date DATE,
  kg NUMERIC,
  note TEXT
);

CREATE TABLE IF NOT EXISTS cosechas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id UUID REFERENCES colmenas(id),
  fecha DATE,
  kg DECIMAL,
  floracion TEXT,
  lote_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cosecha_ids UUID[],
  kg_total DECIMAL,
  blockchain_hash TEXT UNIQUE,
  arboles_asociados INT,
  estado TEXT DEFAULT 'disponible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arboles_plantados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id UUID REFERENCES apiarios(id),
  especie TEXT,
  fecha DATE,
  coordenadas GEOGRAPHY(Point, 4326),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  foto_url TEXT,
  lote_id UUID REFERENCES lotes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CRM (vendedor) — contactos B2B; opcional vínculo a perfil cliente ─────────
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('B2B', 'D2C', 'Gourmet', 'Retail', 'Exportación', 'Particular')),
  last_purchase DATE,
  total_spent NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('activo', 'inactivo', 'prospecto', 'frecuente')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Comercial ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  descripcion_regenerativa TEXT,
  precio INT,
  stock INT,
  formato TEXT,
  lote_id UUID REFERENCES lotes(id),
  fotos TEXT[],
  video_url TEXT,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES profiles(id),
  cliente_id UUID REFERENCES profiles(id),
  crm_cliente_id UUID REFERENCES clientes(id),
  origen TEXT CHECK (origen IN ('web','feria','local')),
  estado TEXT,
  total INT,
  items JSONB,
  metodo_pago TEXT,
  arboles_plantados_por_pedido INT,
  offline_synced BOOLEAN DEFAULT false,
  evento_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP MATERIALIZED VIEW IF EXISTS cashflow CASCADE;

CREATE TABLE IF NOT EXISTS cashflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  income NUMERIC DEFAULT 0,
  expenses NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS calendario_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ─── Campo / ferias ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  ubicacion GEOGRAPHY(Point, 4326),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  stock_asignado JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets_fidelizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES profiles(id),
  evento_id UUID REFERENCES eventos(id),
  producto_id UUID REFERENCES productos(id),
  cantidad INT,
  puntos_usados INT,
  canjeado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Logística / marketing / cliente ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logistica_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tracking_code TEXT NOT NULL,
  destino TEXT NOT NULL,
  items TEXT NOT NULL,
  status TEXT NOT NULL,
  eta TEXT,
  via TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  sachets INTEGER DEFAULT 0,
  frascos INTEGER DEFAULT 0,
  cofres INTEGER DEFAULT 0,
  ok BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  item TEXT NOT NULL,
  next_delivery TEXT,
  urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  post_date TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  period TEXT NOT NULL,
  impact TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_date TEXT NOT NULL,
  items TEXT NOT NULL,
  status TEXT NOT NULL,
  trees_planted NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reflexiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  date_display TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
