-- Persistencia SII RPETC / certificación: envíos del set de pruebas,
-- consultas de cesión, reclamos (Ley 20.956) y respuestas de intercambio.
-- RLS: acceso por empresa (has_empresa_access), service_role total.

-- Envíos del Set de Pruebas de certificación (track_id del SII + XML firmado)
CREATE TABLE IF NOT EXISTS public.sii_set_pruebas_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  track_id TEXT,
  estado_sii TEXT NOT NULL DEFAULT 'generado'
    CHECK (estado_sii IN ('generado', 'enviado', 'aceptado', 'rechazado', 'error')),
  sii_response JSONB,
  envio_xml TEXT NOT NULL,
  casos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sii_set_pruebas_envios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sii_set_pruebas_envios FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sii_set_pruebas_envios TO service_role;

CREATE POLICY "sii_set_pruebas_envios_empresa_access"
  ON public.sii_set_pruebas_envios
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE INDEX IF NOT EXISTS idx_sii_set_pruebas_envios_empresa
  ON public.sii_set_pruebas_envios (empresa_id, created_at DESC);

-- Consultas de cesión de créditos (RPETC — wsRPETCConsulta)
CREATE TABLE IF NOT EXISTS public.rpetc_cesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_emisor TEXT NOT NULL,
  tipo_doc INTEGER NOT NULL,
  folio INTEGER NOT NULL,
  id_cesion TEXT,
  estado_rpetc TEXT,
  glosa TEXT,
  rut_tenedor TEXT,
  fecha_ult_anot TEXT,
  dec_jurada TEXT,
  rut_cobranza TEXT,
  dir_cobranza TEXT,
  raw_xml TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rpetc_cesiones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rpetc_cesiones FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpetc_cesiones TO service_role;

CREATE POLICY "rpetc_cesiones_empresa_access"
  ON public.rpetc_cesiones
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE INDEX IF NOT EXISTS idx_rpetc_cesiones_doc
  ON public.rpetc_cesiones (empresa_id, rut_emisor, tipo_doc, folio);

-- Reclamos / aceptaciones de DTE recibidos (WSREGISTRORECLAMODTE, Ley 20.956)
CREATE TABLE IF NOT EXISTS public.rpetc_reclamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_emisor TEXT NOT NULL,
  tipo_doc INTEGER NOT NULL,
  folio INTEGER NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('ACD', 'RCD', 'ERM', 'RFP', 'RFT')),
  codigo_respuesta TEXT,
  descripcion_respuesta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rpetc_reclamos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rpetc_reclamos FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rpetc_reclamos TO service_role;

CREATE POLICY "rpetc_reclamos_empresa_access"
  ON public.rpetc_reclamos
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE INDEX IF NOT EXISTS idx_rpetc_reclamos_doc
  ON public.rpetc_reclamos (empresa_id, rut_emisor, tipo_doc, folio);

-- Respuestas de intercambio (acuse de recibo / resultado de DTE recibidos)
CREATE TABLE IF NOT EXISTS public.sii_respuestas_intercambio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  rut_responde TEXT NOT NULL,
  rut_recibe TEXT NOT NULL,
  nro_respuesta INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('recepcion', 'resultado')),
  xml TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sii_respuestas_intercambio ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sii_respuestas_intercambio FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sii_respuestas_intercambio TO service_role;

CREATE POLICY "sii_respuestas_intercambio_empresa_access"
  ON public.sii_respuestas_intercambio
  FOR ALL USING (has_empresa_access(empresa_id));

CREATE INDEX IF NOT EXISTS idx_sii_respuestas_intercambio_empresa
  ON public.sii_respuestas_intercambio (empresa_id, created_at DESC);
