-- Migración 20261012120000: Restauración de segmentos B2B contaminados por cambio de pestaña
-- y deduplicación de secciones singleton en site_content.
-- Idempotente: solo actúa si una fila b2b_* tiene content->>'slug' distinto a su segmento canónico
-- o si existen filas duplicadas en secciones singleton.

-- 1. Eliminar filas duplicadas accidentales en secciones singleton (conserva la fila más reciente y con más campos)
WITH ranked_singletons AS (
  SELECT
    id,
    section_key,
    ROW_NUMBER() OVER (
      PARTITION BY section_key
      ORDER BY
        COALESCE(updated_at, created_at) DESC NULLS LAST,
        (SELECT COUNT(*) FROM jsonb_object_keys(COALESCE(content, '{}'::jsonb))) DESC,
        item_order ASC,
        id ASC
    ) AS rn
  FROM site_content
  WHERE section_key IN (
    'b2b_hub_settings',
    'cart_settings',
    'media_settings',
    'reserva_anual',
    'theme_settings',
    'typography_settings',
    'brand_assets',
    'seo_defaults',
    'contact_settings',
    'auth_settings',
    'menu_settings',
    'announcement_settings',
    'landing_layout',
    'seasonal_settings',
    'conservation_content',
    'identidad_settings',
    'club_legado_settings',
    'video_settings',
    'map_settings',
    'products_settings',
    'collections_settings',
    'experiencias_home_settings',
    'alianzas_home_settings',
    'catalog_settings',
    'pdp_settings',
    'checkout_settings',
    'shipping_settings',
    'qr_scan_settings',
    'b2b_cafeterias',
    'b2b_hoteles',
    'b2b_tiendas_gourmet',
    'b2b_ferias',
    'b2b_revendedores',
    'origen_settings',
    'experiencias_settings',
    'experiencias_pureo_settings',
    'floraciones_experience_settings',
    'floraciones_page_settings',
    'experiencias_talleres_settings',
    'galeria_settings',
    'nosotros_settings',
    'ciencia_settings',
    'club_page_settings',
    'footer_settings',
    'footer_social',
    'pwa_nav_settings',
    'legal_terminos',
    'legal_privacidad',
    'legal_cookies',
    'legal_envio',
    'legal_reembolso',
    'legal_cancelacion',
    'legal_garantia',
    'perfil_inicio_settings',
    'perfil_trazabilidad_settings',
    'perfil_pedidos_settings',
    'perfil_suscripciones_settings',
    'perfil_resenas_settings',
    'perfil_retorno_settings',
    'perfil_billetera_settings'
  )
)
DELETE FROM site_content
WHERE id IN (SELECT id FROM ranked_singletons WHERE rn > 1);

-- Normalizar item_order = 0 en las secciones singleton deduplicadas
UPDATE site_content
SET item_order = 0
WHERE section_key IN ('b2b_hub_settings', 'cart_settings', 'media_settings', 'reserva_anual')
  AND item_order <> 0;

-- Deduplicar pares duplicados por item_order en servicios (legacy)
WITH ranked_servicios AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY section_key, item_order
      ORDER BY COALESCE(updated_at, created_at) DESC NULLS LAST, id ASC
    ) AS rn
  FROM site_content
  WHERE section_key = 'servicios'
)
DELETE FROM site_content
WHERE id IN (SELECT id FROM ranked_servicios WHERE rn > 1);

-- 2. Restaurar b2b_cafeterias, b2b_hoteles y b2b_tiendas_gourmet si presentan slug cruzado
DO $$
DECLARE
  v_cafeterias_payload jsonb;
  v_hoteles_payload jsonb;
  v_gourmet_payload jsonb;
