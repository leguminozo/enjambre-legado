-- =============================================================================
-- Migration 20260925000000: Seed completo bilingüe para ciencia_settings y ciencia
--
-- 1. Actualiza ciencia_settings en site_content con los 5 ejes bilingües (ES / EN)
--    eliminando las alertas 'Pendiente traducción EN' en el Editor Tienda.
-- 2. Inserta 3 fichas de evidencia académica canónicas en section_key = 'ciencia'
--    resolviendo el estado 'Sin elementos en esta sección' en el Editor Tienda.
-- =============================================================================

-- ── 1. ciencia_settings bilingüe ─────────────────────────────────────────────

DELETE FROM public.site_content WHERE section_key = 'ciencia_settings' AND item_order = 0;

INSERT INTO public.site_content (section_key, item_order, content)
VALUES (
  'ciencia_settings',
  0,
  '{
    "kicker": "Ciencia",
    "kicker_en": "Science",
    "title": "La ciencia del bosque",
    "title_en": "Forest Science",
    "subtitle": "Cada frasco condensa un proceso biofísico observable. Estas son las ecuaciones que lo demuestran.",
    "subtitle_en": "Each jar condenses an observable biophysical process. These are the equations that prove it.",
    "hero_image": "",
    "hero_image_opacity": 25,
    "text_align": "left",

    "triangulacion_kicker": "Eje 01 · Triangulación Botánica",
    "triangulacion_kicker_en": "Axis 01 · Botanical Triangulation",
    "triangulacion_title": "Refugio Austral: Bosque Nativo sin Pesticidas",
    "triangulacion_title_en": "Austral Sanctuary: Native Forest Free of Pesticides",
    "triangulacion_desc": "El archipiélago de Chiloé y la vertiente occidental de la Cordillera de la Costa constituyen un santuario biogeográfico aislado. La ausencia de monocultivos agroindustriales extensivos, combinada con una densa pluviometría templada lluviosa, protege los apiarios de la deriva de agroquímicos sintéticos.",
    "triangulacion_desc_en": "The Chiloé archipelago and the western slopes of the Coastal Range form an isolated biogeographical sanctuary. The absence of extensive agro-industrial monocultures, combined with dense temperate rainforest precipitation, shields our apiaries from synthetic agrochemical drift.",

    "bioquimica_kicker": "Eje 02 · Bioquímica de Origen",
    "bioquimica_kicker_en": "Axis 02 · Origin Biochemistry",
    "bioquimica_title": "Composición de la Miel Cruda Viva",
    "bioquimica_title_en": "Composition of Living Raw Honey",
    "bioquimica_desc": "La miel no es un producto fabricado: es energía solar transformada en biomolécula por una cadena causal directa. La abeja concentra el néctar con enzimas y lo estabiliza por deshidratación. Frente al azúcar refinada —molienda, clarificación, centrifugación, decoloración—, la miel cruda es un alimento sin etapas industriales.",
    "bioquimica_desc_en": "Honey is not a manufactured product: it is solar energy transformed into a biomolecule through a direct causal chain. Bees concentrate nectar with active enzymes and stabilize it via dehydration. In contrast to refined industrial sugar, raw honey undergoes zero industrial processing.",
    "protocolo_title": "Protocolo de Laboratorio y Análisis por Lote",
    "protocolo_title_en": "Laboratory Protocol & Batch Analysis",
    "protocolo_desc": "Cada partida envasada cuenta con respaldo analítico documentado antes de su distribución. Los estándares físico-químicos y botánicos respaldan la pureza entregada a hogares, cafeterías, hoteles y tiendas de autor:",
    "protocolo_desc_en": "Every packaged batch has documented analytical backing prior to distribution. Physico-chemical and botanical standards uphold the raw purity delivered to homes, culinary studios, and boutique establishments:",

    "biblioteca_kicker": "Eje 03 · Botánica Melífera",
    "biblioteca_kicker_en": "Axis 03 · Melliferous Botany",
    "biblioteca_title": "Biblioteca de Floraciones del Bosque Nativo",
    "biblioteca_title_en": "Native Forest Bloom Library",
    "biblioteca_desc": "El bosque nativo de Chile no florece todo a la vez: sigue una cadencia estacional estricta. Cada miel es la huella digital de una floración en el tiempo. La regeneración territorial protege esta sucesión para que las abejas jamás sufran vacíos nutricionales ni dependan de jarabes artificiales.",
    "biblioteca_desc_en": "Chilean native forests do not bloom simultaneously: they follow a strict seasonal cadence. Each honey represents the fingerprint of a single bloom in time. Territorial stewardship protects this floral succession so bees never suffer nutritional voids or depend on artificial syrups.",
    "estacion_kicker": "Presencia en eventos externos · Módulos territoriales",
    "estacion_kicker_en": "Presence at External Events · Territorial Modules",
    "estacion_title": "Estación de Origen: Curaduría de Contraste Máximo",
    "estacion_title_en": "Origin Station: Maximum Sensory Contrast Curatorship",
    "estacion_desc": "Las 5 a 8 floraciones nativas de la temporada operan como contrapunto sensorial en wine clubs, cenas de autor y retiros. Una experiencia de flujo continuo (8 a 12 minutos por persona) conducida por el equipo con dominio territorial de La Obrera y el Zángano.",
    "estacion_desc_en": "The 5 to 8 seasonal native blooms operate as a territorial sensory counterpoint in wine clubs, signature dinners, and private retreats. An open flow experience (8 to 12 minutes per person) conducted by the territorial team of La Obrera y el Zángano.",
    "estacion_cta_label": "Estación de Origen",
    "estacion_cta_label_en": "Origin Station",
    "estacion_cta_href": "/experiencias/degustaciones#estacion-origen",

    "metodologia_kicker": "Eje 04 · Contabilidad Biofísica",
    "metodologia_kicker_en": "Axis 04 · Biophysical Accounting",
    "metodologia_title": "Cálculo Referencial de CO₂ y Regeneración",
    "metodologia_title_en": "Referential CO₂ & Regeneration Calculation",
    "metodologia_desc": "El impacto ecológico no debe ser una promesa abstracta ni un certificado comercial opaco. Modelamos la relación entre cada gramaje de miel recolectada, el CO₂ evitado respecto al azúcar industrial y la protección activa de árboles nativos en el archipiélago de Chiloé.",
    "metodologia_desc_en": "Ecological impact must never be an abstract promise or an opaque marketing stamp. We model the direct correlation between each gram of harvested raw honey, avoided CO₂ emissions relative to industrial sugar, and the active protection of native trees in the Chiloé archipelago.",
    "pecoreo_kicker": "Modelación Biofísica de Pecoreo & Polinización Nativa",
    "pecoreo_kicker_en": "Biophysical Foraging & Native Pollination Modeling",
    "pecoreo_title": "Transformación Néctar-Miel y Capacidad de Carga del Bosque",
    "pecoreo_title_en": "Nectar-to-Honey Conversion & Forest Carrying Capacity",
    "pecoreo_desc": "En nuestra modelación analítica de biofísica territorial y capacidad de carga, hemos calculado la estequiometría de pecoreo de Apis mellifera en el dosel nativo de Chiloé:",
    "pecoreo_desc_en": "In our analytical modeling of territorial biophysics and carrying capacity, we calculate the foraging stoichiometry of Apis mellifera across the native Chiloé canopy:",
    "horizonte_title": "Horizonte Metodológico 2026–2027 · Medición y Calibración en Terreno",
    "horizonte_title_en": "Methodological Horizon 2026–2027 · Field Measurement & Calibration",
    "horizonte_text": "Principio de honestidad radical: Aunque esta modelación matemática biofísica está estructurada en nuestros sistemas de cálculo territorial, no se encuentra activa como sello comercial cerrado ni promesa certificada en frascos individuales. Durante las temporadas 2026 y 2027 estamos llevando a cabo la medición empírica exhaustiva, el conteo de floraciones y la trazabilidad georreferenciada de árboles y apiarios en el Predio Pureo y predios asociados de Chiloé. Solo publicaremos estas equivalencias unitarias al consumidor una vez concluida la validación empírica en terreno.",
    "horizonte_text_en": "Radical transparency principle: Although this biophysical mathematical model is structured within our territorial accounting systems, it is not used as a closed commercial stamp on individual retail jars. Throughout the 2026 and 2027 seasons, we conduct exhaustive empirical field measurements, bloom censuses, and georeferenced tracking across the Pureo Sanctuary. Unit equivalencies will only be published once empirical field validation concludes.",

    "respaldo_title": "Límites y Responsabilidad Científica",
    "respaldo_title_en": "Scientific Limits, Accountability & Legal Disclaimer"
  }'::jsonb
);

