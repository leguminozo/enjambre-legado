-- RLS write policy for site_content (gerente + tienda_admin)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_content_write ON site_content;
CREATE POLICY site_content_write ON site_content
  FOR ALL USING (
    public.is_gerente() OR public.current_role() = 'tienda_admin'
  ) WITH CHECK (
    public.is_gerente() OR public.current_role() = 'tienda_admin'
  );

DROP POLICY IF EXISTS "Contenido público legible por todos" ON site_content;
CREATE POLICY "Contenido público legible por todos" ON site_content
  FOR SELECT USING (true);