BEGIN
  -- Capturar payloads desplazados en site_content o desde cms_content_versions antes de actualizar
  SELECT content INTO v_cafeterias_payload
  FROM (
    SELECT content, 1 AS prio, updated_at AS ts
    FROM site_content
    WHERE section_key IN ('b2b_cafeterias', 'b2b_hoteles', 'b2b_tiendas_gourmet', 'b2b_ferias', 'b2b_revendedores')
      AND content->>'slug' = 'cafeterias'
    UNION ALL
    SELECT content, 0 AS prio, created_at AS ts
    FROM cms_content_versions
    WHERE section_key = 'b2b_cafeterias'
      AND content->>'slug' = 'cafeterias'
  ) t
  ORDER BY prio ASC, ts DESC
  LIMIT 1;

  SELECT content INTO v_hoteles_payload
  FROM (
    SELECT content, 1 AS prio, updated_at AS ts
    FROM site_content
    WHERE section_key IN ('b2b_cafeterias', 'b2b_hoteles', 'b2b_tiendas_gourmet', 'b2b_ferias', 'b2b_revendedores')
      AND content->>'slug' = 'hoteles'
    UNION ALL
    SELECT content, 0 AS prio, created_at AS ts
    FROM cms_content_versions
    WHERE section_key = 'b2b_hoteles'
      AND content->>'slug' = 'hoteles'
  ) t
  ORDER BY prio ASC, ts DESC
  LIMIT 1;

  SELECT content INTO v_gourmet_payload
  FROM (
    SELECT content, 1 AS prio, updated_at AS ts
    FROM site_content
    WHERE section_key IN ('b2b_cafeterias', 'b2b_hoteles', 'b2b_tiendas_gourmet', 'b2b_ferias', 'b2b_revendedores')
      AND content->>'slug' = 'tiendas-gourmet'
    UNION ALL
    SELECT content, 0 AS prio, created_at AS ts
    FROM cms_content_versions
    WHERE section_key = 'b2b_tiendas_gourmet'
      AND content->>'slug' = 'tiendas-gourmet'
  ) t
  ORDER BY prio ASC, ts DESC
  LIMIT 1;

  -- Restaurar b2b_cafeterias si está contaminado
  IF v_cafeterias_payload IS NOT NULL THEN
    UPDATE site_content
    SET content = jsonb_set(
          jsonb_set(v_cafeterias_payload, '{slug}', '"cafeterias"'),
          '{hero_image}',
          '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp"'
        ),
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_cafeterias'
      AND COALESCE(content->>'slug', '') <> 'cafeterias';
  END IF;

  -- Restaurar b2b_tiendas_gourmet si está contaminado
  IF v_gourmet_payload IS NOT NULL THEN
    UPDATE site_content
    SET content = jsonb_set(
          jsonb_set(v_gourmet_payload, '{slug}', '"tiendas-gourmet"'),
          '{hero_image}',
          '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp"'
        ),
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_tiendas_gourmet'
      AND COALESCE(content->>'slug', '') <> 'tiendas-gourmet';
  END IF;

  -- Restaurar b2b_hoteles si está contaminado (usa snapshot histórico o plantilla canónica con hero de Storage)
  UPDATE site_content
  SET content = COALESCE(
        CASE
          WHEN v_hoteles_payload IS NOT NULL THEN
            jsonb_set(
              jsonb_set(v_hoteles_payload, '{slug}', '"hoteles"'),
              '{hero_image}',
              '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp"'
            )
          ELSE NULL
        END,
        '{
          "slug": "hoteles",
          "tipo": "hoteles",
          "kicker": "Hotelería Boutique & Lodges",
          "kicker_en": "Boutique Hospitality & Lodges",
          "headline": "Experiencia de origen austral para tus huéspedes",
          "headline_en": "Austral origin experience for your guests",
          "subheadline": "Desayunos memorables, amenidades exclusivas y el relato vivo del bosque nativo de Chiloé.",
          "subheadline_en": "Memorable breakfasts, exclusive amenities, and the living story of the Chiloé native forest.",
          "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
          "suggested_products_copy": "Frascos individuales para desayuno buffet, sets de regalo de bienvenida y miel a granel para cocina de autor.",
          "suggested_products_copy_en": "Individual breakfast buffet jars, welcome gift sets, and bulk honey for signature cuisine.",
          "cta_text": "Diseñar propuesta para hotel",
          "cta_text_en": "Design proposal for hotel",
          "cta_href": "/contacto?asunto=hoteles",
          "strategy_title": "Hospitalidad Austral & Amenities de Origen",
          "strategy_summary": "Transformación del desayuno buffet en una experiencia memorable y servicio de cortesía en habitaciones: frascos de bienvenida y formatos gastronómicos sin envases plásticos.",
          "strategy_ticket_boost": "Hospitalidad de origen y estuches de cortesía en checkout",
          "strategy_key_tool": "Formatos Gastronómicos de Servicio & Tarjetas de Bienvenida",
          "strategy_steps": [
            "Paso 1: Servicio de miel virgen en el desayuno buffet con formatos gastronómicos y frascos de mesa.",
            "Paso 2: Disponer en habitaciones el frasco de 25g de bienvenida con tarjeta QR de origen botánico.",
            "Paso 3: Ofrecer en recepción y lobby el estuche de regalo como recuerdo territorial del viaje.",
            "Paso 4: Envío directo a domicilio para turistas que viajan sin equipaje de bodega."
          ],
          "value_props": [
            {
              "icon": "Award",
              "title": "Narrativa de origen que eleva la estadía",
              "title_en": "Origin storytelling that elevates the stay",
              "description": "Tus huéspedes no solo consumen miel: conocen el bosque nativo de Chiloé, las floraciones y el cuidado de las abejas.",
              "description_en": "Your guests do not just consume honey: they experience Chiloé native forest, blooms, and bee care."
            },
            {
              "icon": "Package",
              "title": "Formatos versátiles para hotelería",
              "title_en": "Versatile formats for hospitality",
              "description": "Desde frascos de 40 g para amenidad o buffet hasta baldes de 5 kg para repostería y cocina de autor.",
              "description_en": "From 40 g jars for amenities or buffet to 5 kg buckets for pastry and signature cuisine."
            },
            {
              "icon": "ShieldCheck",
              "title": "Calidad certificada y constante",
              "title_en": "Certified & consistent quality",
              "description": "Resolución sanitaria al día, análisis de laboratorio por lote y suministro planificado con reserva prioritaria para hotelería.",
              "description_en": "Up-to-date sanitary resolution, lab analysis per batch, and guaranteed year-round supply."
            }
          ],
          "stats": [
            { "value": "25 g", "label": "Amenity de origen", "note": "Presentación de cortesía" },
            { "value": "Nativo", "label": "Origen botánico de Chiloé (NCh2981)", "note": "Monofloralidad certificada" },
            { "value": "Planificado", "label": "Suministro anual reservado", "note": "Stock exclusivo por cuenta" },
            { "value": "1 QR", "label": "Cata sensorial guiada", "note": "Experiencia en habitación" }
          ],
          "process": [
            { "step": "01", "title": "25 g — Amenity de Habitación", "desc": "Mini frasco de cortesía en la habitación con tarjeta de origen para la bienvenida del huésped." },
            { "step": "02", "title": "150 g — Boutique del Lobby", "desc": "Ediciones numeradas con empaque para regalo en recepción y boutique del hotel." },
            { "step": "03", "title": "500 g — Salón de Desayuno & Buffet", "desc": "Miel cruda de bosque nativo para servicio continuo en buffet gastronómico." }
          ],
          "faq": [
            {
              "question": "¿Tienen formato individual para desayuno buffet?",
              "answer": "Sí, disponemos de frascos de 40 g y 120 g ideales para buffet y servicio a la habitación, así como dispensadores de mesa elegantes."
            },
            {
              "question": "¿Se pueden personalizar las etiquetas para regalos de bienvenida?",
              "answer": "Podemos incluir fajas co-brandeadas o tarjetas con el relato del origen adaptadas a la identidad de tu hotel (volumen mínimo aplica)."
            },
            {
              "question": "¿Cómo manejan las temporadas de alta y baja ocupación?",
              "answer": "Ajustamos los pedidos y frecuencias según la estacionalidad de tu establecimiento, sin penalizaciones por reducción de volumen en temporada baja."
            }
          ],
          "seo_title": "Miel para Hoteles y Lodges · La Obrera y el Zángano",
          "seo_description": "Miel nativa de Chiloé para hotelería boutique, lodges y gastronomía hotelera. Formatos buffet, amenidades y cocina."
        }'::jsonb
      ),
      draft_content = NULL,
      updated_at = NOW()
  WHERE section_key = 'b2b_hoteles'
    AND COALESCE(content->>'slug', '') <> 'hoteles';