-- ── 2. Fichas de evidencia científica en section_key = 'ciencia' ─────────────

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'ciencia', 0, '{
  "categoria": "Palinología & Pureza",
  "categoria_en": "Palynology & Purity",
  "titulo": "Cero neonicotinoides y glifosato en matrices de polen insular",
  "titulo_en": "Zero neonicotinoids and glyphosate in insular pollen matrices",
  "texto": "Los ensayos cromatográficos multiresiduo conducidos en polen y miel silvestre del bosque templado lluvioso de Chiloé confirman la ausencia detectable de insecticidas sistémicos (imidacloprid, tiametoxam) y herbicidas agroindustriales.",
  "texto_en": "Multi-residue chromatographic assays conducted on wild pollen and honey matrices in the temperate rainforest of Chiloé confirm undetectable levels of systemic insecticides and agro-industrial herbicides.",
  "fuente": "Ensayos palinológicos y de residuos · INIA / UACh"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'ciencia' AND item_order = 0
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'ciencia', 1, '{
  "categoria": "Bioactividad No-Peróxica",
  "categoria_en": "Non-Peroxide Bioactivity",
  "titulo": "Potencial inhibitorio natural de flora siempreverde",
  "titulo_en": "Natural inhibitory potential of evergreen flora",
  "texto": "Estudios agronómicos y microbiológicos respaldan la dominancia de especies endémicas del bosque valdiviano e insular como fuente única de bioactividad antibacteriana natural no peróxica sin alteración térmica.",
  "texto_en": "Agronomic and microbiological studies support the dominance of endemic Valdivian and insular forest species as a natural non-peroxide antibacterial bioactivity source without thermal alteration.",
  "fuente": "Melisopalinología NCh2981 · Monofloralidad estricta"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'ciencia' AND item_order = 1
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'ciencia', 2, '{
  "categoria": "Metabolismo & Glicemia",
  "categoria_en": "Metabolism & Glycemia",
  "titulo": "Índice glucémico moderado y enzimas activas",
  "titulo_en": "Moderate glycemic index and active enzymes",
  "texto": "La concentración natural de fructosa y glucosa estabilizada por deshidratación biológica otorga un índice glucémico de referencia ~55 con presencia permanente de diastasa, invertasa y glucosa oxidasa vivas.",
  "texto_en": "The natural concentration of fructose and glucose stabilized by biological dehydration yields a reference glycemic index of ~55 with active diastase, invertase, and glucose oxidase permanently preserved.",
  "fuente": "Codex Alimentarius CXS 12-1981 · Am. J. Clin. Nutr."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'ciencia' AND item_order = 2
);
