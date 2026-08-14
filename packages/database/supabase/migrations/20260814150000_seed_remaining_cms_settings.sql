-- Migración: Seed de nosotros_settings, media_settings y ciencia_settings en site_content
-- Permite personalizar formatos, aspectos de imagen y textos para Nosotros, Carrusel de Media y Ciencia.

INSERT INTO site_content (section_key, item_order, content)
SELECT 'nosotros_settings', 0, '{
  "kicker": "Nuestra Historia",
  "kicker_en": "Our Story",
  "title": "Renacer de las Cenizas en Chiloé",
  "title_en": "Rebirth from the Ashes in Chiloé",
  "subtitle": "22 años de regeneración ecológica, apicultura regenerativa y miel cruda.",
  "subtitle_en": "22 years of ecological regeneration, regenerative apiculture and raw honey.",
  "image_aspect_ratio": "16/9",
  "image_fit": "cover"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'nosotros_settings');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'media_settings', 0, '{
  "carousel_height": "50vh/70vh",
  "image_fit": "cover",
  "autoplay_ms": 5000
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'media_settings');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'ciencia_settings', 0, '{
  "kicker": "Ciencia",
  "kicker_en": "Science",
  "title": "La ciencia del bosque",
  "title_en": "Forest Science",
  "subtitle": "Cada frasco condensa un proceso biofísico observable. Estas son las ecuaciones que lo demuestran.",
  "subtitle_en": "Each jar condenses an observable biophysical process."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'ciencia_settings');
