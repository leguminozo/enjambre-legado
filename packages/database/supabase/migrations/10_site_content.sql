-- ─── CMS / Contenido de Sitio ─────────────────────────────────────────────
-- Esta tabla permite desacoplar los textos comerciales del código fuente.

CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL, -- 'servicios', 'talleres', 'hero', etc.
  item_order INT DEFAULT 0,
  content JSONB NOT NULL, -- Estructura flexible según la sección
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por sección
CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section_key);

-- Insertar datos iniciales para evitar que la landing quede vacía (Seed)
-- SERVICIOS
INSERT INTO site_content (section_key, item_order, content) VALUES
('servicios', 1, '{"num": "01", "title": "Distribución Mayorista", "desc": "Suministro directo para hoteles, restaurantes y selectos comercios. Volumen mínimo 50kg."}'),
('servicios', 2, '{"num": "02", "title": "Envasado Privado", "desc": "Etiquetado personalizado para eventos corporativos, matrimonios y regalos de alto standing."}'),
('servicios', 3, '{"num": "03", "title": "Exportación Selectiva", "desc": "Logística especializada para mercados de alto valor en Asia y Europa. Certificaciones sanitarias incluidas."}'),
('servicios', 4, '{"num": "04", "title": "Consultoría Apícola", "desc": "Asesoría técnica para nuevos apicultores y optimización de colmenares existentes en zonas húmedas."}');

-- TALLERES
INSERT INTO site_content (section_key, item_order, content) VALUES
('talleres', 1, '{"date": "Próxima fecha — Junio 2026", "title": "La Arquitectura de la Colmena", "desc": "Tres días de inmersión en el bosque de Chiloé. Aprendizaje práctico sobre el manejo respetuoso de la abeja nativa y la extracción artesanal.", "action": "Solicitar cupo"}'),
('talleres', 2, '{"date": "Bimensual", "title": "Cata de Mieles Oscuras", "desc": "Sesiones sensoriales guiadas para identificar notas, texturas y orígenes botánicos. Desarrollo del paladar para mieles monoflorales.", "action": "Inscribirse"}'),
('talleres', 3, '{"date": "A demanda", "title": "Medicina del Panal", "desc": "Elaboración de ungüentos, tinturas y remedios tradicionales a partir de productos de la colmena. Enfoque en autosuficiencia.", "action": "Consultar"}');

-- COLECCIONES
INSERT INTO site_content (section_key, item_order, content) VALUES
('colecciones', 1, '{"kicker": "Sachets", "title": "Gotas de Néctar", "desc": "¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.", "href": "/catalogo"}'),
('colecciones', 2, '{"kicker": "Frascos Medios", "title": "Tesoros del Colmenar", "desc": "¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.", "href": "/catalogo"}'),
('colecciones', 3, '{"kicker": "Frascos Mayores", "title": "Reservas del Bosque", "desc": "Nuestra mayor reserva para el futuro. Sobrevive a la incertidumbre y acompaña momentos únicos.", "href": "/catalogo"}'),
('colecciones', 4, '{"kicker": "Miel Virgen", "title": "Panal de Bosque", "desc": "El placer de miel libre de intervenciones. La pureza del néctar, una huella del cosmos.", "href": "/catalogo"}'),
('colecciones', 5, '{"kicker": "Cajas de Sachets", "title": "Cofres del Enjambre", "desc": "20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.", "href": "/catalogo"}'),
('colecciones', 6, '{"kicker": "Suscripciones", "title": "Legado del Bosque", "desc": "La búsqueda de legado y regeneración desde el sur del planeta. Creaciones en su máximo esplendor.", "href": "/catalogo"}');

-- FOOTER BRANDING
INSERT INTO site_content (section_key, content) VALUES
('footer_branding', '{"tagline": "¡Seamos Legado! Luce saludable. Sé parte del cambio.", "email": "hola@obrerayzangano.com"}');

-- FOOTER NAV
INSERT INTO site_content (section_key, item_order, content) VALUES
('footer_nav', 1, '{"label": "Inicio", "href": "/"}'),
('footer_nav', 2, '{"label": "Creaciones", "href": "/catalogo"}'),
('footer_nav', 3, '{"label": "Experiencias", "href": "/experiencias"}'),
('footer_nav', 4, '{"label": "Nosotros", "href": "/nosotros"}'),
('footer_nav', 5, '{"label": "Galería", "href": "/galeria"}'),
('footer_nav', 6, '{"label": "Contacto", "href": "/contacto"}');

-- FOOTER LEGAL
INSERT INTO site_content (section_key, item_order, content) VALUES
('footer_legal', 1, '{"label": "Política de privacidad", "href": "/privacidad"}'),
('footer_legal', 2, '{"label": "Términos del servicio", "href": "/terminos"}'),
('footer_legal', 3, '{"label": "Política de cancelación", "href": "/cancelacion"}'),
('footer_legal', 4, '{"label": "Política de envío", "href": "/envio"}'),
('footer_legal', 5, '{"label": "Política de reembolso", "href": "/reembolso"}');

-- Habilitar RLS para lectura pública
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contenido público legible por todos" ON site_content FOR SELECT USING (is_active = true);
