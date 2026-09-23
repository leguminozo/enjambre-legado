-- Migración 1021: Seeding default content para Bloques de Portada:
-- Encuentros & Origen (experiencias_home_settings) y Alianzas & Negocios (alianzas_home_settings)
-- Idempotente: inserta solo si no existe ya la fila en site_content.

-- 1. Encuentros & Origen (experiencias_home_settings)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'experiencias_home_settings', 0,
'{
  "kicker": "Encuentros & Origen",
  "kicker_en": "Forest Encounters",
  "title": "Vive el Bosque en Primera Persona",
  "title_en": "Experience the Native Forest",
  "subtitle": "Desde estadías y apiturismo vivencial en Predio Pureo (Chiloé) hasta catas sensoriales metódicas en Santiago conducidas por Cristina Miranda.",
  "subtitle_en": "Stay at our native cabin in Chiloé, navigate quiet fjords by kayak, open hives with our beekeeper, or join an intimate honey tasting in Santiago.",
  "card1_tag": "Chiloé · Origen",
  "card1_tag_en": "Chiloé · Origin",
  "card1_title": "Territorio & Bosque Austral",
  "card1_title_en": "Territory & Austral Forest",
  "card1_desc": "Cabaña nativa con fogón a leña, navegación en kayak por esteros y ronda técnica de colmenas entre Ulmos centenarios.",
  "card1_desc_en": "Native timber cabin with wood stove, kayak exploration through quiet fjords, and hive walkthrough among ancient Ulmo trees.",
  "card1_cta": "Conocer estancia",
  "card1_cta_en": "Explore stay",
  "card1_href": "/experiencias/territorio",
  "card2_tag": "Santiago & Regiones",
  "card2_tag_en": "Santiago & Regions",
  "card2_title": "Degustaciones · Mieles de Chile",
  "card2_title_en": "Tastings · Honeys of Chile",
  "card2_desc": "Cata sensorial metódica de mieles recolectadas en Chile, kit de degustación y maridaje de contrapunto para directorios y grupos privados.",
  "card2_desc_en": "Methodical sensory tasting of honeys collected in Chile, tasting kit, and pairing counterpoint for private circles.",
  "card2_cta": "Ver degustaciones",
  "card2_cta_en": "View tastings",
  "card2_href": "/experiencias/degustaciones",
  "card3_tag": "Técnica & Formación",
  "card3_tag_en": "Technique & Training",
  "card3_title": "Talleres de Técnica Apícola",
  "card3_title_en": "Beekeeping Technique Workshops",
  "card3_desc": "Manejo técnico de la colmena, sanidad y adaptación biológica en el bosque templado lluvioso.",
  "card3_desc_en": "Technical hive management, bee health, and biological adaptation in the temperate rainforest.",
  "card3_cta": "Ver programas",
  "card3_cta_en": "View workshops",
  "card3_href": "/experiencias/talleres"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'experiencias_home_settings');

-- 2. Alianzas & Negocios (alianzas_home_settings)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'alianzas_home_settings', 0,
'{
  "kicker": "Alianzas & Negocios",
  "kicker_en": "Wholesale & Partnerships",
  "title": "Lleva la Miel Nativa de Chiloé a tu Espacio",
  "title_en": "Bring Native Chiloé Honey to Your Space",
  "subtitle": "Formatos para cafeterías de especialidad (sachets monodosis), hoteles (frascos de cortesía 40g), tiendas gourmet y revendedores autorizados. Facturación formal y despacho garantizado a todo Chile.",
  "subtitle_en": "Formats for specialty coffee shops (single-serve sachets), hotels (40g courtesy jars), gourmet shops, and authorized resellers. Formal invoicing and nationwide delivery across Chile.",
  "tag1_label": "Cafeterías",
  "tag1_label_en": "Coffee Shops",
  "tag1_href": "/alianzas/cafeterias",
  "tag2_label": "Hoteles",
  "tag2_label_en": "Hotels",
  "tag2_href": "/alianzas/hoteles",
  "tag3_label": "Tiendas Gourmet",
  "tag3_label_en": "Gourmet Shops",
  "tag3_href": "/alianzas/tiendas-gourmet",
  "tag4_label": "Revendedores",
  "tag4_label_en": "Resellers",
  "tag4_href": "/alianzas/revendedores",
  "cta_kicker": "Catálogo mayorista & condiciones directas",
  "cta_kicker_en": "Wholesale catalog & direct terms",
  "cta_button_label": "Portal Alianzas B2B",
  "cta_button_label_en": "B2B Partnerships Portal",
  "cta_button_href": "/alianzas"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'alianzas_home_settings');
