-- Migración: Seed de territoria_layout en site_content
-- Permite ordenar y activar/desactivar los bloques de la landing page del Registro Territorial Apícola de Chiloé

INSERT INTO site_content (section_key, item_order, locale, is_active, content)
SELECT 'territorio_layout', 0, 'es', true, '{
  "sections": [
    {"id": "territorio_hero", "enabled": true, "order": 0},
    {"id": "territorio_privacidad", "enabled": true, "order": 1},
    {"id": "territorio_beneficios", "enabled": true, "order": 2},
    {"id": "territorio_pasos", "enabled": true, "order": 3},
    {"id": "territorio_herramientas", "enabled": true, "order": 4},
    {"id": "territorio_origen", "enabled": true, "order": 5},
    {"id": "territorio_carta", "enabled": true, "order": 6},
    {"id": "territorio_institucional", "enabled": true, "order": 7},
    {"id": "territorio_faq", "enabled": true, "order": 8},
    {"id": "territorio_censo", "enabled": true, "order": 9}
  ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'territorio_layout' AND locale = 'es');
