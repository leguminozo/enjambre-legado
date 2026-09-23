-- Migración 1024: Estandarización de opacidad de hero y controles en páginas editoriales
-- Idempotente: inyecta defaults de hero_image_opacity y switches de visibilidad si no existen.

-- 1. Alianzas & Negocios (b2b_hub_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 35,
  "hero_badge": "Canal Directo & Formatos de Hospitalidad",
  "hero_badge_en": "Direct Channel & Hospitality Formats",
  "show_garantias": true
}'::jsonb
WHERE section_key = 'b2b_hub_settings'
  AND (content->>'hero_image_opacity' IS NULL OR content->>'show_garantias' IS NULL);

-- 2. Experiencias Cabecera (experiencias_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 45,
  "show_flagship_card": true
}'::jsonb
WHERE section_key = 'experiencias_settings'
  AND (content->>'hero_image_opacity' IS NULL OR content->>'show_flagship_card' IS NULL);

-- 3. Degustaciones & Protocolo de Cata (floraciones_experience_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 35
}'::jsonb
WHERE section_key = 'floraciones_experience_settings'
  AND content->>'hero_image_opacity' IS NULL;

-- 4. Inmersión Predio Pureo (experiencias_pureo_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 30
}'::jsonb
WHERE section_key = 'experiencias_pureo_settings'
  AND content->>'hero_image_opacity' IS NULL;

-- 5. Talleres de Técnica Apícola (experiencias_talleres_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 25
}'::jsonb
WHERE section_key = 'experiencias_talleres_settings'
  AND content->>'hero_image_opacity' IS NULL;

-- 6. Evidencia y Ciencia (ciencia_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 25
}'::jsonb
WHERE section_key = 'ciencia_settings'
  AND content->>'hero_image_opacity' IS NULL;

-- 7. Nosotros & Trayectoria (nosotros_settings)
UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 100
}'::jsonb
WHERE section_key = 'nosotros_settings'
  AND content->>'hero_image_opacity' IS NULL;
