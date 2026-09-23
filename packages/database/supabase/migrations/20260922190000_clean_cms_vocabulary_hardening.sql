-- 20260922190000_clean_cms_vocabulary_hardening.sql
-- Saneamiento de micro-filtraciones de vocabulario sagrado en site_content
-- Alineado a AGENTS.md y GEMINI.md:
-- 1. "fecha de cosecha" -> "fecha de recolección"
-- 2. "Custodia y recolecciones de temporada" -> "Vínculo y recolecciones de temporada"
-- 3. "Custodia Territorial Activa" -> "Vínculo Territorial Activo"
-- 4. "relato biocultural" -> "relato territorial"
-- 5. "Cadena de custodia" -> "Cadena de trazabilidad"

DO $$
BEGIN
  -- 1. Reemplazar "fecha de cosecha" por "fecha de recolección"
  UPDATE site_content
  SET content = replace(content::text, 'fecha de cosecha', 'fecha de recolección')::jsonb
  WHERE content::text LIKE '%fecha de cosecha%';

  -- 2. Reemplazar "Custodia" en club y páginas públicas
  UPDATE site_content
  SET content = replace(
    replace(
      replace(
        replace(content::text, 'Custodia y recolecciones de temporada', 'Vínculo y recolecciones de temporada'),
        'Custodia Territorial Activa', 'Vínculo Territorial Activo'
      ),
      'Active Territorial Custody', 'Active Territorial Bond'
    ),
    'Seasonal custody and harvests', 'Seasonal bond and harvests'
  )::jsonb
  WHERE content::text LIKE '%Custodia%';

  -- 3. Reemplazar "biocultural" en experiencias y relatos públicos
  UPDATE site_content
  SET content = replace(
    replace(
      replace(content::text, 'relato biocultural', 'relato territorial'),
      'biocultural narrative', 'territorial narrative'
    ),
    'biocultural storytelling', 'territorial storytelling'
  )::jsonb
  WHERE content::text LIKE '%biocultural%';

  -- 4. Reemplazar "Cadena de custodia" por "Cadena de trazabilidad"
  UPDATE site_content
  SET content = replace(
    replace(content::text, 'Cadena de custodia íntegra', 'Cadena de trazabilidad íntegra'),
    'Cadena de custodia alterada', 'Cadena de trazabilidad alterada'
  )::jsonb
  WHERE content::text LIKE '%Cadena de custodia%';

END $$;
