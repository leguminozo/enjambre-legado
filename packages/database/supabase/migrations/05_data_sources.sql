-- Fuentes de datos externas (boletas, bancos, SII, notificaciones)

CREATE TABLE IF NOT EXISTS public.source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('boletas', 'bancos', 'sii', 'notificaciones')),
  filename TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  uploaded_by UUID REFERENCES profiles(id),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boletas_ingest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID REFERENCES source_files(id) ON DELETE SET NULL,
  folio TEXT,
  emision_fecha DATE,
  rut_receptor TEXT,
  razon_social TEXT,
  monto_neto NUMERIC,
  monto_iva NUMERIC,
  monto_total NUMERIC,
  estado TEXT DEFAULT 'ingresada',
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID REFERENCES source_files(id) ON DELETE SET NULL,
  movimiento_fecha DATE,
  descripcion TEXT,
  referencia TEXT,
  monto NUMERIC,
  moneda TEXT DEFAULT 'CLP',
  tipo TEXT,
  conciliado BOOLEAN DEFAULT false,
  venta_id UUID REFERENCES ventas(id) ON DELETE SET NULL,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sii_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'queued',
  detail TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  recipient TEXT,
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

