-- Migración 20261030010000: Agregar default de hero_image_opacity (35%) a segmentos B2B
-- Idempotente: inyecta "hero_image_opacity": 35 en site_content para los 5 segmentos si no existe.

UPDATE public.site_content
SET content = content || '{"hero_image_opacity": 35}'::jsonb,
    updated_at = NOW()
WHERE section_key IN (
  'b2b_cafeterias',
  'b2b_hoteles',
  'b2b_tiendas_gourmet',
  'b2b_ferias',
  'b2b_revendedores'
)
AND (content->>'hero_image_opacity' IS NULL OR content->>'hero_image_opacity' = '');
