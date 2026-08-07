-- ─── Ola 4: contenido de bloques del home (CMS-izado) ─────────────────────
-- conservation_content, media_items, video_settings, map_settings, products_settings.
-- Vacío = la tienda cae al i18n/defaults; estos seeds mantienen el look actual
-- y dejan todo editable desde el Editor de Tienda.

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'conservation_content', 0, '{
  "kicker": "Conservación demostrable",
  "kicker_en": "Proven conservation",
  "title": "Impacto sin atajos",
  "title_en": "Impact without shortcuts",
  "desc": "No certificamos con sellos de tercera mano. Nuestro impacto se demuestra por triangulación: papers revisados por pares, datos locales de Chiloé, y cálculos abiertos que cualquier persona puede verificar.",
  "desc_en": "We don''t certify with third-party seals. Our impact is proven by triangulation: peer-reviewed papers, local Chiloé data, and open calculations anyone can verify.",
  "tri_label": "Triangulación de fuentes",
  "tri_label_en": "Triangulation of sources",
  "stat1_label": "Árboles plantados",
  "stat1_label_en": "Trees planted",
  "stat2_label": "CO₂ evitado (kg)",
  "stat2_label_en": "CO₂ avoided (kg)",
  "stat3_label": "Colmenas custodiadas",
  "stat3_label_en": "Hives custodated",
  "stat4_label": "Especies nativas",
  "stat4_label_en": "Native species",
  "tri1_label": "Papers revisados por pares",
  "tri1_label_en": "Peer-reviewed papers",
  "tri1_desc": "Secuestro de carbono en bosque templado lluvioso: 10–25 kg CO₂/árbol/año (Schneider et al., 2020; Gutiérrez & Lara, 2022). Actividad antimicrobiana en mieles chilenas comparable a Manuka (Montes et al., 2019).",
  "tri1_desc_en": "Carbon sequestration in temperate rainforest: 10–25 kg CO₂/tree/year (Schneider et al., 2020; Gutiérrez & Lara, 2022). Antimicrobial activity in Chilean honeys comparable to Manuka (Montes et al., 2019).",
  "tri2_label": "Datos locales de Chiloé",
  "tri2_label_en": "Local Chiloé data",
  "tri2_desc": "Árboles registrados con coordenadas y especie en sectores de Pureo. Colmenas monitoreadas en apiarios entre Quemchi, Molulco y Pureo-Quelen.",
  "tri2_desc_en": "Trees registered with coordinates and species in sectors of Pureo. Hives monitored in apiaries between Quemchi, Molulco and Pureo-Quelen.",
  "tri3_label": "Cálculo abierto",
  "tri3_label_en": "Open calculation",
  "tri3_desc": "IRR = CO₂ capturado / CO₂ emitido. Fórmula y datos verificables en nuestra página de ciencia.",
  "tri3_desc_en": "IRR = CO₂ captured / CO₂ emitted. Formula and data verifiable on our science page.",
  "irr_label": "Índice de Regeneración Relativa",
  "irr_label_en": "Relative Regeneration Index",
  "irr_pos_title": "IRR · Impacto > Huella",
  "irr_pos_title_en": "IRR · Impact > Footprint",
  "irr_pos_desc": "El bosque captura más CO₂ del que la cadena productiva emite. Demostrable por registro forestal + balances de emisión.",
  "irr_pos_desc_en": "The forest captures more CO₂ than the production chain emits. Verifiable by forest registry + emission balances.",
  "irr_neg_title": "Miel de bosque + Reforestación > Huella de producción",
  "irr_neg_title_en": "Forest honey + Reforestation > Production footprint",
  "irr_neg_desc": "Años de reforestación nativa. Cada pedido financia árboles y sostiene apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen.",
  "irr_neg_desc_en": "Years of native reforestation. Each order funds trees and sustains apiaries in native forest between Quemchi, Molulco and Pureo-Quelen.",
  "cta_label": "Ver la ciencia detrás",
  "cta_label_en": "View the science behind"
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'conservation_content');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'media_items', 0, '{"type":"image","src":"/assets/editorial/immersion.png","alt":"Inmersión en el bosque"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'media_items' AND item_order = 0);

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'media_items', 1, '{"type":"image","src":"/assets/editorial/sachets.png","alt":"Sachets de miel"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'media_items' AND item_order = 1);

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'media_items', 2, '{"type":"image","src":"/assets/editorial/honey-jar.png","alt":"Frascos de miel"}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'media_items' AND item_order = 2);

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'video_settings', 0, '{
  "youtube_id": "",
  "title": "La Obrera y el Zángano"
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'video_settings');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'map_settings', 0, '{
  "lat": -43.0837,
  "lng": -73.6144,
  "popup_title": "Pureo Rural km 8560",
  "popup_body": "Queilén ~ Chiloé"
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'map_settings');

INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT 'products_settings', 0, '{
  "kicker": "Creaciones",
  "kicker_en": "Creations",
  "title": "La materia de nuestras búsquedas",
  "title_en": "The matter of our search",
  "desc": "Creaciones cargadas de experiencias y legado.",
  "desc_en": "Creations loaded with experiences and legacy."
}'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'products_settings');
