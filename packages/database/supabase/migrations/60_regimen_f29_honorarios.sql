-- Regimen tributario + campos SII para empresas
-- Requerido para calcular PPM, F29, F22 correctamente segun regimen

ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS regimen TEXT NOT NULL DEFAULT 'pro_pyme_transparente'
CHECK (regimen IN ('pro_pyme_transparente', 'pro_pyme_general', 'semi_integrado', 'general')),
ADD COLUMN IF NOT EXISTS sii_ambiente TEXT NOT NULL DEFAULT 'certificacion'
CHECK (sii_ambiente IN ('certificacion', 'produccion')),
ADD COLUMN IF NOT EXISTS fecha_inicio_actividades DATE,
ADD COLUMN IF NOT EXISTS ingresos_brutos_anio_anterior NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS acteco VARCHAR(6),
ADD COLUMN IF NOT EXISTS sii_clave_encriptada TEXT;

-- Tabla de remanente credito fiscal IVA por periodo
CREATE TABLE IF NOT EXISTS public.remanente_credito_fiscal (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
periodo_id UUID NOT NULL REFERENCES public.periodos_contables(id) ON DELETE CASCADE,
monto NUMERIC(19,4) NOT NULL CHECK (monto >= 0),
monto_reajustado NUMERIC(19,4) NOT NULL CHECK (monto_reajustado >= 0),
factor_utm NUMERIC(10,6) NOT NULL DEFAULT 1,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE(empresa_id, periodo_id)
);

CREATE INDEX IF NOT EXISTS idx_remanente_empresa ON public.remanente_credito_fiscal(empresa_id);
CREATE INDEX IF NOT EXISTS idx_remanente_periodo ON public.remanente_credito_fiscal(periodo_id);

ALTER TABLE public.remanente_credito_fiscal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "remanente_cf_empresa_access" ON public.remanente_credito_fiscal;
CREATE POLICY "remanente_cf_empresa_access" ON public.remanente_credito_fiscal
FOR ALL USING (has_empresa_access(empresa_id));

-- Tabla de honorarios retenidos
CREATE TABLE IF NOT EXISTS public.honorarios (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
periodo_id UUID REFERENCES public.periodos_contables(id) ON DELETE SET NULL,
tercero_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL,
fecha TIMESTAMPTZ NOT NULL,
monto_bruto NUMERIC(19,4) NOT NULL CHECK (monto_bruto > 0),
monto_retencion NUMERIC(19,4) NOT NULL CHECK (monto_retencion >= 0),
tasa_retencion NUMERIC(5,4) NOT NULL DEFAULT 0.1525,
numero_bhe TEXT,
descripcion TEXT NOT NULL,
estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_honorarios_empresa ON public.honorarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_periodo ON public.honorarios(empresa_id, periodo_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_tercero ON public.honorarios(tercero_id);

ALTER TABLE public.honorarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "honorarios_empresa_access" ON public.honorarios;
CREATE POLICY "honorarios_empresa_access" ON public.honorarios
FOR ALL USING (has_empresa_access(empresa_id));

-- Extension de tasas_cambio_historial para incluir UF
ALTER TABLE public.tasas_cambio_historial
DROP CONSTRAINT IF EXISTS tasas_cambio_historial_moneda_check,
ADD CONSTRAINT tasas_cambio_historial_moneda_check
CHECK (moneda IN ('USD', 'EUR', 'UF'));

-- Tabla de declaraciones F29 generadas
CREATE TABLE IF NOT EXISTS public.declaraciones_f29 (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
periodo_id UUID NOT NULL REFERENCES public.periodos_contables(id) ON DELETE CASCADE,
anio INTEGER NOT NULL CHECK (anio >= 2000),
mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
lineas JSONB NOT NULL DEFAULT '{}'::jsonb,
iva_pagar NUMERIC(19,4) NOT NULL DEFAULT 0,
remanente_proximo_periodo NUMERIC(19,4) NOT NULL DEFAULT 0,
ppm_determinado NUMERIC(19,4) NOT NULL DEFAULT 0,
total_pagar NUMERIC(19,4) NOT NULL DEFAULT 0,
estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'declarado', 'pagado')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
UNIQUE(empresa_id, anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_declaraciones_f29_empresa ON public.declaraciones_f29(empresa_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_f29_periodo ON public.declaraciones_f29(periodo_id);

ALTER TABLE public.declaraciones_f29 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "declaraciones_f29_empresa_access" ON public.declaraciones_f29;
CREATE POLICY "declaraciones_f29_empresa_access" ON public.declaraciones_f29
FOR ALL USING (has_empresa_access(empresa_id));

-- Columnas adicionales en periodos_contables para F29
ALTER TABLE public.periodos_contables
ADD COLUMN IF NOT EXISTS remanente_cf_anterior NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS remanente_cf_proximo NUMERIC(19,4) NOT NULL DEFAULT 0;
