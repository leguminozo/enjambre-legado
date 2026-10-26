-- Migración 20261026020000: Reparación de URLs canónicas de Storage para b2b_ferias y b2b_revendedores.
-- Restaura las imágenes auténticas WebP existentes en el bucket 'cms' (1441c92d... y 020189d4...)
-- reemplazando los hashes inexistentes (814aaec5... y bd874e95...) que arrojaban 404 NoSuchKey.
-- Solo actualiza si la URL actual apunta a los hashes rotos o está vacía, respetando imágenes personalizadas subidas por operadores.

DO $$
BEGIN
  -- 1. Reparar b2b_ferias
  UPDATE public.site_content
  SET content = jsonb_set(
    content,
    '{hero_image}',
    '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/1441c92d-0e75-44fe-aef7-476ccb2aaf74.webp"'
  ),
  updated_at = NOW()
  WHERE section_key = 'b2b_ferias'
    AND (
      content->>'hero_image' IS NULL
      OR content->>'hero_image' = ''
      OR content->>'hero_image' LIKE '%814aaec5-330b-4ff2-8872-0c540b0e7825%'
      OR content->>'hero_image' LIKE '/images/b2b/%'
    );

  -- 2. Reparar b2b_revendedores
  UPDATE public.site_content
  SET content = jsonb_set(
    content,
    '{hero_image}',
    '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/020189d4-756b-4ea3-995e-b3413ffef179.webp"'
  ),
  updated_at = NOW()
  WHERE section_key = 'b2b_revendedores'
    AND (
      content->>'hero_image' IS NULL
      OR content->>'hero_image' = ''
      OR content->>'hero_image' LIKE '%bd874e95-611d-4d04-ad3a-d28a7fd7d6f5%'
      OR content->>'hero_image' LIKE '/images/b2b/%'
    );

  -- 3. Reparar referencias en b2b_hub_settings
  UPDATE public.site_content
  SET content = jsonb_set(
    content,
    '{seg_ferias_image}',
    '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/1441c92d-0e75-44fe-aef7-476ccb2aaf74.webp"'
  ),
  updated_at = NOW()
  WHERE section_key = 'b2b_hub_settings'
    AND (
      content->>'seg_ferias_image' LIKE '%814aaec5-330b-4ff2-8872-0c540b0e7825%'
      OR content->>'seg_ferias_image' LIKE '/images/b2b/%'
    );

  UPDATE public.site_content
  SET content = jsonb_set(
    content,
    '{seg_revendedores_image}',
    '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/020189d4-756b-4ea3-995e-b3413ffef179.webp"'
  ),
  updated_at = NOW()
  WHERE section_key = 'b2b_hub_settings'
    AND (
      content->>'seg_revendedores_image' LIKE '%bd874e95-611d-4d04-ad3a-d28a7fd7d6f5%'
      OR content->>'seg_revendedores_image' LIKE '/images/b2b/%'
    );

END $$;
