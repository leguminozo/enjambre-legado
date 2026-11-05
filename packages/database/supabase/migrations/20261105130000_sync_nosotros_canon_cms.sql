-- Sincroniza el canon editorial de /nosotros con el CMS relacional.
--
-- La página ya expone los capítulos I–VI desde `site_content`, pero la fila
-- `nosotros` conservaba solo el canon antiguo (title/desc/image/historia), sin
-- los campos nuevos ni sus traducciones. El editor los mostraba desde el
-- template en memoria, así que no quedaban persistidos ni eran editables de
-- verdad. Esta migración:
--   1. Agrega las claves canónicas que falten sin pisar ediciones existentes.
--   2. Retira las claves legacy `title`, `desc` e `image` (el hero vive en
--      `nosotros_settings`).
--   3. Sincroniza el subtítulo del hero y el CTA EN con el canon vigente.
--
-- Idempotente: se puede aplicar más de una vez.

UPDATE public.site_content
SET content = (
    $canon${
  "giro_kicker": "El Giro Vital · Pureo, Chiloé",
  "giro_kicker_en": "The Vital Turning Point",
  "giro_title": "Del maritorio austral a la cordillera de la Costa",
  "giro_title_en": "From artisanal fishing to the rainforest canopy",
  "giro_p1": "A inicios de la década del 2000, Cristina Miranda Rojas y Guillermo Cuevas enfrentaron un punto de inflexión decisivo. Vinculados durante años a la pesca artesanal y a la navegación por los canales interiores de Chiloé, las sucesivas crisis en el maritorio los impulsaron a una reinvención total. En lugar de abandonar el archipiélago, decidieron internarse hacia el relieve agreste de Pureo, en la comuna de Queilén.",
  "giro_p1_en": "At the beginning of the 2000s, Cristina Miranda Rojas and Guillermo Cuevas faced a radical turning point. Having spent their lives tied to artisanal fishing and navigating the inner sea channels of Chiloé, severe economic shifts in the marine sector compelled them to reimagine their path. They chose not to abandon the archipelago, but to journey deeper inland: into the rugged slopes of Pureo, in the commune of Queilén.",
  "giro_p2": "Llegaron a un predio marcado por la erosión de antiguos incendios forestales en la cordillera de la Costa: laderas desnudas, matorral de rebrote y suelo expuesto a la intemperie marítima del golfo Corcovado. Lejos de desalentarse, asumieron el predio como un compromiso de vida: sanar la tierra mediante un enriquecimiento botánico paciente, recolectando semillas y plántulas en quebradas vírgenes para devolver el dosel de ulmo, tepú, tiaca, avellano chileno y canelo.",
  "giro_p2_en": "They arrived at a parcel severely eroded by historic fires across the coastal range: bare soil, recovering scrubland, and open ash exposed to the maritime winds of the Corcovado Gulf. Rather than an obstacle, they embraced this remote sanctuary as their life commitment: healing the land through patient botanical enrichment, collecting native seeds from untouched rainforest ravines to restore ulmo, tepú, tiaca, hazelnut, and canelo.",
  "giro_p3": "Chiloé impone un rigor severo: llueve entre 9 y 10 meses al año, con persistente humedad y viento austral. Paradójicamente, esta adversidad climática se convirtió en su mayor virtud de origen: un filtro natural infranqueable que mantiene alejados los monocultivos y agroquímicos del continente, forjando colonias de abejas con un vigor biológico excepcional y una miel cruda densa, silvestre y pura.",
  "giro_p3_en": "Chiloé challenges beekeeping with rain falling 9 to 10 months a year and high relative humidity. Paradoxically, this harsh climate became the ultimate standard of origin: an impassable ecological barrier that keeps industrial monocultures, chemical sprays, and agrochemicals away, forging honeybee colonies of extraordinary hardiness and dense, raw honey of unmatched purity.",
  "historia": "En términos generales, hacemos que la miel de Chiloé sea un puente entre el bosque nativo y una mesa consciente. La recolectamos en bosques antiguos y regenerados; el néctar llega crudo, batido en frío, con el perfil de las floraciones de ulmo y tepú. Cada frasco es un alimento de origen, no un medicamento ni un sustituto etiquetado de azúcar. Hace 22 años iniciamos la recuperación forestal en un predio erosionado por incendios históricos en Pureo, Chiloé. Con paciencia y selección cuidada, reintrodujimos doseles de ulmo, tepú, tiaca y avellano chileno hasta conformar un refugio vivo de bosque templado lluvioso. En este entorno aislado, las colmenas recolectan néctar silvestre libre de agroquímicos, transformándolo en una miel cruda, ámbar y de textura cremosa natural. Nuestra labor no persigue la extracción masiva, sino preservar la cadencia viva del territorio: un alimento noble que nace de la floración nativa y se proyecta como estándar de origen.",
  "historia_en": "Broadly speaking, we make Chiloé honey a bridge between the native forest and a mindful table. We gather it from old-growth and regenerated forests; the nectar arrives raw, cold-creamed, carrying the sensory profile of ulmo and tepú blossoms. Each jar is a food of origin, neither a medicine nor a labeled sugar substitute.\n\nTwenty-two years ago we began forest recovery on land eroded by historic fires in Pureo, Chiloé. With patience and careful selection, we reintroduced canopies of ulmo, tepú, tiaca, and Chilean hazel until we shaped a living temperate rainforest refuge. In this isolated haven, the hives gather wild, agrochemical-free nectar, transforming it into a raw, amber, naturally creamy honey.\n\nOur craft never pursues mass extraction; it cherishes the living cadence of the land: a noble food born of native blossom and projected as a standard of origin.",
  "cronica_kicker": "Crónica de Territorio y Origen",
  "cronica_kicker_en": "Two Decades of Presence",
  "cronica_title": "22 Años en Cinco Movimientos",
  "cronica_title_en": "22 Years in Five Movements",
  "mov1_year": "2004",
  "mov1_title": "El Terreno y las Cenizas",
  "mov1_title_en": "The Soil and the Ashes",
  "mov1_desc": "Cristina Miranda Rojas, Guillermo Cuevas y su familia se asientan en el sector de Pureo, Queilén. Frente a laderas calcinadas por incendios históricos, definen el principio fundacional: no forzar el suelo con agroquímicos, no talar y respetar la cadencia de regeneración del bosque templado.",
  "mov1_desc_en": "Cristina Miranda Rojas, Guillermo Cuevas, and their family established themselves in Pureo, Queilén. Facing soils scorched by historic fires, they set the founding principle: no artificial chemicals, no clearcutting, and absolute respect for the rainforest recovery cycle.",
  "mov2_year": "2006–2010",
  "mov2_title": "La Siembra del Dosel",
  "mov2_title_en": "Restoring the Native Canopy",
  "mov2_desc": "Cuatro temporadas continuas de enriquecimiento botánico manual. Se reintroducen doseles de ulmo (Eucryphia cordifolia), tepú (Tepualia stipularis), tiaca (Caldcluvia paniculata), avellano chileno (Gevuina avellana) y canelo (Drimys winteri), devolviendo la humedad estructural al suelo.",
  "mov2_desc_en": "Four intense seasons of manual botanical enrichment. Reintroducing ulmo (Eucryphia cordifolia), tepú (Tepualia stipularis), tiaca (Caldcluvia paniculata), Chilean hazelnut (Gevuina avellana), and canelo (Drimys winteri), rebuilding the humid microclimate necessary for forest longevity.",
  "mov3_year": "2012",
  "mov3_title": "La Colmena Rústica",
  "mov3_title_en": "The First Rustic Hives",
  "mov3_desc": "Llegan los primeros núcleos de Apis mellifera al santuario. Manejar abejas bajo más de 2.000 mm de lluvia anual exigió una técnica insular adaptada: alzas ventiladas, monitoreo sanitario estricto sin residuos en cera, y la regla inquebrantable de jamás alimentar con jarabes de azúcar durante los flujos de néctar.",
  "mov3_desc_en": "The first nuclei of Apis mellifera arrived in the sanctuary. Handling hives under 2,000+ mm of annual rainfall demanded a tailored insular technique: elevated screened bases, rigorous organic health monitoring without synthetic waxes, and the firm rule of never feeding sugar syrups during honey flows.",
  "mov4_year": "2018–2022",
  "mov4_title": "La Maestría del Formato",
  "mov4_title_en": "Pioneering Formats & Cold Creaming",
  "mov4_desc": "Innovación pionera nacida en Chiloé: creación de \"Gotas de Néctar\" (sachets individuales de 15g de miel virgen) para promover el consumo sano en deportistas, junto al \"Panal del Bosque\" (trozo de panal sellado al vacío con opérculo intacto) y el perfeccionamiento del batido en frío de 48 horas a 14°–18°C sin daño térmico.",
  "mov4_desc_en": "Innovation born in the field: pioneer release of \"Gotas de Néctar\" (15g individual raw honey sachets) to promote natural intake among athletes, followed by \"Panal del Bosque\" (vacuum-sealed virgin comb with intact operculum) and the mastery of 48-hour cold creaming at 14°–18°C without pasteurization.",
  "mov5_year": "Presente",
  "mov5_year_en": "Present",
  "mov5_title": "Enjambre Legado & Soberanía Territorial",
  "mov5_title_en": "Enjambre Legado & Digital Sovereignty",
  "mov5_desc": "La segunda generación, encabezada por Gabriel Cuevas Miranda (antropología, diseño y código), consolida la soberanía del proyecto: reemplazo de plataformas intermediarias por el monorepo territorial Enjambre Legado, facturación directa SII, terminal ferial offline-first y articulación del Registro Territorial Apícola (Ley 21.489) para defender el origen de Chiloé.",
  "mov5_desc_en": "The second generation, led by Gabriel Cuevas Miranda (anthropology, design, and code), steps in to build sovereign technology: rejecting external commercial intermediaries to build the Enjambre Legado monorepo, direct SII fiscal compliance, offline POS for rural fairs, and community beekeeping protection under Law 21.489.",
  "principios_kicker": "Principios Fundacionales",
  "principios_kicker_en": "Founding Convictions",
  "principios_title": "El Estándar y el Resguardo",
  "principios_title_en": "Our Standard & Territorial Commitment",
  "mision_kicker": "01 · Técnica & Pureza",
  "mision_kicker_en": "01 · Technique & Purity",
  "mision_title": "El Estándar de Origen",
  "mision_title_en": "The Standard of Origin",
  "mision": "Preservar la cadencia viva del territorio mediante una apicultura de origen, no invasiva y de alta pureza.",
  "mision_en": "Preserving the living cadence of Chiloé through origin-based, non-invasive beekeeping, crafting pure foods without thermal damage or pasteurization.",
  "mision_footer_left": "Batido en Frío 48h · Miel Cruda",
  "mision_footer_left_en": "Cold-creamed 48h · Raw Honey",
  "mision_footer_right": "Codex Standard",
  "mision_footer_right_en": "Codex Standard",
  "vision_kicker": "02 · Santuario & Futuro",
  "vision_kicker_en": "02 · Sanctuary & Future",
  "vision_title": "El Resguardo del Territorio",
  "vision_title_en": "Territorial Protection",
  "vision": "Consolidar a Chiloé como santuario apícola de referencia internacional, integrando ciencia, ecología y alta gastronomía.",
  "vision_en": "Consolidating Chiloé as an international apicultural sanctuary, integrating field mastery, scientific evidence, and fine gastronomy.",
  "vision_footer_left": "Apiarios Fijos · Sin Trashumancia",
  "vision_footer_left_en": "Stationary Apiary · Zero Transhumance",
  "vision_footer_right": "Pureo · Queilén",
  "vision_footer_right_en": "Pureo · Queilén",
  "stat1_label": "Años de presencia",
  "stat1_label_en": "Years of Presence",
  "stat1_value": "22",
  "stat2_label": "Especies botánicas",
  "stat2_label_en": "Botanical Species",
  "stat2_value": "18+",
  "stat3_label": "Batido en frío",
  "stat3_label_en": "Cold-creamed",
  "stat3_value": "48h",
  "stat4_label": "Origen Bosque Nativo",
  "stat4_label_en": "Native Forest",
  "stat4_value": "100%",
  "stats_disclaimer": "* 100% bosque nativo: colmenas emplazadas exclusivamente en predios rodeados de dosel autóctono en Chiloé, sin cultivos industriales ni agroquímicos. Ver detalles analíticos en /ciencia.",
  "stats_disclaimer_en": "* 100% native forest: apiaries situated strictly within native canopy enclosures in Chiloé, without agrochemical exposure. See /ciencia.",
  "archivo_kicker": "Archivo Territorial & Memoria Viva",
  "archivo_kicker_en": "Territorial Archive & Living Memory",
  "archivo_title": "Huellas en el Bosque y la Colmena",
  "archivo_title_en": "Traces in the Forest & the Hive",
  "archivo_desc": "22 años de registros en Pureo: botánica nativa, maritorio, panales históricos y vida de campo.",
  "archivo_desc_en": "22 years of records in Pureo: native botany, maritime territory, historic frames, and field life.",
  "archivo_cta_label": "Abrir Archivo Completo",
  "archivo_cta_label_en": "Open Full Archive",
  "archivo_cta_href": "/galeria",
  "ciencia_kicker": "Rigor Analítico & Laboratorio",
  "ciencia_kicker_en": "Analytical Rigor",
  "ciencia_title": "Evidencia Científica & Protocolo Sensorial",
  "ciencia_title_en": "Scientific Evidence & Sensory Protocol",
  "ciencia_desc": "Curvas de floración observadas, análisis físico-químico por lote (humedad Codex <18%, HMF) y metodología sensorial ST-CATA documentados en detalle.",
  "ciencia_desc_en": "Observed flowering curves, physical-chemical batch analysis (Codex moisture <18%, HMF), and ST-CATA sensory radar documented in detail.",
  "ciencia_cta_label": "Explorar /ciencia",
  "ciencia_cta_label_en": "Explore /ciencia",
  "ciencia_cta_href": "/ciencia"
}$canon$::jsonb || content
  ) - 'title' - 'desc' - 'image',
    updated_at = NOW(),
    draft_content = NULL
