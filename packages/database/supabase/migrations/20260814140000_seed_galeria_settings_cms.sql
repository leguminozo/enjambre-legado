-- Migración: Seed de galeria_settings en site_content
-- Permite personalizar la relación de aspecto, fit mode, título, kicker y columnas de la página de Galería desde el Editor de Tienda en Núcleo.

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria_settings', 0, '{
  "kicker": "Galería",
  "kicker_en": "Gallery",
  "title": "Un recorrido visual de nuestras huellas",
  "title_en": "A visual journey of our footsteps",
  "subtitle": "Imágenes del bosque, las colmenas y el proceso regenerativo en Chiloé.",
  "subtitle_en": "Images of the forest, hives and regenerative process in Chiloé.",
  "image_aspect_ratio": "4/3",
  "image_fit": "cover",
  "grid_columns": 3
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'galeria_settings');
