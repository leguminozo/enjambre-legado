CREATE TABLE IF NOT EXISTS public.rcv_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  tipo_registro TEXT NOT NULL CHECK (tipo_registro IN ('compras', 'ventas')),
  total_documentos INTEGER NOT NULL DEFAULT 0,
  total_neto NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_iva NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_exento NUMERIC(19,4) NOT NULL DEFAULT 0,
  total_total NUMERIC(19,4) NOT NULL DEFAULT 0,
  sii_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  ultimo_sync TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'sincronizado', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, periodo, tipo_registro)
);

CREATE INDEX IF NOT EXISTS idx_rcv_sync_empresa ON public.rcv_sync(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rcv_sync_periodo ON public.rcv_sync(periodo);

ALTER TABLE public.rcv_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rcv_sync_empresa_access" ON public.rcv_sync
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE TABLE IF NOT EXISTS public.rcv_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rcv_sync_id UUID NOT NULL REFERENCES public.rcv_sync(id) ON DELETE CASCADE,
  tipo_dte INTEGER NOT NULL,
  folio INTEGER NOT NULL,
  fecha_emision TEXT NOT NULL,
  rut_contraparte TEXT NOT NULL,
  razon_social_contraparte TEXT NOT NULL,
  monto_neto NUMERIC(19,4) NOT NULL DEFAULT 0,
  monto_exento NUMERIC(19,4) NOT NULL DEFAULT 0,
  monto_iva NUMERIC(19,4) NOT NULL DEFAULT 0,
  monto_total NUMERIC(19,4) NOT NULL DEFAULT 0,
  estado_rcv TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_rcv IN ('registrar', 'pendiente', 'aceptado', 'reclamado', 'anulado')),
  factura_compra_id UUID REFERENCES public.facturas_compra(id) ON DELETE SET NULL,
  factura_emitida_id UUID,
  reconciliado BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rcv_registros_empresa ON public.rcv_registros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rcv_registros_sync ON public.rcv_registros(rcv_sync_id);
CREATE INDEX IF NOT EXISTS idx_rcv_registros_dte ON public.rcv_registros(tipo_dte, folio);
CREATE INDEX IF NOT EXISTS idx_rcv_registros_reconciliado ON public.rcv_registros(reconciliado) WHERE NOT reconciliado;

ALTER TABLE public.rcv_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rcv_registros_empresa_access" ON public.rcv_registros
  FOR ALL USING (has_empresa_access(empresa_id));
