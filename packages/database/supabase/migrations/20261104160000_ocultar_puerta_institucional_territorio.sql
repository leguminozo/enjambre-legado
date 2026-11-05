-- La puerta institucional (municipios) deja de mostrarse en la landing pública del
-- Registro Territorial. Las páginas institucionales siguen accesibles solo por enlace directo.
-- También retira del texto de origen la mención al operador (vive en Términos de uso).

UPDATE site_content
SET content = jsonb_set(
  content,
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE WHEN s.elem->>'id' = 'territorio_institucional'
        THEN jsonb_set(s.elem, '{enabled}', 'false'::jsonb)
        ELSE s.elem
      END
      ORDER BY s.ord
    )
    FROM jsonb_array_elements(content->'sections') WITH ORDINALITY AS s(elem, ord)
  )
)
WHERE section_key = 'territorio_layout'
  AND jsonb_typeof(content->'sections') = 'array';

UPDATE site_content
SET draft_content = jsonb_set(
  draft_content,
  '{sections}',
  (
    SELECT jsonb_agg(
      CASE WHEN s.elem->>'id' = 'territorio_institucional'
        THEN jsonb_set(s.elem, '{enabled}', 'false'::jsonb)
        ELSE s.elem
      END
      ORDER BY s.ord
    )
    FROM jsonb_array_elements(draft_content->'sections') WITH ORDINALITY AS s(elem, ord)
  )
)
WHERE section_key = 'territorio_layout'
  AND draft_content IS NOT NULL
  AND jsonb_typeof(draft_content->'sections') = 'array';

UPDATE site_content
SET content = jsonb_set(
  content,
  '{description}',
  to_jsonb(replace(content->>'description', ' La opera Trama SpA.', ''))
)
WHERE section_key = 'territorio_origen'
  AND content->>'description' LIKE '% La opera Trama SpA.%';

UPDATE site_content
SET draft_content = jsonb_set(
  draft_content,
  '{description}',
  to_jsonb(replace(draft_content->>'description', ' La opera Trama SpA.', ''))
)
WHERE section_key = 'territorio_origen'
  AND draft_content->>'description' LIKE '% La opera Trama SpA.%';

-- Versión de la Carta Constitutiva: 0.3.2 → 0.4.0 en bloques editables de la landing.
UPDATE site_content
SET content = jsonb_set(content, '{version}', '"v0.4.0"'::jsonb)
WHERE section_key = 'territorio_carta'
  AND content->>'version' = 'v0.3.2';

UPDATE site_content
SET draft_content = jsonb_set(draft_content, '{version}', '"v0.4.0"'::jsonb)
WHERE section_key = 'territorio_carta'
  AND draft_content->>'version' = 'v0.3.2';

UPDATE site_content
SET content = jsonb_set(content, '{carta_link_text}', '"Carta Territorial (v0.4.0)"'::jsonb)
WHERE section_key = 'territorio_hero'
  AND content->>'carta_link_text' = 'Carta Territorial (v0.3.2)';

UPDATE site_content
SET draft_content = jsonb_set(draft_content, '{carta_link_text}', '"Carta Territorial (v0.4.0)"'::jsonb)
WHERE section_key = 'territorio_hero'
  AND draft_content->>'carta_link_text' = 'Carta Territorial (v0.3.2)';

-- =============================================================================
-- Blindaje de datos censales y versionamiento legal de consentimientos (v0.4.0)
-- 1. Eliminar políticas de lectura municipal sobre tablas individuales: los
--    municipios solo reciben reportes agregados por comuna, jamás fichas ni RUT/RUP.
-- 2. Registrar versión y timestamp de aceptación de Carta y Política de Datos
--    (Ley N° 19.628 y Ley N° 21.719).
-- =============================================================================

DROP POLICY IF EXISTS "actores_municipal_read" ON public.actores_registro;
DROP POLICY IF EXISTS "apiarios_municipal_read" ON public.apiarios_registro;
DROP FUNCTION IF EXISTS public.is_municipal_for_comuna(text);

ALTER TABLE public.actores_registro
  ALTER COLUMN consentimientos_version SET DEFAULT '0.4.0';

UPDATE public.actores_registro
SET
  consentimientos_version = COALESCE(consentimientos_version, '0.4.0'),
  consentimientos_at = COALESCE(consentimientos_at, updated_at, created_at, now())
WHERE acepta_carta = true OR acepta_politica_datos = true;

