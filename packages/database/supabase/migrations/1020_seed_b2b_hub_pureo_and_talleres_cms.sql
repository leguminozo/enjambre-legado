-- Migración 1020: Seeding default content para Portal B2B Matriz (/para) y Experiencias (/experiencias/pureo, /experiencias/talleres)
-- Idempotente: inserta solo si no existe ya la fila en site_content.

-- 1. B2B Hub Settings (/para)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_hub_settings', 0,
'{
  "hero_kicker": "Canal Mayorista & Colaboraciones",
  "hero_kicker_en": "Wholesale & Commercial Partnerships",
  "hero_title": "El Bosque Austral en tu Espacio",
  "hero_title_en": "The Southern Forest in Your Space",
  "hero_subtitle": "Miel cruda de bosque nativo de Chiloé, cosechada con rigor biocultural y trazabilidad verificable. Formatos diseñados para la hospitalidad, la gastronomía y el comercio consciente.",
  "hero_subtitle_en": "Raw honey from native Chiloé forests, harvested with biocultural rigor and verifiable traceability. Formats crafted for hospitality, gastronomy, and conscious retail.",
  "hero_image": "/images/b2b/hero-cafeterias.jpg",
  "cta_label": "Solicitar catálogo mayorista",
  "cta_label_en": "Request wholesale catalog",
  "cta_href": "#solicitud",
  "garantias_kicker": "Garantías del Canal Directo",
  "garantias_kicker_en": "Direct Channel Assurances",
  "garantias_title": "Por qué asociarte con La Obrera y el Zángano",
  "garantias_title_en": "Why Partner with La Obrera y el Zángano"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_hub_settings');

-- 2. Experiencias Pureo Settings (/experiencias/pureo)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'experiencias_pureo_settings', 0,
'{
  "kicker": "Queilén · Archipiélago de Chiloé · Latitud 42° 53′ S",
  "kicker_en": "Queilén · Chiloé Archipelago · Latitude 42° 53′ S",
  "title": "Inmersión en Predio Pureo",
  "title_en": "Immersion at Predio Pureo",
  "subtitle": "La experiencia física de habitar el bosque lluvioso templado donde nace nuestra miel cruda: cabaña nativa con fogón a leña, navegación silenciosa en kayak y ronda de colmenas.",
  "subtitle_en": "The tangible experience of living in the temperate rainforest where our raw honey originates: native timber cabin, silent kayaking, and hive walkthrough.",
  "hero_image": "/assets/editorial/experiencias.jpg",
  "cabana_title": "Cabaña Nativa",
  "cabana_title_en": "Native Timber Cabin",
  "cabana_desc": "Construida en maderas nobles recuperadas de Tepa, Coigüe y Ciprés de las Guaitecas. Cuenta con estufa de combustión lenta, ventanales sobre la copa de los árboles y cocina equipada para preparar productos de recolección local.",
  "cabana_desc_en": "Built with reclaimed noble timbers of Tepa, Coigüe, and Guaitecas Cypress. Equipped with slow-combustion wood heating, treetop views, and a dedicated kitchen for local foraging.",
  "kayak_title": "Kayak en Esteros",
  "kayak_title_en": "Estuary Kayaking",
  "kayak_desc": "Acceso directo a los brazos de agua protegidos del estero de Pureo. Navegación en kayak de travesía entre cisnes de cuello negro, huillines y arrayanales inundados. Una perspectiva única del ecotono bosque-mar.",
  "kayak_desc_en": "Direct access to sheltered estuary waters. Sea kayaking among black-necked swans, southern river otters, and flooded arrayán groves. A unique perspective of the forest-sea ecotone.",
  "apiturismo_title": "Ronda de Colmenas",
  "apiturismo_title_en": "Hive Inspection Walk",
  "apiturismo_desc": "Acompañamiento a Cristina Miranda en la revisión de apiarios. Equipado con traje de protección integral, descubrirás la arquitectura interior del panal, la danza de pecoreo y degustarás miel virgen tibia recién extraída con espátula.",
  "apiturismo_desc_en": "Accompanying Cristina Miranda in apiary inspections. Suited in full protective gear, discover interior comb architecture, waggle dances, and taste warm virgin honey fresh from the frame.",
  "logistica_title": "Cómo llegar a Pureo",
  "logistica_title_en": "How to reach Pureo",
  "logistica_text": "Predio Pureo se ubica en la comuna de Queilén, en la costa oriental de la Isla Grande de Chiloé, a 45 minutos al sur de Chonchi y 75 minutos desde el aeródromo de Mocopulli (Castro).\n\nEl acceso final discurre por camino ripiado rural entre lomajes de tepual y bosque siempreverde. Se recomienda vehículo alto o tracción simple en verano, coordinando la llegada previa con nuestro equipo.",
  "logistica_text_en": "Predio Pureo is located in Queilén, on the eastern coast of Chiloé Island, 45 minutes south of Chonchi and 75 minutes from Mocopulli Airport (Castro).\n\nFinal access is via a rural gravel road through evergreen rainforest. High-clearance vehicle recommended in summer, coordinating arrival beforehand with our team."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'experiencias_pureo_settings');

-- 3. Experiencias Talleres Settings (/experiencias/talleres)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'experiencias_talleres_settings', 0,
'{
  "kicker": "Pedagogía del Bosque Austral · Oficio Vivo",
  "kicker_en": "Southern Forest Pedagogy · Living Craft",
  "title": "Talleres Bioculturales",
  "title_en": "Biocultural Workshops",
  "subtitle": "Encuentros de formación rigurosa en torno al análisis sensorial de mieles crudas, la biología de la colmena y la botánica melífera de los ecosistemas templados lluviosos.",
  "subtitle_en": "Rigorous training sessions exploring raw honey sensory evaluation, colony biology, and melliferous botany of temperate rainforests.",
  "hero_image": "/assets/editorial/experiencias.jpg",
  "programa1_title": "Análisis Sensorial de Mieles Crudas",
  "programa1_title_en": "Raw Honey Sensory Evaluation",
  "programa1_desc": "Calibración de receptores olfativos y gustativos para discernir notas florales, ácidas, minerales y balsámicas en mieles monoflorales de Ulmo, Tiaca, Arrayán y poliflorales de cordillera.",
  "programa1_desc_en": "Calibration of sensory receptors to identify floral, crisp, mineral, and balsamic notes across Ulmo, Tiaca, Arrayán, and mountain polyfloral honeys.",
  "programa2_title": "Iniciación al Oficio Apícola",
  "programa2_title_en": "Introduction to Mindful Beekeeping",
  "programa2_desc": "Fundamentos de la vida en la colmena: castas, comunicación por feromonas, manejo del humo frío, diagnóstico sanitario natural y principios de apicultura regenerativa sin jarabes de azúcar.",
  "programa2_desc_en": "Core hive fundamentals: castes, pheromone communication, cool smoke handling, natural sanitary diagnosis, and regenerative beekeeping without sugar syrups.",
  "programa3_title": "Botánica Melífera & Polen",
  "programa3_title_en": "Melliferous Botany & Pollen",
  "programa3_desc": "Reconocimiento morfológico de especies nativas (Eucryphia cordifolia, Caldcluvia paniculata, Luma apiculata) y su correlación con los granos de polen observados bajo microscopio óptico.",
  "programa3_desc_en": "Morphological identification of native forest species and correlation with pollen grains under optical microscopy."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'experiencias_talleres_settings');
