-- ─── Ola 2: landing layout, catálogo, PDP

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'landing_layout', 0, '{
  "sections": [
    {"id":"hero","enabled":true,"order":0},
    {"id":"conservation","enabled":true,"order":1},
    {"id":"collections","enabled":true,"order":2},
    {"id":"media","enabled":true,"order":3},
    {"id":"products","enabled":true,"order":4},
    {"id":"video","enabled":true,"order":5},
    {"id":"map","enabled":true,"order":6}
  ],
  "show_grain": true,
  "show_custom_cursor": true,
  "show_bee_canvas": true,
  "hero_cta_label": "Explorar creaciones",
  "hero_cta_label_en": "Explore creations",
  "hero_cta_href": "/catalogo",
  "show_hero_cta": true
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'landing_layout');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'catalog_settings', 0, '{
  "page_title": "Creaciones",
  "page_title_en": "Creations",
  "page_subtitle": "La materia de nuestra búsqueda. Experiencias que se transforman en productos cargados de legado.",
  "page_subtitle_en": "The matter of our search. Experiences that become products of legacy.",
  "columns_desktop": 3,
  "columns_mobile": 2,
  "default_sort": "default",
  "show_search": true,
  "show_filters": true,
  "show_ratings": true,
  "show_badges": true,
  "empty_message": "No hay productos con esos filtros.",
  "empty_message_en": "No products match those filters."
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'catalog_settings');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'pdp_settings', 0, '{
  "show_breadcrumb": true,
  "show_format_badge": true,
  "show_badges": true,
  "show_traceability": true,
  "show_reviews": true,
  "show_replenishment": true,
  "continue_label": "Seguir explorando",
  "continue_label_en": "Keep exploring"
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'pdp_settings');
