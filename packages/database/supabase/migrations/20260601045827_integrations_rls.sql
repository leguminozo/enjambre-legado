-- Fix integrations table: RLS enabled but no policies (caused 400 errors).
-- Only gerentes need to read/write integrations config.

DROP POLICY IF EXISTS integrations_select ON public.integrations;
DROP POLICY IF EXISTS integrations_insert ON public.integrations;
DROP POLICY IF EXISTS integrations_update ON public.integrations;
DROP POLICY IF EXISTS integrations_delete ON public.integrations;

CREATE POLICY integrations_select ON public.integrations
  FOR SELECT USING (public.is_gerente() OR auth.role() = 'authenticated');

CREATE POLICY integrations_insert ON public.integrations
  FOR INSERT WITH CHECK (public.is_gerente());

CREATE POLICY integrations_update ON public.integrations
  FOR UPDATE USING (public.is_gerente());

CREATE POLICY integrations_delete ON public.integrations
  FOR DELETE USING (public.is_gerente());
