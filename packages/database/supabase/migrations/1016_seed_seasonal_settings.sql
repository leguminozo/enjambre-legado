-- Seeding default seasonal settings (idempotent)
-- Valores vacíos = la tienda usa el contenido por temporada calculado por mes.
INSERT INTO site_content (section_key, item_order, content)
SELECT 'seasonal_settings', 0,
'{"primavera":{"label_es":"","label_en":"","message_es":"","message_en":"","floraciones":""},"verano":{"label_es":"","label_en":"","message_es":"","message_en":"","floraciones":""},"otono":{"label_es":"","label_en":"","message_es":"","message_en":"","floraciones":""},"invierno":{"label_es":"","label_en":"","message_es":"","message_en":"","floraciones":""}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'seasonal_settings');
