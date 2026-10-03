-- Actualización de contenido editorial para talleres, nosotros y experiencias
-- Corrige fechas caducadas (Junio 2026), declaraciones sanitarias ("Medicina del Panal")
-- y alinea la terminología con los estándares del proyecto (abeja melífera, técnica apícola, recolección en frío).

-- 1. Actualizar sección 'talleres' (items 1, 2 y 3)
UPDATE public.site_content
SET content = jsonb_build_object(
  'date', 'Temporada 2026–2027',
  'title', 'La Arquitectura de la Colmena',
  'desc', 'Inmersión en el bosque templado lluvioso de Chiloé. Aprendizaje práctico sobre la biología de la abeja melífera, dinámica de enjambre y recolección en frío.',
  'action', 'Solicitar cupo'
)
WHERE section_key = 'talleres' AND item_order = 1;

UPDATE public.site_content
SET content = jsonb_build_object(
  'date', 'Bimensual',
  'title', 'Cata Sensorial & Mieles de Contraste',
  'desc', 'Sesiones guiadas para calibrar receptores olfativos y discernir notas botánicas, acidez natural y persistencia en mieles de bosque nativo.',
  'action', 'Inscribirse'
)
WHERE section_key = 'talleres' AND item_order = 2;

UPDATE public.site_content
SET content = jsonb_build_object(
  'date', 'A demanda',
  'title', 'Productos de la Colmena: Ungüentos y Tinturas',
  'desc', 'Elaboración de preparados botánicos a partir de cera pura, propóleos y extractos del bosque. Prácticas de taller y conservación natural sin fines terapéuticos ni clínicos.',
  'action', 'Consultar'
)
WHERE section_key = 'talleres' AND item_order = 3;

-- 2. Actualizar 'experiencias_talleres_settings' para eliminar jerga prohibida
UPDATE public.site_content
SET content = content || jsonb_build_object(
  'title', 'Talleres de Técnica Apícola',
  'programa2_title', 'Iniciación a la Técnica Apícola'
)
WHERE section_key = 'experiencias_talleres_settings';

-- 3. Actualizar 'nosotros' para sincerar la cronología histórica y métricas
UPDATE public.site_content
SET content = content || jsonb_build_object(
  'title', 'Trayectoria & Presencia Territorial',
  'desc', 'Presencia y trayectoria en el bosque nativo de Chiloé y estándar de recolección apícola.',
  'stat1_label', 'Años de presencia',
  'stat1_value', '22',
  'stat2_label', 'Especies botánicas',
  'stat2_value', '18+',
  'stat3_label', 'Batido en frío',
  'stat3_value', '48h',
  'stat4_label', 'Origen Bosque Nativo',
  'stat4_value', '100%'
)
WHERE section_key = 'nosotros' AND item_order = 0;
