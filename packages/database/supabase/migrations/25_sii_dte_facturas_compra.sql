CREATE TABLE IF NOT EXISTS public.facturas_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tercero_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL,
  tipo_dte INTEGER NOT NULL DEFAULT 46,
  folio INTEGER NOT NULL CHECK (folio > 0),
  fecha_emision TIMESTAMPTZ NOT NULL,
  receptor_rut TEXT NOT NULL,
  receptor_razon_social TEXT NOT NULL,
  receptor_giro TEXT,
  monto_neto NUMERIC(19,4) NOT NULL CHECK (monto_neto >= 0),
  monto_exento NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (monto_exento >= 0),
  monto_iva NUMERIC(19,4) NOT NULL CHECK (monto_iva >= 0),
  monto_total NUMERIC(19,4) NOT NULL CHECK (monto_total >= 0),
  estado_sii TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_sii IN ('pendiente', 'enviado', 'aceptado', 'rechazado')),
  track_id TEXT,
  descripcion TEXT,
  sii_xml TEXT,
  sii_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_type TEXT CHECK (source_type IN ('manual', 'uber', 'otro')),
  source_raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, tipo_dte, folio)
);

CREATE INDEX IF NOT EXISTS idx_facturas_compra_empresa ON public.facturas_compra(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_compra_estado_sii ON public.facturas_compra(empresa_id, estado_sii);
CREATE INDEX IF NOT EXISTS idx_facturas_compra_fecha ON public.facturas_compra(empresa_id, fecha_emision DESC);

ALTER TABLE public.facturas_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturas_compra_empresa_access" ON public.facturas_compra
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE TABLE IF NOT EXISTS public.sii_caf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_dte INTEGER NOT NULL,
  folio_desde INTEGER NOT NULL,
  folio_hasta INTEGER NOT NULL,
  folio_actual INTEGER NOT NULL,
  fecha_autorizacion TEXT NOT NULL,
  firma_caf TEXT NOT NULL,
  private_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  nro_resol INTEGER NOT NULL DEFAULT 0,
  fch_resol TEXT NOT NULL DEFAULT '2024-01-01',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, tipo_dte, folio_desde)
);

ALTER TABLE public.sii_caf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sii_caf_empresa_access" ON public.sii_caf
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE OR REPLACE FUNCTION public.sii_caf_next_folio(
  p_empresa_id UUID,
  p_tipo_dte INTEGER
)
RETURNS TABLE (folio INTEGER, folio_hasta INTEGER, caf_id UUID, nro_resol INTEGER, fch_resol TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_folio INTEGER;
  v_hasta INTEGER;
  v_caf_id UUID;
  v_nro_resol INTEGER;
  v_fch_resol TEXT;
BEGIN
  UPDATE public.sii_caf
  SET folio_actual = folio_actual + 1
  WHERE empresa_id = p_empresa_id
    AND tipo_dte = p_tipo_dte
    AND activo = true
    AND folio_actual < folio_hasta
  RETURNING folio_actual, folio_hasta, id, nro_resol, fch_resol
    INTO v_folio, v_hasta, v_caf_id, v_nro_resol, v_fch_resol;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay CAF activo disponible para tipo_dte %', p_tipo_dte;
  END IF;

  folio := v_folio;
  folio_hasta := v_hasta;
  caf_id := v_caf_id;
  nro_resol := v_nro_resol;
  fch_resol := v_fch_resol;

  RETURN NEXT;
END;
$$;

CREATE TABLE IF NOT EXISTS public.sii_certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, activo) WHERE activo = true
);

ALTER TABLE public.sii_certificados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sii_certificados_empresa_access" ON public.sii_certificados
  FOR ALL USING (has_empresa_access(empresa_id));

INSERT INTO storage.buckets (id, name, public)
VALUES ('sii-certificados', 'sii-certificados', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "sii_certificados_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'sii-certificados');

CREATE POLICY "sii_certificados_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sii-certificados'
    AND has_empresa_access((storage.foldername(name))[1]::UUID)
  );

CREATE POLICY "sii_certificados_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sii-certificados'
    AND has_empresa_access((storage.foldername(name))[1]::UUID)
  );
