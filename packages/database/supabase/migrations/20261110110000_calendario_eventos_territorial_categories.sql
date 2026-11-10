-- Ampliar categorías permitidas en calendario_eventos para soportar eventos territoriales y macro del ecosistema
ALTER TABLE public.calendario_eventos
  DROP CONSTRAINT IF EXISTS calendario_eventos_category_check;

ALTER TABLE public.calendario_eventos
  ADD CONSTRAINT calendario_eventos_category_check
  CHECK (category IN (
    'personal',
    'reunion',
    'feria',
    'apicultura',
    'marketing',
    'logistica',
    'inspeccion',
    'tratamiento',
    'cosecha',
    'transhumancia',
    'reforestacion',
    'otro'
  ));

COMMENT ON CONSTRAINT calendario_eventos_category_check ON public.calendario_eventos IS
  'Categorías permitidas para eventos: macro corporativo (ferias, marketing, logística) y territorial/campo (apicultura, inspección, tratamiento, recolección, trashumancia, reforestación, reunión, personal, otro).';
