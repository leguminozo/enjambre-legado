-- RLS para dominio contable multi-empresa

CREATE OR REPLACE FUNCTION public.has_empresa_access(target_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_empresas ue
    WHERE ue.user_id = auth.uid()
      AND ue.empresa_id = target_empresa_id
  );
$$;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terceros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_emitidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresas_select ON public.empresas;
DROP POLICY IF EXISTS empresas_insert ON public.empresas;
DROP POLICY IF EXISTS empresas_update ON public.empresas;

CREATE POLICY empresas_select ON public.empresas
  FOR SELECT USING (public.has_empresa_access(id));

CREATE POLICY empresas_insert ON public.empresas
  FOR INSERT WITH CHECK (public.is_gerente());

CREATE POLICY empresas_update ON public.empresas
  FOR UPDATE USING (public.has_empresa_access(id) OR public.is_gerente())
  WITH CHECK (public.has_empresa_access(id) OR public.is_gerente());

DROP POLICY IF EXISTS usuarios_empresas_select ON public.usuarios_empresas;
DROP POLICY IF EXISTS usuarios_empresas_insert ON public.usuarios_empresas;
DROP POLICY IF EXISTS usuarios_empresas_update ON public.usuarios_empresas;

CREATE POLICY usuarios_empresas_select ON public.usuarios_empresas
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());

CREATE POLICY usuarios_empresas_insert ON public.usuarios_empresas
  FOR INSERT WITH CHECK (public.is_gerente());

CREATE POLICY usuarios_empresas_update ON public.usuarios_empresas
  FOR UPDATE USING (public.is_gerente())
  WITH CHECK (public.is_gerente());

DROP POLICY IF EXISTS terceros_all ON public.terceros;
CREATE POLICY terceros_all ON public.terceros
  FOR ALL USING (public.has_empresa_access(empresa_id))
  WITH CHECK (public.has_empresa_access(empresa_id));

DROP POLICY IF EXISTS periodos_contables_all ON public.periodos_contables;
CREATE POLICY periodos_contables_all ON public.periodos_contables
  FOR ALL USING (public.has_empresa_access(empresa_id))
  WITH CHECK (public.has_empresa_access(empresa_id));

DROP POLICY IF EXISTS facturas_emitidas_all ON public.facturas_emitidas;
CREATE POLICY facturas_emitidas_all ON public.facturas_emitidas
  FOR ALL USING (public.has_empresa_access(empresa_id))
  WITH CHECK (public.has_empresa_access(empresa_id));

DROP POLICY IF EXISTS gastos_all ON public.gastos;
CREATE POLICY gastos_all ON public.gastos
  FOR ALL USING (public.has_empresa_access(empresa_id))
  WITH CHECK (public.has_empresa_access(empresa_id));

DROP POLICY IF EXISTS impuestos_all ON public.impuestos;
CREATE POLICY impuestos_all ON public.impuestos
  FOR ALL USING (public.has_empresa_access(empresa_id))
  WITH CHECK (public.has_empresa_access(empresa_id));
