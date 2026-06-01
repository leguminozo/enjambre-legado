-- Consolidate overlapping ventas RLS policies.
-- Multiple SELECT/INSERT/UPDATE policies exist with conflicting logic.
-- Keep the most permissive correct set, drop redundant ones.

-- Drop redundant per-CRUD policies (superseded by ventas_select/update)
DROP POLICY IF EXISTS "Users can view own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can insert own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can update own ventas" ON public.ventas;
DROP POLICY IF EXISTS "Users can delete own ventas" ON public.ventas;

-- Update ventas_select/update to use vendedor_id (now exists)
DROP POLICY IF EXISTS ventas_select ON public.ventas;
DROP POLICY IF EXISTS ventas_update ON public.ventas;
DROP POLICY IF EXISTS ventas_insert ON public.ventas;

CREATE POLICY ventas_select ON public.ventas
  FOR SELECT USING (public.is_gerente() OR vendedor_id = auth.uid() OR user_id = auth.uid() OR COALESCE(cliente_id, '') = auth.uid()::text);

CREATE POLICY ventas_insert ON public.ventas
  FOR INSERT WITH CHECK (vendedor_id = auth.uid() OR user_id = auth.uid() OR public.is_gerente());

CREATE POLICY ventas_update ON public.ventas
  FOR UPDATE USING (public.is_gerente() OR vendedor_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY ventas_delete ON public.ventas
  FOR DELETE USING (public.is_gerente() OR user_id = auth.uid());
