-- Migración 20260921180000: menú CMS con Club Legado y Alianzas (/alianzas)
-- La ruta comercial cambió de /para a /alianzas (redirect 301 en next.config.ts).
-- Idempotente y no destructiva:
--  1. Reescribe hrefs stale /para* → /alianzas* preservando el resto del contenido.
--  2. Asegura las filas Club Legado y Alianzas con sus subenlaces canónicos,
--     sin tocar labels, flags show_* ni orden de filas ya personalizadas.
-- Sin esto, las DBs sembradas por 86/87 (menú viejo sin estos ítems) nunca los
-- muestran en el CMS, porque el loader usa las filas DB cuando existen e ignora
-- los defaults en memoria.

-- 1. /para exacto → /alianzas
UPDATE site_content
SET content = jsonb_set(content, '{href}', '"\/alianzas"'::jsonb),
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' = '/para';

-- 2. /para/* → /alianzas/* (hijos u otras filas que apunten a la ruta vieja)
UPDATE site_content
SET content = jsonb_set(
      content,
      '{href}',
      to_jsonb('/alianzas' || substr(content->>'href', 6))
    ),
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' LIKE '/para/%';

-- 3a. Club Legado: añadir subenlaces canónicos solo si la fila existe sin children
UPDATE site_content
SET content = content || '{
  "children": [
    {
      "label": "Membresía & Reposición",
      "label_en": "Membership & Refill",
      "href": "/club-legado-del-bosque",
      "description": "Asignación prioritaria de recolecciones nativas sin intermediarios"
    },
    {
      "label": "Niveles de Guardián & Puntos",
      "label_en": "Guardian Tiers & Points",
      "href": "/club-legado-del-bosque#niveles",
      "description": "Beneficios por ciclos de permanencia y retorno de frascos"
    },
    {
      "label": "Pase Digital Wallet",
      "label_en": "Digital Wallet Pass",
      "href": "/perfil/billetera",
      "description": "Tu credencial oficial en Apple Wallet y Google Wallet"
    },
    {
      "label": "Reserva Anual de Recolección",
      "label_en": "Annual Harvest Allocation",
      "href": "/perfil/reservas",
      "description": "Asignación anticipada de partidas de recolección anual"
    }
  ]
}'::jsonb,
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' = '/club-legado-del-bosque'
  AND NOT (content ? 'children');

-- 3b. Club Legado: insertar si no existe
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT
  'menu_links',
  (SELECT COALESCE(MAX(item_order), 0) + 1 FROM site_content WHERE section_key = 'menu_links'),
  '{
    "label": "Club Legado",
    "label_en": "Legacy Club",
    "href": "/club-legado-del-bosque",
    "show_desktop": true,
    "show_mobile": true,
    "children": [
      {
        "label": "Membresía & Reposición",
        "label_en": "Membership & Refill",
        "href": "/club-legado-del-bosque",
        "description": "Asignación prioritaria de recolecciones nativas sin intermediarios"
      },
      {
        "label": "Niveles de Guardián & Puntos",
        "label_en": "Guardian Tiers & Points",
        "href": "/club-legado-del-bosque#niveles",
        "description": "Beneficios por ciclos de permanencia y retorno de frascos"
      },
      {
        "label": "Pase Digital Wallet",
        "label_en": "Digital Wallet Pass",
        "href": "/perfil/billetera",
        "description": "Tu credencial oficial en Apple Wallet y Google Wallet"
      },
      {
        "label": "Reserva Anual de Recolección",
        "label_en": "Annual Harvest Allocation",
        "href": "/perfil/reservas",
        "description": "Asignación anticipada de partidas de recolección anual"
      }
    ]
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM site_content
  WHERE section_key = 'menu_links' AND content->>'href' = '/club-legado-del-bosque'
);

-- 4a. Alianzas: añadir subenlaces canónicos solo si la fila existe sin children
UPDATE site_content
SET content = content || '{
  "children": [
    {
      "label": "Cafeterías de Especialidad",
      "label_en": "Specialty Coffee",
      "href": "/alianzas/cafeterias",
      "description": "Sachets individuales y miel para barismo"
    },
    {
      "label": "Hoteles & Amenities",
      "label_en": "Hotels & Amenities",
      "href": "/alianzas/hoteles",
      "description": "Frascos de cortesía 40g y cuidado personal"
    },
    {
      "label": "Tiendas Gourmet",
      "label_en": "Gourmet Stores",
      "href": "/alianzas/tiendas-gourmet",
      "description": "Ediciones numeradas de autor con pasaporte digital"
    },
    {
      "label": "Encuentros & Presentaciones",
      "label_en": "Tastings & Presentations",
      "href": "/alianzas/ferias",
      "description": "Presentaciones privadas y degustaciones exclusivas"
    },
    {
      "label": "Programa Revendedores",
      "label_en": "Resellers Program",
      "href": "/alianzas/revendedores",
      "description": "Margen protegido y terminales POS móviles"
    }
  ]
}'::jsonb,
    updated_at = NOW()
WHERE section_key = 'menu_links'
  AND content->>'href' = '/alianzas'
  AND NOT (content ? 'children');

-- 4b. Alianzas: insertar si no existe
INSERT INTO site_content (section_key, item_order, content, is_active)
SELECT
  'menu_links',
  (SELECT COALESCE(MAX(item_order), 0) + 1 FROM site_content WHERE section_key = 'menu_links'),
  '{
    "label": "Alianzas",
    "label_en": "Partnerships",
    "href": "/alianzas",
    "show_desktop": true,
    "show_mobile": true,
    "children": [
      {
        "label": "Cafeterías de Especialidad",
        "label_en": "Specialty Coffee",
        "href": "/alianzas/cafeterias",
        "description": "Sachets individuales y miel para barismo"
      },
      {
        "label": "Hoteles & Amenities",
        "label_en": "Hotels & Amenities",
        "href": "/alianzas/hoteles",
        "description": "Frascos de cortesía 40g y cuidado personal"
      },
      {
        "label": "Tiendas Gourmet",
        "label_en": "Gourmet Stores",
        "href": "/alianzas/tiendas-gourmet",
        "description": "Ediciones numeradas de autor con pasaporte digital"
      },
      {
        "label": "Encuentros & Presentaciones",
        "label_en": "Tastings & Presentations",
        "href": "/alianzas/ferias",
        "description": "Presentaciones privadas y degustaciones exclusivas"
      },
      {
        "label": "Programa Revendedores",
        "label_en": "Resellers Program",
        "href": "/alianzas/revendedores",
        "description": "Margen protegido y terminales POS móviles"
      }
    ]
  }'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM site_content
  WHERE section_key = 'menu_links' AND content->>'href' = '/alianzas'
);
