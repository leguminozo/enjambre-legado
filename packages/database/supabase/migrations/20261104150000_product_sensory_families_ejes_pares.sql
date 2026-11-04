-- =============================================================================
-- Migration: 20261104150000_product_sensory_families_ejes_pares.sql
--
-- Incorpora configuración de ejes del radar sensorial y pares semánticos
-- dinámicos en public.product_sensory_families.
-- Permite calibrar la geometría de la constelación y los descriptores métricos
-- para cualquier familia organoléptica (ej. Miel, Fortificaciones, Hidromiel, etc.)
-- sin depender de lógicas cableadas en frontend.
-- =============================================================================

ALTER TABLE public.product_sensory_families
  ADD COLUMN IF NOT EXISTS ejes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pares_semanticos JSONB DEFAULT '[]'::jsonb;

-- 1. Miel Cruda Pura
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Madurez Enzimática",
    "Complejidad Botánica",
    "Dulzor Natural",
    "Textura & Cristal",
    "Tensión Ácida",
    "Densidad Mineral",
    "Persistencia Floral",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "suave/intenso", "izq": "Suave & Sutil", "der": "Intenso & Floral"},
    {"par": "dulce/acido", "izq": "Dulzor Cálido", "der": "Tensión Ácida"},
    {"par": "liquida/cremosa", "izq": "Líquida / Sedosa", "der": "Cremosa / Cristalizada"}
  ]'::jsonb
WHERE value = 'miel';

-- 2. Crema de Miel Fortificada
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Aporte Nutritivo",
    "Complejidad Botánica",
    "Dulzor Miel",
    "Textura Inclusión",
    "Contraste Tostado",
    "Densidad Activa",
    "Sinergia Funcional",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "suave/intenso", "izq": "Suave", "der": "Intenso"},
    {"par": "dulce/contraste", "izq": "Dulzor Miel", "der": "Contraste Tostado"},
    {"par": "sedosa/crujiente", "izq": "Sedosa Homogénea", "der": "Inclusión Crujiente"}
  ]'::jsonb
WHERE value = 'miel_fortificada';

-- 3. Fortificaciones & Materias Primas Puras (Avellana chilena, polen puro, cacao crudo)
INSERT INTO public.product_sensory_families (value, label, description, sort_order, active, ejes, pares_semanticos)
VALUES (
  'fortificaciones',
  'Fortificaciones & Materias Primas Puras',
  'Avellana chilena tostada y molida, polen floral puro, nibs de cacao criollo y superalimentos nativos sin miel añadida',
  25,
  true,
  '[
    "Tostado & Calidez",
    "Untuosidad & Grasa Noble",
    "Granulometría & Molienda",
    "Densidad Nutritiva",
    "Amargor Noble / Tanino",
    "Crocancia & Textura",
    "Persistencia en Boca",
    "Vector Territorial"
  ]'::jsonb,
  '[
    {"par": "intensidad", "izq": "Sutil & Crudo", "der": "Intenso & Tostado"},
    {"par": "molienda", "izq": "Molienda Fina / Sedosa", "der": "Granulado / Rústico"},
    {"par": "untuosidad", "izq": "Seco / Harinoso", "der": "Untuoso / Oleoso"}
  ]'::jsonb
)
ON CONFLICT (value) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  ejes = CASE WHEN public.product_sensory_families.ejes IS NULL OR jsonb_array_length(public.product_sensory_families.ejes) = 0 THEN EXCLUDED.ejes ELSE public.product_sensory_families.ejes END,
  pares_semanticos = CASE WHEN public.product_sensory_families.pares_semanticos IS NULL OR jsonb_array_length(public.product_sensory_families.pares_semanticos) = 0 THEN EXCLUDED.pares_semanticos ELSE public.product_sensory_families.pares_semanticos END;

-- 4. Hidromiel de Bosque
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Efervescencia",
    "Complejidad Fermentativa",
    "Balance Seco/Dulce",
    "Estructura Tánica",
    "Acidez Viva",
    "Carácter Melífero",
    "Alcohol Integrado",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "seco/dulce", "izq": "Seco & Ágil", "der": "Dulce & Redondo"},
    {"par": "tranquilo/espumoso", "izq": "Tranquilo", "der": "Espumoso Vivaz"},
    {"par": "tanico/ligero", "izq": "Ligero & Floral", "der": "Estructurado & Tánico"}
  ]'::jsonb
WHERE value = 'hidromiel';

-- 5. Extractos & Tinturas
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Concentración Activa",
    "Pungencia Noble",
    "Balsámico Suave",
    "Densidad Resinosa",
    "Potencia Bioactiva",
    "Persistencia en Boca",
    "Pureza de Origen",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "astringente/suave", "izq": "Astringente", "der": "Balsámico Suave"},
    {"par": "pungente/calmo", "izq": "Pungente Intenso", "der": "Resinoso Calmo"},
    {"par": "fluido/denso", "izq": "Líquido Tintura", "der": "Resina Densa"}
  ]'::jsonb
WHERE value = 'extracto';

-- 6. Cosmética Apícola
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Pureza Botánica",
    "Absorción Dérmica",
    "Poder Emoliente",
    "Aroma Noble",
    "Barrera Protectora",
    "Sedosidad",
    "Calma Cutánea",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "ligera/untuosa", "izq": "Rápida Absorción", "der": "Película Nutritiva"},
    {"par": "mate/luminoso", "izq": "Acabado Sedoso", "der": "Brillo Hidratante"},
    {"par": "oclusiva/ligera", "izq": "Fluido Ligero", "der": "Cera Protectora"}
  ]'::jsonb
WHERE value = 'cosmetica';

-- 7. Infusiones & Botánica
UPDATE public.product_sensory_families
SET
  ejes = '[
    "Frescor Volátil",
    "Complejidad Herbal",
    "Claridad de Taza",
    "Cuerpo & Astringencia",
    "Notas Florales",
    "Tensión Cítrica",
    "Calidez / Retrogusto",
    "Vector Territorial"
  ]'::jsonb,
  pares_semanticos = '[
    {"par": "floral/terroso", "izq": "Floral Fresco", "der": "Corteza & Raíz"},
    {"par": "delicada/robusta", "izq": "Infusión Diáfana", "der": "Cuerpo Profundo"},
    {"par": "astringente/sedosa", "izq": "Límpida & Ágil", "der": "Textura Sedosa"}
  ]'::jsonb
WHERE value = 'infusion';