WHERE section_key = 'nosotros'
  AND item_order = 0;

UPDATE public.site_content
SET content = content || jsonb_build_object(
  'subtitle', CASE
    WHEN COALESCE(content->>'subtitle', '') = '' THEN 'Desde el año 2003, un camino de aprendizajes, cambios y experiencia'
    WHEN content->>'subtitle' IN (
      '22 años de regeneración ecológica, apicultura regenerativa y miel cruda.',
      'Desde 2003, una historia familiar entre el bosque y la colmena'
    ) THEN 'Desde el año 2003, un camino de aprendizajes, cambios y experiencia'
    ELSE content->>'subtitle'
  END,
  'subtitle_en', CASE
    WHEN COALESCE(content->>'subtitle_en', '') = '' THEN 'Since 2003, a journey of learning, transformation, and experience'
    WHEN content->>'subtitle_en' = '22 years of ecological regeneration, regenerative apiculture and raw honey.' THEN 'Since 2003, a journey of learning, transformation, and experience'
    ELSE content->>'subtitle_en'
  END,
  'cta_label_en', CASE
    WHEN COALESCE(content->>'cta_label_en', '') IN ('', 'Explorar Catálogo') THEN 'Explore Catalog'
    ELSE content->>'cta_label_en'
  END
),
    updated_at = NOW(),
    draft_content = NULL
WHERE section_key = 'nosotros_settings';
