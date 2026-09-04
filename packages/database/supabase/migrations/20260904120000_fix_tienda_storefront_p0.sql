-- Fix P0 tienda: descripciones placeholder, hrefs de colecciones, seeds de galería.
-- Copy tomada de marca existente (llms.txt / collections i18n / Nosotros) — sin claims inventados.

-- 1) Descripciones regenerativas por slug (solo si parecen placeholder / mash)
UPDATE productos
SET descripcion_regenerativa = CASE slug
  WHEN 'miel-virgen' THEN
    'Miel virgen en panal, sellada como sale de la colmena. Pureza del néctar del bosque nativo de Chiloé, sin intervenciones.'
  WHEN 'crema-de-miel-y0r3' THEN
    'Crema de miel ulmo-tepú en frasco de mesa. Dulzura boscosa para tus preparaciones y cada cucharada — Tesoros del Colmenar.'
  WHEN 'crema-de-miel' THEN
    'Crema de miel ulmo-tepú en formato mayor. Reserva del bosque para el ritual cotidiano — Reservas del Bosque.'
  WHEN 'sachet-de-miel-con-avellanas' THEN
    'Sachet de 15 g de crema de miel con avellana, para llevar. Gotas de Néctar del bosque nativo de Chiloé.'
  WHEN 'sachet' THEN
    'Sachet de 15 g de crema de miel ulmo-tepú. Formato mínimo para llevar, regalar o probar — Gotas de Néctar.'
  WHEN 'crema-de-miel-con-polen-4crg' THEN
    'Sachet de 15 g de crema de miel con polen. Dosis individual del bosque nativo de Chiloé — Gotas de Néctar.'
  WHEN 'esencia-de-canelo' THEN
    'Esencia de canelo del bosque nativo de Chiloé. Extracción cuidada del territorio, con la misma trazabilidad de nuestras mieles.'
  ELSE descripcion_regenerativa
END
WHERE slug IN (
  'miel-virgen',
  'crema-de-miel-y0r3',
  'crema-de-miel',
  'sachet-de-miel-con-avellanas',
  'sachet',
  'crema-de-miel-con-polen-4crg',
  'esencia-de-canelo'
)
AND (
  descripcion_regenerativa IS NULL
  OR btrim(descripcion_regenerativa) = ''
  OR length(btrim(descripcion_regenerativa)) < 24
  OR descripcion_regenerativa ~* '^(asdf|qwer|zxcv|lorem|test|xxx|bla|asd|qwe|tyguh|ugyv|knjb|blabla|masld|asdad)'
  OR descripcion_regenerativa ~* 'mejor\\s+miel\\s+de\\s+l\\s+mundo'
);

-- 2) Hrefs de colecciones del landing → filtros reales del catálogo / club
UPDATE site_content
SET content = jsonb_set(
  content,
  '{href}',
  to_jsonb(
    CASE
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'sachet%'
        OR lower(coalesce(content->>'kicker', '')) LIKE 'cajas de sachet%'
        THEN '/catalogo?q=Sachet'
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'frascos medio%'
        OR lower(coalesce(content->>'kicker', '')) = 'frascos'
        THEN '/catalogo?formato=250g'
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'frascos mayor%'
        OR lower(coalesce(content->>'kicker', '')) LIKE 'frascos grand%'
        THEN '/catalogo?formato=1kg'
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'miel virgen%'
        THEN '/catalogo?q=Virgen'
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'hidrolat%'
        THEN '/catalogo?q=Canelo'
      WHEN lower(coalesce(content->>'kicker', '')) LIKE 'suscrip%'
        THEN '/club-legado-del-bosque'
      ELSE coalesce(content->>'href', '/catalogo')
    END
  )
)
WHERE section_key = 'colecciones';

-- 3) Si no hay ítems de galería, seedear con assets reales de public/assets/editorial
INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 0, '{
  "titulo": "Bosque de Pureo",
  "descripcion": "Apertura del bosque nativo donde cuidamos las colmenas",
  "url": "/assets/editorial/hero-bosque-apertura.jpg",
  "orden": 1
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'galeria');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 1, '{
  "titulo": "Tronco y luz",
  "descripcion": "El bosque regenerado de Chiloé, 22 años de paciencia",
  "url": "/assets/editorial/hero-bosque-tronco.jpg",
  "orden": 2
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'galeria' AND item_order = 1
);

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 2, '{
  "titulo": "Hueco del bosque",
  "descripcion": "Geografía salvaje del sur del planeta",
  "url": "/assets/editorial/hero-hueco.jpg",
  "orden": 3
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'galeria' AND item_order = 2
);

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 3, '{
  "titulo": "Experiencias",
  "descripcion": "Recorrido sensorial del apiario a la mesa",
  "url": "/assets/editorial/experiencias.jpg",
  "orden": 4
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'galeria' AND item_order = 3
);

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 4, '{
  "titulo": "Frascos de miel",
  "descripcion": "Crema ulmo-tepú en formatos de mesa y reserva",
  "url": "/assets/editorial/honey-jar.png",
  "orden": 5
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'galeria' AND item_order = 4
);

INSERT INTO site_content (section_key, item_order, content)
SELECT 'galeria', 5, '{
  "titulo": "Sachets",
  "descripcion": "Gotas de Néctar para llevar el bosque contigo",
  "url": "/assets/editorial/sachets.png",
  "orden": 6
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM site_content WHERE section_key = 'galeria' AND item_order = 5
);

-- Reescribir URLs legacy rotas si ya existían en CMS
UPDATE site_content
SET content = jsonb_set(
  content,
  '{url}',
  to_jsonb(
    CASE content->>'url'
      WHEN '/apiario-pureo.jpg' THEN '/assets/editorial/hero-bosque-apertura.jpg'
      WHEN '/cosecha-miel.jpg' THEN '/assets/editorial/experiencias.jpg'
      WHEN '/bosque-regenerado.jpg' THEN '/assets/editorial/hero-bosque-tronco.jpg'
      WHEN '/miel-cremosa.jpg' THEN '/assets/editorial/honey-jar.png'
      WHEN '/abeja-nativa.jpg' THEN '/assets/editorial/immersion.png'
      WHEN '/envasado.jpg' THEN '/assets/editorial/sachets.png'
      ELSE content->>'url'
    END
  )
)
WHERE section_key = 'galeria'
  AND coalesce(content->>'url', '') ~ '^/(apiario-pureo|cosecha-miel|bosque-regenerado|miel-cremosa|abeja-nativa|envasado)\\.(jpg|jpeg|png|webp)$';

-- Compat src/alt del editor viejo
UPDATE site_content
SET content = jsonb_set(
  content,
  '{src}',
  to_jsonb(
    CASE content->>'src'
      WHEN '/apiario-pureo.jpg' THEN '/assets/editorial/hero-bosque-apertura.jpg'
      WHEN '/cosecha-miel.jpg' THEN '/assets/editorial/experiencias.jpg'
      WHEN '/bosque-regenerado.jpg' THEN '/assets/editorial/hero-bosque-tronco.jpg'
      WHEN '/miel-cremosa.jpg' THEN '/assets/editorial/honey-jar.png'
      WHEN '/abeja-nativa.jpg' THEN '/assets/editorial/immersion.png'
      WHEN '/envasado.jpg' THEN '/assets/editorial/sachets.png'
      ELSE content->>'src'
    END
  )
)
WHERE section_key = 'galeria'
  AND coalesce(content->>'src', '') ~ '^/(apiario-pureo|cosecha-miel|bosque-regenerado|miel-cremosa|abeja-nativa|envasado)\\.(jpg|jpeg|png|webp)$';