END $$;

-- 3. Actualizar imágenes canónicas de Storage y limpiar erratas/vocabulario en site_content

-- 3.1 b2b_hub_settings: actualizar imágenes canónicas y errata fidelizacio
UPDATE site_content
SET content = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                CASE 
                  WHEN content->>'seg_cafeterias_h3' LIKE '%fidelizacio%' AND content->>'seg_cafeterias_h3 NOT LIKE '%fidelización%'
                  THEN jsonb_set(content, '{seg_cafeterias_h3}', to_jsonb(replace(content->>'seg_cafeterias_h3', 'fidelizacio', 'fidelización')))
                  ELSE content
                END,
                '{hero_image}',
                '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp"'
              ),
              '{seg_cafeterias_image}',
              '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp"'
            ),
            '{seg_hoteles_image}',
            '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp"'
          ),
          '{seg_tiendas_gourmet_image}',
          '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp"'
        ),
        '{seg_ferias_image}',
        '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/814aaec5-330b-4ff2-8872-0c540b0e7825.webp"'
      ),
      '{seg_revendedores_image}',
      '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/bd874e95-611d-4d04-ad3a-d28a7fd7d6f5.webp"'
    ),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_hub_settings'
  AND (
    content->>'hero_image' LIKE '/images/b2b/%'
    OR content->>'seg_cafeterias_image' LIKE '/images/b2b/%'
    OR content->>'seg_hoteles_image' LIKE '/images/b2b/%'
    OR content->>'seg_tiendas_gourmet_image' LIKE '/images/b2b/%'
    OR content->>'seg_ferias_image' LIKE '/images/b2b/%'
    OR content->>'seg_ferias_image' LIKE '%1441c92d-0e75-44fe-aef7-476ccb2aaf74%'
    OR content->>'seg_revendedores_image' LIKE '/images/b2b/%'
    OR content->>'seg_revendedores_image' LIKE '%020189d4-756b-4ea3-995e-b3413ffef179%'
    OR content->>'seg_cafeterias_h3' LIKE '%fidelizacio%'
  );

