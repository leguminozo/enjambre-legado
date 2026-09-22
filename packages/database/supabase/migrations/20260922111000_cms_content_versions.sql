-- Historial de versiones del CMS: cada guardado con cambios conserva el estado
-- previo para poder restaurar. Escritura desde el BFF (cliente del operador
-- admin); lectura solo admin. La tienda pública nunca lee esta tabla.

CREATE TABLE IF NOT EXISTS cms_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  item_id UUID REFERENCES site_content(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  draft_content JSONB,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_versions_section_item
  ON cms_content_versions(section_key, item_id, created_at DESC);

ALTER TABLE cms_content_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_versions_admin_read" ON cms_content_versions;
CREATE POLICY "cms_versions_admin_read" ON cms_content_versions
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "cms_versions_admin_write" ON cms_content_versions;
CREATE POLICY "cms_versions_admin_write" ON cms_content_versions
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cms_versions_admin_prune" ON cms_content_versions;
CREATE POLICY "cms_versions_admin_prune" ON cms_content_versions
  FOR DELETE USING (public.is_admin());
