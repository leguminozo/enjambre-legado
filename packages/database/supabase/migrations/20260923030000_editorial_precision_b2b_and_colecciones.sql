-- Migración 20260923030000: Perfeccionamiento editorial, micro-copia funcional de Colecciones
-- y blindaje técnico comercial en Alianzas B2B (site_content).
-- Garantiza consistencia con AGENTS.md / GEMINI.md:
-- 1. Colecciones en Home: responde qué es, para qué ocasión es y diferenciación inmediata de formato.
-- 2. B2B Hub: unifica trazabilidad por lote numerado y elimina cualquier residuo de jerga no permitida.
-- 3. B2B Segmentos: ajusta métricas hacia rangos comprobables (35-45% proyectado, alta recompra, respuesta en 24-48h).

-- 1. Colecciones (Home landing)
UPDATE site_content
SET content = '{
  "kicker": "Sachets",
  "title": "Gotas de Néctar",
  "desc": "Monodosis individual de 15 g de miel cruda batida en frío. La porción justa de bosque nativo para llevar, viajar o acompañar infusiones de especialidad.",
  "href": "/catalogo?q=Sachet",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 0;

UPDATE site_content
SET content = '{
  "kicker": "Frascos Medios",
  "title": "Tesoros del Colmenar",
  "desc": "Formato de mesa (150 g a 300 g) para el consumo cotidiano. Miel cruda de floración viva, pensada para desayunos y momentos diarios.",
  "href": "/catalogo?q=Frasco",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 1;

UPDATE site_content
SET content = '{
  "kicker": "Frascos Mayores",
  "title": "Reservas del Bosque",
  "desc": "Formato de reserva (500 g a 900 g) para despensa y repostería consciente. Mayor volumen de floración selecta como sustituto noble y continuo del azúcar.",
  "href": "/catalogo?q=Frasco",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 2;

UPDATE site_content
SET content = '{
  "kicker": "Miel Virgen",
  "title": "Panal de Bosque",
  "desc": "Sección de panal virgen intacto, sellado en cera silvestre por las abejas. Néctar crudo sin centrifugación ni filtrado para tablas de queso y maridajes de autor.",
  "href": "/catalogo?q=Miel",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 3;

UPDATE site_content
SET content = '{
  "kicker": "Cajas de Sachets",
  "title": "Cofres del Enjambre",
  "desc": "Estuche de 20 a 25 monodosis individuales. Presentación seleccionada para regalo, barras de café, estaciones de trabajo o degustación compartida.",
  "href": "/catalogo?q=Sachet",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 4;

UPDATE site_content
SET content = '{
  "kicker": "Suscripciones",
  "title": "Legado del Bosque",
  "desc": "Membresía anual con asignación directa de apiario en Chiloé. Acceso prioritario y despachos programados de microlotes de recolección limitada.",
  "href": "/catalogo?q=Suscripcion",
  "image": ""
}'::jsonb
WHERE section_key = 'colecciones' AND item_order = 5;

-- 2. B2B Hub Settings
UPDATE site_content
SET content = jsonb_set(
  jsonb_set(
    content,
    '{hero_subtitle}',
    '"Miel cruda de bosque nativo de Chiloé, recolectada con trazabilidad verificable por lote y estándar de alta pureza. Formatos diseñados para la hospitalidad, la gastronomía y el comercio consciente."'
  ),
  '{hero_subtitle_en}',
  '"Raw honey from native Chiloé forests, harvested with verifiable batch traceability and high-purity standards. Formats crafted for hospitality, fine dining, and conscious retail."'
)
WHERE section_key = 'b2b_hub_settings';

-- 3. B2B Cafeterías
UPDATE site_content
SET content = jsonb_set(
  content,
  '{stats}',
  '[
    {"value": "25 g", "label": "Pieza de mesa", "note": "Servicio individual en barra"},
    {"value": "150 g", "label": "Reserva para llevar", "note": "Venta directa en mostrador"},
    {"value": "500 g", "label": "Uso interno de barra", "note": "Cocina y repostería"},
    {"value": "<18%", "label": "Humedad controlada por lote", "note": "Sin fermentación"}
  ]'::jsonb
)
WHERE section_key = 'b2b_cafeterias';

-- 4. B2B Hoteles
UPDATE site_content
SET content = jsonb_set(
  jsonb_set(
    content,
    '{stats}',
    '[
      {"value": "25 g", "label": "Amenity de origen", "note": "Presentación de cortesía"},
      {"value": "Nativo", "label": "Origen botánico de Chiloé (NCh2981)", "note": "Monofloralidad certificada"},
      {"value": "Planificado", "label": "Suministro anual reservado", "note": "Stock exclusivo por cuenta"},
      {"value": "1 QR", "label": "Cata sensorial guiada", "note": "Experiencia en habitación"}
    ]'::jsonb
  ),
  '{value_props,2,description}',
  '"Resolución sanitaria al día, análisis de laboratorio por lote y suministro planificado con reserva prioritaria para hotelería."'
)
WHERE section_key = 'b2b_hoteles';

-- 5. B2B Tiendas Gourmet
UPDATE site_content
SET content = jsonb_set(
  content,
  '{stats}',
  '[
    {"value": "3 formatos", "label": "Presentaciones 25g, 150g y 500g", "note": "Mix completo de repisa"},
    {"value": "35–45%", "label": "Margen comercial proyectado", "note": "Para canal especializado"},
    {"value": "SAG", "label": "Certificación sanitaria oficial", "note": "Resolución vigente"},
    {"value": "Alta", "label": "Recompra documentada en retail", "note": "Fidelidad del consumidor final"}
  ]'::jsonb
)
WHERE section_key = 'b2b_tiendas_gourmet';

-- 6. B2B Ferias
UPDATE site_content
SET content = jsonb_set(
  content,
  '{stats}',
  '[
    {"value": "25 g", "label": "Degustación y regalo", "note": "Compra de impulso"},
    {"value": "3 formatos", "label": "Mix completo para stand", "note": "Variedad equilibrada"},
    {"value": "Alta", "label": "Conversión comprobada en cata guiada", "note": "Impacto sensorial"},
    {"value": "24–48h", "label": "Respuesta y coordinación para eventos", "note": "Logística flexible"}
  ]'::jsonb
)
WHERE section_key = 'b2b_ferias';

-- 7. B2B Revendedores
UPDATE site_content
SET content = jsonb_set(
  jsonb_set(
    content,
    '{stats}',
    '[
      {"value": "30 días", "label": "Ciclo preferente de reposición", "note": "Rebates activos"},
      {"value": "0 costo", "label": "Sin cobro de incorporación", "note": "Acceso libre"},
      {"value": "Escalable", "label": "Margen comercial según volumen", "note": "Escala progresiva"},
      {"value": "Kit digital", "label": "Activos fotográficos de apoyo", "note": "Material de difusión"}
    ]'::jsonb
  ),
  '{value_props,0,description}',
  '"Vendes un producto con identidad territorial genuina, pureza comprobada y análisis de laboratorio certificados documentados en nuestra sección de ciencia."'
)
WHERE section_key = 'b2b_revendedores';
