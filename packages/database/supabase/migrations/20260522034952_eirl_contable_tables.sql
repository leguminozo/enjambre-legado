-- EIRL contable tables absorbed into nucleo
-- Adds: facturas_recibidas, reportes, calculos_ia, conciliaciones_sumup, configuracion_ia
-- Extends: periodos_contables (financial summary columns), facturas_emitidas (EIRL fields), terceros (giro)

-- ═══ Extensions to existing tables ═══

ALTER TABLE public.terceros
ADD COLUMN IF NOT EXISTS giro TEXT;

ALTER TABLE public.periodos_contables
ADD COLUMN IF NOT EXISTS nombre TEXT,
ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_termino TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ingresos_netos NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS egresos_netos NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_bruta NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS utilidad_neta NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_debito NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_credito NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_pagar NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ppm_calculado NUMERIC(19,4) NOT NULL DEFAULT 0;

ALTER TABLE public.facturas_emitidas
ADD COLUMN IF NOT EXISTS monto_exento NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_iva_usado NUMERIC(19,4) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tipo_documento TEXT NOT NULL DEFAULT 'Factura',
ADD COLUMN IF NOT EXISTS estado_sii TEXT;

-- ═══ New tables ═══

CREATE TABLE IF NOT EXISTS public.facturas_recibidas (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
proveedor_id UUID REFERENCES public.terceros(id) ON DELETE SET NULL,
periodo_id UUID REFERENCES public.periodos_contables(id) ON DELETE SET NULL,
numero TEXT NOT NULL,
fecha TIMESTAMPTZ NOT NULL,
fecha_vencimiento TIMESTAMPTZ,
monto_neto NUMERIC(19,4) NOT NULL CHECK (monto_neto >= 0),
monto_iva NUMERIC(19,4) NOT NULL CHECK (monto_iva >= 0),
monto_exento NUMERIC(19,4) NOT NULL DEFAULT 0,
monto_iva_usado NUMERIC(19,4) NOT NULL DEFAULT 0,
monto_total NUMERIC(19,4) NOT NULL CHECK (monto_total >= 0),
estado TEXT NOT NULL DEFAULT 'Pendiente',
tipo_documento TEXT NOT NULL DEFAULT 'Factura',
descripcion TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturas_recibidas_empresa ON public.facturas_recibidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_recibidas_proveedor ON public.facturas_recibidas(proveedor_id);

CREATE TABLE IF NOT EXISTS public.reportes (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
tipo TEXT NOT NULL,
nombre TEXT NOT NULL,
descripcion TEXT,
periodo TEXT NOT NULL,
mes INTEGER CHECK (mes BETWEEN 1 AND 12),
anio INTEGER NOT NULL CHECK (anio >= 2000),
datos JSONB NOT NULL DEFAULT '{}',
archivo_url TEXT,
estado TEXT NOT NULL DEFAULT 'Generando',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reportes_empresa ON public.reportes(empresa_id);

CREATE TABLE IF NOT EXISTS public.calculos_ia (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
tipo TEXT NOT NULL,
parametros JSONB NOT NULL DEFAULT '{}',
resultado JSONB NOT NULL DEFAULT '{}',
confianza NUMERIC(5,2) CHECK (confianza BETWEEN 0 AND 100),
prompt TEXT,
respuesta_ia TEXT,
estado TEXT NOT NULL DEFAULT 'Procesando',
error TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calculos_ia_empresa ON public.calculos_ia(empresa_id);

CREATE TABLE IF NOT EXISTS public.conciliaciones_sumup (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
factura_id UUID REFERENCES public.facturas_emitidas(id) ON DELETE SET NULL,
checkout_id TEXT,
transaction_id TEXT,
monto NUMERIC(19,4) NOT NULL CHECK (monto >= 0),
comision NUMERIC(19,4) NOT NULL DEFAULT 0,
neto NUMERIC(19,4) NOT NULL CHECK (neto >= 0),
estado TEXT NOT NULL DEFAULT 'PENDIENTE',
tipo TEXT NOT NULL DEFAULT 'servicio',
observaciones TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_sumup_empresa ON public.conciliaciones_sumup(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_sumup_transaction ON public.conciliaciones_sumup(transaction_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_sumup_factura ON public.conciliaciones_sumup(factura_id);

CREATE TABLE IF NOT EXISTS public.configuracion_ia (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
clave TEXT NOT NULL UNIQUE,
valor TEXT NOT NULL,
descripcion TEXT,
tipo TEXT NOT NULL DEFAULT 'texto',
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══ RLS policies ═══

ALTER TABLE public.facturas_recibidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculos_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliaciones_sumup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empresa_users_read_facturas_recibidas" ON public.facturas_recibidas;
CREATE POLICY "empresa_users_read_facturas_recibidas" ON public.facturas_recibidas
FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_insert_facturas_recibidas" ON public.facturas_recibidas;
CREATE POLICY "empresa_users_insert_facturas_recibidas" ON public.facturas_recibidas
FOR INSERT WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_update_facturas_recibidas" ON public.facturas_recibidas;
CREATE POLICY "empresa_users_update_facturas_recibidas" ON public.facturas_recibidas
FOR UPDATE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_delete_facturas_recibidas" ON public.facturas_recibidas;
CREATE POLICY "empresa_users_delete_facturas_recibidas" ON public.facturas_recibidas
FOR DELETE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_read_reportes" ON public.reportes;
CREATE POLICY "empresa_users_read_reportes" ON public.reportes
FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_insert_reportes" ON public.reportes;
CREATE POLICY "empresa_users_insert_reportes" ON public.reportes
FOR INSERT WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_update_reportes" ON public.reportes;
CREATE POLICY "empresa_users_update_reportes" ON public.reportes
FOR UPDATE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_delete_reportes" ON public.reportes;
CREATE POLICY "empresa_users_delete_reportes" ON public.reportes
FOR DELETE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_read_calculos_ia" ON public.calculos_ia;
CREATE POLICY "empresa_users_read_calculos_ia" ON public.calculos_ia
FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_insert_calculos_ia" ON public.calculos_ia;
CREATE POLICY "empresa_users_insert_calculos_ia" ON public.calculos_ia
FOR INSERT WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_update_calculos_ia" ON public.calculos_ia;
CREATE POLICY "empresa_users_update_calculos_ia" ON public.calculos_ia
FOR UPDATE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_read_conciliaciones_sumup" ON public.conciliaciones_sumup;
CREATE POLICY "empresa_users_read_conciliaciones_sumup" ON public.conciliaciones_sumup
FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_insert_conciliaciones_sumup" ON public.conciliaciones_sumup;
CREATE POLICY "empresa_users_insert_conciliaciones_sumup" ON public.conciliaciones_sumup
FOR INSERT WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_update_conciliaciones_sumup" ON public.conciliaciones_sumup;
CREATE POLICY "empresa_users_update_conciliaciones_sumup" ON public.conciliaciones_sumup
FOR UPDATE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "empresa_users_delete_conciliaciones_sumup" ON public.conciliaciones_sumup;
CREATE POLICY "empresa_users_delete_conciliaciones_sumup" ON public.conciliaciones_sumup
FOR DELETE USING (empresa_id IN (SELECT empresa_id FROM public.usuarios_empresas WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "authenticated_read_configuracion_ia" ON public.configuracion_ia;
CREATE POLICY "authenticated_read_configuracion_ia" ON public.configuracion_ia
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "owner_manage_configuracion_ia" ON public.configuracion_ia;
CREATE POLICY "owner_manage_configuracion_ia" ON public.configuracion_ia
FOR ALL USING (auth.role() = 'authenticated');
