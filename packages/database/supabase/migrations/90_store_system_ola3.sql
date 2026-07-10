-- ─── Ola 3: SEO, contacto, banners, legales en CMS

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'seo_defaults', 0, '{
  "default_title": "La Obrera y el Zángano · Tienda",
  "title_template": "%s · La Obrera y el Zángano",
  "default_description": "Miel cruda del bosque nativo de Chiloé.",
  "default_description_en": "Raw honey from the native forests of Chiloé.",
  "og_image_url": "",
  "site_name": "La Obrera y el Zángano",
  "twitter_handle": ""
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'seo_defaults');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'contact_settings', 0, '{
  "show_whatsapp_float": true,
  "whatsapp_e164": "56940831358",
  "whatsapp_prefill": "Hola, vengo de la tienda La Obrera y el Zángano.",
  "whatsapp_prefill_en": "Hi, I am writing from the La Obrera y el Zángano store.",
  "email": "hola@obrerayzangano.com",
  "phone_display": "+56 9 408 31 358",
  "address": "Pureo rural km 8560, Quellón, Chiloé, Chile",
  "address_en": "Pureo rural km 8560, Quellón, Chiloé, Chile",
  "hours": "Lun–Vie 10:00–18:00 (CL)",
  "hours_en": "Mon–Fri 10:00–18:00 (CL)"
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'contact_settings');

-- Plantillas legales vacías solo si no hay filas (las páginas tienen fallback en código)
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT v.section_key, 0, v.content::jsonb, true
FROM (
  VALUES
    ('legal_terminos', '{"title":"Términos del Servicio","body":"","last_updated":"2026-05-19"}'),
    ('legal_privacidad', '{"title":"Política de privacidad","body":"","last_updated":"2026-05-19"}'),
    ('legal_cookies', '{"title":"Política de cookies","body":"","last_updated":"2026-05-19"}'),
    ('legal_envio', '{"title":"Política de envío","body":"","last_updated":"2026-05-19"}'),
    ('legal_reembolso', '{"title":"Política de reembolso","body":"","last_updated":"2026-05-19"}'),
    ('legal_cancelacion', '{"title":"Política de cancelación","body":"","last_updated":"2026-05-19"}'),
    ('legal_garantia', '{"title":"Política de garantía","body":"","last_updated":"2026-05-19"}')
) AS v(section_key, content)
WHERE NOT EXISTS (
  SELECT 1 FROM site_content sc WHERE sc.section_key = v.section_key
);

-- Ejemplo de banner de campaña (opcional seed)
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'campaign_banners', 0, '{
  "title": "Envío gratis desde $55.000",
  "title_en": "Free shipping from $55.000",
  "body": "Directo del bosque a tu hogar.",
  "body_en": "Straight from the forest to your home.",
  "href": "/catalogo",
  "cta_label": "Explorar creaciones",
  "cta_label_en": "Explore creations",
  "placement": "home",
  "starts_at": "",
  "ends_at": ""
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'campaign_banners');
