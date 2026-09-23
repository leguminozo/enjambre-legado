-- Migración 20260923040000: Restauración y ordenamiento canónico de Colecciones en site_content.
-- Restablece descripciones originales del usuario, orden canónico (1..6),
-- imágenes de alta resolución en Storage (bucket cms) y enlaces directos al catálogo
-- sincronizados con los formatos comerciales del sistema (product_formats).

-- 1. Limpiar registros desfasados o duplicados de la sección colecciones
DELETE FROM public.site_content
WHERE section_key = 'colecciones';

-- 2. Insertar las 6 colecciones estacionales en su orden canónico (1 a 6)
-- con textos exactos originales, fotos de Storage y URLs entrelazadas a los formatos del catálogo
INSERT INTO public.site_content (section_key, item_order, is_active, locale, content)
VALUES
(
  'colecciones',
  1,
  true,
  'es',
  '{
    "kicker": "Sachets",
    "title": "Gotas de Néctar",
    "desc": "¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.",
    "href": "/catalogo?formato=15g",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/1f714fa6-7892-4d9b-8e12-39365cdaefcb.png"
  }'::jsonb
),
(
  'colecciones',
  2,
  true,
  'es',
  '{
    "kicker": "Frascos Medios",
    "title": "Tesoros del Colmenar",
    "desc": "¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.",
    "href": "/catalogo?formato=150g",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/e8476505-205c-4150-bafc-a03755216817.png"
  }'::jsonb
),
(
  'colecciones',
  3,
  true,
  'es',
  '{
    "kicker": "Frascos Mayores",
    "title": "Reservas del Bosque",
    "desc": "Nuestra mayor reserva para el futuro. Sobrevive a la incertidumbre y acompaña momentos únicos.",
    "href": "/catalogo?formato=900g,1kg",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/6af34762-5831-4c00-8299-e1ea39294111.png"
  }'::jsonb
),
(
  'colecciones',
  4,
  true,
  'es',
  '{
    "kicker": "Miel Virgen",
    "title": "Panal de Bosque",
    "desc": "El placer de miel libre de intervenciones. La pureza del néctar, una huella del cosmos.",
    "href": "/catalogo?formato=Panal",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/e26742e5-7cc3-4a9a-9d3b-8dc6b78671f5.png"
  }'::jsonb
),
(
  'colecciones',
  5,
  true,
  'es',
  '{
    "kicker": "Cajas de Sachets",
    "title": "Cofres del Enjambre",
    "desc": "20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.",
    "href": "/catalogo?formato=Cofre",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/755ef288-fe31-4539-b1a7-cc028a30f404.png"
  }'::jsonb
),
(
  'colecciones',
  6,
  true,
  'es',
  '{
    "kicker": "Suscripciones",
    "title": "Legado del Bosque",
    "desc": "La búsqueda de legado y regeneración desde el sur del planeta. Creaciones en su máximo esplendor.",
    "href": "/club-legado-del-bosque",
    "image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/colecciones/5fcf161c-44b0-42fa-9900-3646c6a9f5d4.png"
  }'::jsonb
);
