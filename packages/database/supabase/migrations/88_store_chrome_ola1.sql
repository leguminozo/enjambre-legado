-- ─── Ola 1: chrome global de tienda (theme, announcement, footer, pwa, brand)

-- Theme
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'theme_settings', 0, '{
  "default_theme": "system",
  "grain_intensity": 0.35,
  "border_radius": "md",
  "force_dark_public": false
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'theme_settings');

-- Announcement settings
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'announcement_settings', 0, '{
  "enabled": true,
  "interval_ms": 5000,
  "height_mobile_px": 36,
  "height_desktop_px": 42,
  "dismissible": true
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'announcement_settings');

-- Announcement slides
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, v.item_order, v.content::jsonb, true
FROM (
  VALUES
    ('announcement_slides', 0, '{"text":"Bienvenido a la experiencia digital. Te estábamos esperando","text_en":"Welcome to the digital experience. We were waiting for you"}'),
    ('announcement_slides', 1, '{"text":"Directo del bosque a tu hogar","text_en":"Straight from the forest to your home"}'),
    ('announcement_slides', 2, '{"text":"Hecho artesanalmente. Ritmo naturaleza","text_en":"Handmade. Nature''s pace"}'),
    ('announcement_slides', 3, '{"text":"Consume menos. Consume mejor","text_en":"Consume less. Consume better"}'),
    ('announcement_slides', 4, '{"text":"Cada gota regenera bosque nativo","text_en":"Every drop regenerates native forest"}'),
    ('announcement_slides', 5, '{"text":"Nuestra miel no es producto, es legado","text_en":"Our honey is not a product — it is legacy"}'),
    ('announcement_slides', 6, '{"text":"Envío gratis comprando desde $55.000","text_en":"Free shipping from $55.000"}')
) AS v(section_key, item_order, content)
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'announcement_slides');

-- Footer settings
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'footer_settings', 0, '{
  "brand_line1": "La Obrera",
  "brand_line2": "y el Zángano",
  "brand_tracking_em": 0.4,
  "intro": "Síguenos desde tu entorno digital favorito. Accederás solo a lo esencial. ¡Sé parte de la experiencia completa!",
  "intro_en": "Follow us on your favorite channel. Only the essential. Be part of the full experience!",
  "show_newsletter": true,
  "newsletter_title": "Únete al Club Legado del Bosque:",
  "newsletter_title_en": "Join the Forest Legacy Club:",
  "newsletter_desc": "Suscríbete para no perderte novedades, consejos del néctar y regalos únicos.",
  "newsletter_desc_en": "Subscribe for news, nectar tips and unique gifts.",
  "newsletter_placeholder": "Ingresa tu e-mail y únete al Legado del Bosque",
  "newsletter_placeholder_en": "Enter your email and join the Forest Legacy",
  "copyright_suffix": "Todos los derechos reservados.",
  "show_social": true,
  "show_legal": true
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'footer_settings');

-- Footer social
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, v.item_order, v.content::jsonb, true
FROM (
  VALUES
    ('footer_social', 0, '{"label":"WhatsApp","href":"https://wa.me/56940831358","network":"whatsapp"}'),
    ('footer_social', 1, '{"label":"Instagram","href":"https://instagram.com/obrera_y_zangano","network":"instagram"}'),
    ('footer_social', 2, '{"label":"Facebook","href":"https://www.facebook.com/ObreraZangano/","network":"facebook"}'),
    ('footer_social', 3, '{"label":"TikTok","href":"https://www.tiktok.com/@obrera_y_zangano","network":"tiktok"}'),
    ('footer_social', 4, '{"label":"X","href":"https://x.com/obrerayzangano","network":"x"}'),
    ('footer_social', 5, '{"label":"YouTube","href":"https://www.youtube.com/@obrerayzangano","network":"youtube"}')
) AS v(section_key, item_order, content)
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'footer_social');

-- PWA nav settings
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'pwa_nav_settings', 0, '{"enabled": true}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'pwa_nav_settings');

-- PWA nav items
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, v.item_order, v.content::jsonb, true
FROM (
  VALUES
    ('pwa_nav_items', 0, '{"label":"Inicio","label_en":"Home","href":"/","icon":"home"}'),
    ('pwa_nav_items', 1, '{"label":"Tienda","label_en":"Store","href":"/catalogo","icon":"store"}'),
    ('pwa_nav_items', 2, '{"label":"Escanear","label_en":"Scan","href":"/qr-scan","icon":"scan"}'),
    ('pwa_nav_items', 3, '{"label":"Legado","label_en":"Legacy","href":"/perfil","icon":"legacy"}'),
    ('pwa_nav_items', 4, '{"label":"Bolsa","label_en":"Bag","href":"/carrito","icon":"bag"}')
) AS v(section_key, item_order, content)
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'pwa_nav_items');

-- Brand assets
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'brand_assets', 0, '{
  "logo_url": "/icons/icon-192.svg",
  "logo_footer_url": "",
  "favicon_url": "/icons/icon-192.svg",
  "og_image_url": ""
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'brand_assets');