-- 3.2 Asegurar héroes canónicos en cada segmento b2b
UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_cafeterias'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' LIKE '/images/b2b/%');

UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_hoteles'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' LIKE '/images/b2b/%' OR content->>'hero_image' LIKE '%/cms/b2b_cafeterias/%');

UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_tiendas_gourmet'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' LIKE '/images/b2b/%' OR content->>'hero_image' LIKE '%/cms/b2b_cafeterias/%');

UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/814aaec5-330b-4ff2-8872-0c540b0e7825.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_ferias'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' LIKE '/images/b2b/%' OR content->>'hero_image' LIKE '%1441c92d-0e75-44fe-aef7-476ccb2aaf74%');

UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/bd874e95-611d-4d04-ad3a-d28a7fd7d6f5.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'b2b_revendedores'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' LIKE '/images/b2b/%' OR content->>'hero_image' LIKE '%020189d4-756b-4ea3-995e-b3413ffef179%');

-- 3.3 Experiencias: Pureo, Talleres y Floraciones
UPDATE site_content
SET content = jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/bdf279ee-9dc4-4f52-9c29-2c3e522cd8db.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'experiencias_pureo_settings'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' = '/assets/editorial/experiencias.jpg');

UPDATE site_content
SET content = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/experiencias_settings/9f75a68a-2464-4096-a11a-40ddd4a22b9f.webp"'),
            '{kicker}',
            CASE WHEN content->>'kicker' = 'Oficio Vivo' THEN '"Maestría del Bosque"' ELSE to_jsonb(content->>'kicker') END
          ),
          '{kicker_en}',
          CASE WHEN content->>'kicker_en' = 'Biocultural Workshops' THEN '"Austral Forest Workshops"' ELSE to_jsonb(content->>'kicker_en') END
        ),
        '{title}',
        CASE WHEN content->>'title' = 'Iniciación al Oficio Apícola' THEN '"Iniciación a la Maestría Apícola"' ELSE to_jsonb(content->>'title') END
      ),
      '{title_en}',
      CASE WHEN content->>'title_en' = 'Introduction to the Beekeeper Craft' THEN '"Introduction to Beekeeping Mastery"' ELSE to_jsonb(content->>'title_en') END
    ),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'experiencias_talleres_settings'
  AND (
    content->>'hero_image' IS NULL
    OR content->>'hero_image' = '/assets/editorial/experiencias.jpg'
    OR content->>'kicker' = 'Oficio Vivo'
    OR content->>'kicker_en' = 'Biocultural Workshops'
    OR content->>'title' = 'Iniciación al Oficio Apícola'
  );

UPDATE site_content
SET content = jsonb_set(
      jsonb_set(content, '{hero_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/floraciones_experience_settings/ae01c33e-779f-43aa-9d4e-8a0e9202ef3d.webp"'),
      '{desc}',
      CASE 
        WHEN content->>'desc' LIKE '%oficio apícola%' 
        THEN to_jsonb(replace(content->>'desc', 'oficio apícola', 'técnica apícola'))
        ELSE to_jsonb(content->>'desc')
      END
    ),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'floraciones_experience_settings'
  AND (content->>'hero_image' IS NULL OR content->>'hero_image' = '/assets/editorial/experiencias.jpg' OR content->>'desc' LIKE '%oficio apícola%');

-- 3.4 Club Legado: tarjeta y nosotros_settings: errata .d sss
UPDATE site_content
SET content = jsonb_set(content, '{card_image}', '"https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/club_page_settings/c1e9a4e9-2af8-4fbe-8111-dc07d0e539af.webp"'),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'club_legado_settings'
  AND (content->>'card_image' IS NULL OR content->>'card_image' LIKE '/assets/editorial/%');

UPDATE site_content
SET content = jsonb_set(content, '{subtitle}', to_jsonb(trim(trailing '.d sss' FROM (content->>'subtitle')))),
    draft_content = NULL,
    updated_at = NOW()
WHERE section_key = 'nosotros_settings'
  AND content->>'subtitle' LIKE '%.d sss';

