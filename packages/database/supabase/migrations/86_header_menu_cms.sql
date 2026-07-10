-- ─── Header / Menú de tienda (CMS profundo) ─────────────────────────────────
-- Secciones: header_settings (config visual única) + header_nav (enlaces ordenables)
-- Consumidas por apps/tienda ShopHeader y editables en Núcleo /editor-tienda.

-- Settings globales del menú (un solo item activo)
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT
  'header_settings',
  0,
  '{
    "layout": "classic",
    "mobile_menu": "fullscreen",
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
  true
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'header_settings'
);

-- Enlaces del menú público (mirror de PUBLIC_NAV canónico)
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, v.item_order, v.content::jsonb, true
FROM (
  VALUES
    ('header_nav', 0, '{"label":"Inicio","label_en":"Home","href":"/","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 1, '{"label":"Creaciones","label_en":"Creations","href":"/catalogo","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 2, '{"label":"Experiencias","label_en":"Experiences","href":"/experiencias","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 3, '{"label":"Galería","label_en":"Gallery","href":"/galeria","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 4, '{"label":"Ciencia","label_en":"Science","href":"/ciencia","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 5, '{"label":"Nosotros","label_en":"About","href":"/nosotros","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 6, '{"label":"Escáner QR","label_en":"QR Scan","href":"/qr-scan","show_desktop":true,"show_mobile":true}'),
    ('header_nav', 7, '{"label":"Contacto","label_en":"Contact","href":"/contacto","show_desktop":true,"show_mobile":true}')
) AS v(section_key, item_order, content)
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'header_nav'
);
