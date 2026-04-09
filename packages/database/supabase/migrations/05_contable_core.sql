-- Dominio contable base (multi-empresa)

CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  giro TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  comuna TEXT,
  ciudad TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usuarios_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('owner', 'contador', 'operador', 'lectura')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

CREATE TABLE IF NOT EXISTS public.terceros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'proveedor', 'mixto')),
  rut TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, rut)
);

CREATE TABLE IF NOT EXISTS public.periodos_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL CHECK (anio >= 2000),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, anio, mes)
);

CREATE TABLE IF NOT EXISTS public.facturas_emitidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tercero_id UUID NOT NULL REFERENCES public.terceros(id) ON DELETE RESTRICT,
  periodo_id UUID REFERENCES public.periodos_contables(id) ON DELETE SET NULL,
  numero INTEGER NOT NULL CHECK (numero > 0),
  fecha_emision TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'anulada')),
  monto_neto NUMERIC(19,4) NOT NULL CHECK (monto_neto >= 0),
  monto_iva NUMERIC(19,4) NOT NULL CHECK (monto_iva >= 0),
  monto_total NUMERIC(19,4) NOT NULL CHECK (monto_total >= 0),
  descripcion TEXT,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, numero),
  UNIQUE(empresa_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tercero_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL,
  periodo_id UUID REFERENCES public.periodos_contables(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  monto_neto NUMERIC(19,4) NOT NULL CHECK (monto_neto >= 0),
  monto_iva NUMERIC(19,4) NOT NULL CHECK (monto_iva >= 0),
  monto_total NUMERIC(19,4) NOT NULL CHECK (monto_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_id UUID REFERENCES public.periodos_contables(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('iva', 'ppm', 'renta', 'otro')),
  monto NUMERIC(19,4) NOT NULL CHECK (monto >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'declarado', 'pagado')),
  vencimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
