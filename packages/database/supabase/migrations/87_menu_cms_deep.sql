-- ─── Menú profundo (upgrade de menu_settings / menu_links) ───────────────────
-- Expande el seed 86 con tipografía, burger, toggles y labels bilingües.
-- Idempotente: solo rellena campos faltantes / enriquece links existentes.

-- Settings: merge defaults profundos sobre el row actual
UPDATE site_content
SET
  content = content || '{
    "layout": "classic",
    "mobile_menu": "fullscreen",
    "force_burger_desktop": false,
    "height_mobile_px": 64,
    "height_desktop_px": 80,
    "nav_letter_spacing_em": 0.2,
    "nav_item_gap_px": 40,
    "nav_font_size_px": 10.4,
    "nav_text_transform": "uppercase",
    "nav_font": "sans",
    "mobile_item_gap_px": 28,
    "mobile_font_size_px": 30,
    "mobile_font": "display",
    "mobile_letter_spacing_em": 0,
    "brand_line1": "La Obrera",
    "brand_line2": "y el Zángano",
    "brand_letter_spacing_em": 0.3,
    "show_brand_text": true,
    "show_cart": true,
    "show_account": true,
    "show_lang_selector": true,
    "show_notifications": true,
    "sticky": true,
    "backdrop_blur": true
  }'::jsonb,
  updated_at = NOW()
WHERE section_key = 'menu_settings';

-- Si no hay settings (seed 86 no aplicado), insertar
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT
  'menu_settings',
  0,
  '{
    "layout": "classic",
    "mobile_menu": "fullscreen",
    "force_burger_desktop": false,
    "menu_format": "horizontal",
    "height_mobile_px": 64,
    "height_desktop_px": 80,
    "height_mobile": 64,
    "height_desktop": 80,
    "nav_letter_spacing_em": 0.2,
    "nav_item_gap_px": 40,
    "letter_spacing": "0.2em",
    "button_gap": "2.5rem",
    "nav_font_size_px": 10.4,
    "nav_text_transform": "uppercase",
    "nav_font": "sans",
    "mobile_item_gap_px": 28,
    "mobile_font_size_px": 30,
    "mobile_font": "display",
    "mobile_letter_spacing_em": 0,
    "brand_line1": "La Obrera",
    "brand_line2": "y el Zángano",
    "brand_letter_spacing_em": 0.3,
    "show_brand_text": true,
    "show_cart": true,
    "show_account": true,
    "show_lang_selector": true,
    "show_notifications": true,
    "sticky": true,
    "backdrop_blur": true
  }'::jsonb,
  true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'menu_settings');

-- Links: añadir campos show_* y label_en si faltan
UPDATE site_content
SET
  content = content
    || jsonb_build_object(
      'show_desktop', COALESCE((content->>'show_desktop')::boolean, true),
      'show_mobile', COALESCE((content->>'show_mobile')::boolean, true)
    ),
  updated_at = NOW()
WHERE section_key = 'menu_links'
  AND (content ? 'label')
  AND (NOT (content ? 'show_desktop') OR NOT (content ? 'show_mobile'));

-- Si no hay links, seed canónico
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, v.item_order, v.content::jsonb, true
FROM (
  VALUES
    ('menu_links', 0, '{"label":"Inicio","label_en":"Home","href":"/","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 1, '{"label":"Creaciones","label_en":"Creations","href":"/catalogo","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 2, '{"label":"Experiencias","label_en":"Experiences","href":"/experiencias","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 3, '{"label":"Galería","label_en":"Gallery","href":"/galeria","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 4, '{"label":"Ciencia","label_en":"Science","href":"/ciencia","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 5, '{"label":"Nosotros","label_en":"About","href":"/nosotros","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 6, '{"label":"Escáner QR","label_en":"QR Scan","href":"/qr-scan","show_desktop":true,"show_mobile":true}'),
    ('menu_links', 7, '{"label":"Contacto","label_en":"Contact","href":"/contacto","show_desktop":true,"show_mobile":true}')
) AS v(section_key, item_order, content)
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'menu_links');
