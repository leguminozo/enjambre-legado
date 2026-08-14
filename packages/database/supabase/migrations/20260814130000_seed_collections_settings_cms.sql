-- Migración: Seed de collections_settings en site_content
-- Permite personalizar la relación de aspecto, fit mode, título, kicker y columnas de la sección de colecciones desde el Editor de Tienda en Núcleo.

INSERT INTO site_content (section_key, item_order, content)
SELECT 'collections_settings', 0, '{
  "kicker": "Colecciones",
  "kicker_en": "Collections",
  "title": "Explora nuestras categorías estacionales",
  "title_en": "Explore our seasonal categories",
  "subtitle": "",
  "subtitle_en": "",
  "image_aspect_ratio": "4/3",
  "image_fit": "cover",
  "grid_columns": 3
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'collections_settings');
