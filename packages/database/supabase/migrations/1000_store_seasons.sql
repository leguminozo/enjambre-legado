-- ─── Temporadas Web (Control de Versiones del Hero y Layout) ─────────────────
-- Implementa guardado de diseños múltiples (Cosecha, Cyber, Navidad)
-- permitiendo que Tienda consuma solo la temporada activa de manera transparente.

CREATE TABLE IF NOT EXISTS store_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  landing_layout JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índice parcial único para garantizar que SÓLO UNA temporada esté activa a la vez
CREATE UNIQUE INDEX idx_store_seasons_active ON store_seasons (is_active) WHERE is_active = true;

-- Trigger para `updated_at`
CREATE TRIGGER handle_updated_at_store_seasons
  BEFORE UPDATE ON store_seasons
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Migrar el layout actual a la primera temporada "Legado"
INSERT INTO store_seasons (name, description, landing_layout, is_active)
SELECT 'Temporada Actual (Legado)', 'Diseño migrado de site_content', content, true
FROM site_content 
WHERE section_key = 'landing_layout' 
LIMIT 1;

-- RLS
ALTER TABLE store_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de temporada activa" ON store_seasons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins gestionan temporadas" ON store_seasons
  FOR ALL USING (public.is_admin());
