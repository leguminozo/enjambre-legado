-- Migración: Seed de items de la sección Colecciones en site_content.
-- Hermana de 20260814130000_seed_collections_settings_cms.sql: los items
-- alimentan las cards del landing (landing-view) con kicker/title/desc/href.
-- Los textos replican el fallback hardcodeado de apps/tienda/app/page.tsx para
-- que seed y fallback sean idénticos; image vacío habilita el uploader del editor.

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 0, '{
  "kicker": "Sachets",
  "title": "Gotas de Néctar",
  "desc": "¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 1, '{
  "kicker": "Frascos Medios",
  "title": "Tesoros del Colmenar",
  "desc": "¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 2, '{
  "kicker": "Frascos Mayores",
  "title": "Reservas del Bosque",
  "desc": "¡Nuestra mayor reserva para el futuro! Sobrevive a la incertidumbre y acompaña esos momentos que merecen lo mejor.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 3, '{
  "kicker": "Miel Virgen",
  "title": "Panal de Bosque",
  "desc": "El placer de miel, libre de intervenciones. La pureza del néctar. Huella directa del cosmos.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 4, '{
  "kicker": "Cajas de Sachets",
  "title": "Cofres del Enjambre",
  "desc": "20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'colecciones', 5, '{
  "kicker": "Suscripciones",
  "title": "Legado del Bosque",
  "desc": "La búsqueda de legado y regeneración desde el sur del planeta. Disfruta de nuestras creaciones en su máximo esplendor.",
  "href": "/catalogo",
  "image": ""
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'colecciones');
