-- ─── Saneamiento y escala tipográfica centralizada para el CMS ─────────────────
-- Agrega de forma idempotente las escalas font_scale, heading_scale y body_scale a typography_settings

UPDATE site_content
SET content = jsonb_build_object(
  'font_display', COALESCE(content->>'font_display', 'Cormorant Garamond'),
  'font_sans', COALESCE(content->>'font_sans', 'Source Sans 3'),
  'font_scale', COALESCE((content->>'font_scale')::numeric, 1.0),
  'heading_scale', COALESCE((content->>'heading_scale')::numeric, 1.0),
  'body_scale', COALESCE((content->>'body_scale')::numeric, 1.0)
)
WHERE section_key = 'typography_settings';

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'typography_settings', 0, '{
  "font_display": "Cormorant Garamond",
  "font_sans": "Source Sans 3",
  "font_scale": 1.0,
  "heading_scale": 1.0,
  "body_scale": 1.0
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'typography_settings');
