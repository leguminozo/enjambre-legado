-- Migración 20260922123000: Subrutas en menú CMS para Experiencias y Ciencia
-- Asegura que las filas de Experiencias (/experiencias) y Ciencia (/ciencia)
-- en site_content contengan sus hijos estructurados (subrutas directas en dropdown).

-- 1. Subrutas para Experiencias
UPDATE site_content
SET content = content || '{
  "children": [
    {
      "label": "Territorio & Bosque Austral",
      "label_en": "Territory & Rainforest",
      "href": "/experiencias/territorio",
      "description": "Inmersión en el bosque templado lluvioso y colmenas en Chiloé"
    },
    {
      "label": "Degustaciones · Mieles de Chile",
      "label_en": "Tastings · Honeys of Chile",
      "href": "/experiencias/degustaciones",
      "description": "Cata de mieles de Chile, kit de degustación y análisis sensorial"
    },
    {
      "label": "Talleres de Técnica Apícola",
      "label_en": "Apicultural Technique Workshops",
      "href": "/experiencias/talleres",
      "description": "Manejo técnico y supervivencia de la colmena en Chiloé"
    }
  ]
}'::jsonb,
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' = '/experiencias';

-- 2. Subrutas para Ciencia
UPDATE site_content
SET content = content || '{
  "children": [
    {
      "label": "Eje 01 · Triangulación & Pureza",
      "label_en": "Axis 01 · Triangulation & Purity",
      "href": "/ciencia#triangulacion",
      "description": "Criterio analítico y delimitación botánica sin intermediarios"
    },
    {
      "label": "Eje 02 · Bioquímica & Actividad",
      "label_en": "Axis 02 · Biochemistry & Activity",
      "href": "/ciencia#bioquimica",
      "description": "Compuestos bioactivos, fenoles y propiedades del bosque nativo"
    },
    {
      "label": "Eje 03 · Biblioteca de Floraciones",
      "label_en": "Axis 03 · Botanical Library",
      "href": "/ciencia#biblioteca",
      "description": "Monografías y fenología de especies nativas de Chile"
    },
    {
      "label": "Eje 04 · Contabilidad Biofísica",
      "label_en": "Axis 04 · Biophysical Accounting",
      "href": "/ciencia#metodologia",
      "description": "Métricas de néctar, límites biológicos y carga territorial"
    },
    {
      "label": "Eje 05 · Respaldo & Límites",
      "label_en": "Axis 05 · Evidence & Limits",
      "href": "/ciencia#respaldo",
      "description": "Evidencia verificable y qué afirmaciones retiramos"
    },
    {
      "label": "Pasaporte & Trazabilidad QR",
      "label_en": "QR Passport & Traceability",
      "href": "/qr-scan",
      "description": "Consulta el origen y análisis de cada lote envasado"
    }
  ]
}'::jsonb,
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' = '/ciencia';
