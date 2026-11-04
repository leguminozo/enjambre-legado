-- Migración 20261103220000: Sincronizar imágenes de experiencias_settings hacia experiencias_home_settings
-- Asegura que las imágenes configuradas en la sección de experiencias aparezcan en las tarjetas del home.

UPDATE site_content
SET content = content || jsonb_build_object(
      'card1_image', COALESCE(
        NULLIF((SELECT content->>'card1_image' FROM site_content WHERE section_key = 'experiencias_settings'), ''),
        'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/bdf279ee-9dc4-4f52-9c29-2c3e522cd8db.webp'
      ),
      'card2_image', COALESCE(
        NULLIF((SELECT content->>'flagship_image' FROM site_content WHERE section_key = 'experiencias_settings'), ''),
        'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/79ab060c-e458-4e26-b234-8c9b0caa6a5c.webp'
      ),
      'card3_image', COALESCE(
        NULLIF((SELECT content->>'card3_image' FROM site_content WHERE section_key = 'experiencias_settings'), ''),
        'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/9f75a68a-2464-4096-a11a-40ddd4a22b9f.webp'
      )
    ),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'experiencias_home_settings';
