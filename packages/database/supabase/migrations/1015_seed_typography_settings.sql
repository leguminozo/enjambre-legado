-- Seeding default typography settings (idempotent)
-- Fuentes por defecto = las que hoy están hardcodeadas en tokens.css
INSERT INTO site_content (section_key, item_order, content)
SELECT 'typography_settings', 0, '{"font_display": "Cormorant Garamond", "font_sans": "Inter"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'typography_settings');
