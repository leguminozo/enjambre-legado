-- =============================================================================
-- Migration 20260925010000: Seed canónico para Galería, Nosotros, Contacto y Fichas Botánicas
--
-- 1. Inserta las 6 fotografías canónicas en section_key = 'galeria'
-- 2. Inserta la crónica, misión, visión y métricas en section_key = 'nosotros'
-- 3. Inserta la cabecera editorial en section_key = 'contacto'
-- 4. Unifica las 7 monografías botánicas en section_key = 'origen_monografias' como
--    registros individuales bilingües con descriptores sensoriales y fenología.
-- =============================================================================

-- ── 1. Galería Canónica (section_key = 'galeria') ────────────────────────────

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 0, '{
  "titulo": "Apiario Pureo",
  "descripcion": "Nuestras colmenas en el refugio del bosque nativo de Chiloé",
  "url": "/apiario-pureo.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 0
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 1, '{
  "titulo": "Recolección de Miel",
  "descripcion": "Extracción artesanal de miel cruda ulmo-tepú sin alteración térmica",
  "url": "/cosecha-miel.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 1
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 2, '{
  "titulo": "Bosque Regenerado",
  "descripcion": "22 años de presencia y protección activa del dosel templado lluvioso",
  "url": "/bosque-regenerado.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 2
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 3, '{
  "titulo": "Miel Cremosa",
  "descripcion": "Cristalización fina natural y batido en frío",
  "url": "/miel-cremosa.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 3
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 4, '{
  "titulo": "Abeja Nativa & Pecoreo",
  "descripcion": "Polinización silvestre en la floración del archipiélago",
  "url": "/abeja-nativa.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 4
);

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'galeria', 5, '{
  "titulo": "Envasado de Origen",
  "descripcion": "Proceso riguroso de envasado en origen con sellado individual",
  "url": "/envasado.jpg"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'galeria' AND item_order = 5
);

-- ── 2. Nosotros (section_key = 'nosotros') ──────────────────────────────────

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'nosotros', 0, '{
  "title": "Trayectoria y Vínculo",
  "desc": "Nuestra presencia en el bosque nativo de Chiloé y el compromiso con la abeja virgen.",
  "image": "/assets/editorial/nosotros-hero.jpg",
  "historia": "En términos generales, hacemos que la miel de Chiloé sea un puente entre el bosque nativo y una mesa consciente. La recolectamos en bosques antiguos y regenerados; el néctar llega crudo, batido en frío, con el perfil de las floraciones de ulmo y tepú. Cada frasco es un alimento de origen, no un medicamento ni un sustituto etiquetado de azúcar.\n\nHace 22 años iniciamos la recuperación forestal en un predio erosionado por incendios históricos en Pureo, Chiloé. Con paciencia y selección cuidada, reintrodujimos doseles de ulmo, tepú, tiaca y avellano chileno hasta conformar un refugio vivo de bosque templado lluvioso. En este entorno aislado, las colmenas recolectan néctar silvestre libre de agroquímicos, transformándolo en una miel cruda, ámbar y de textura cremosa natural.\n\nNuestra labor no persigue la extracción masiva, sino preservar la cadencia viva del territorio: un alimento noble que nace de la floración nativa y se proyecta como estándar de origen.",
  "mision": "Preservar la cadencia viva del territorio mediante una apicultura de origen, no invasiva y de alta pureza.",
  "vision": "Consolidar a Chiloé como santuario apícola de referencia internacional, integrando ciencia, ecología y alta gastronomía.",
  "stat1_label": "Años en el Bosque",
  "stat1_value": "22",
  "stat2_label": "IG de referencia (lit.)",
  "stat2_value": "55",
  "stat3_label": "Maduración en Frío",
  "stat3_value": "48h",
  "stat4_label": "Bosque Nativo",
  "stat4_value": "100%"
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'nosotros' AND item_order = 0
);

-- ── 3. Contacto (section_key = 'contacto') ──────────────────────────────────

INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'contacto', 0, '{
  "title": "Pabellón de Contacto & Consultas de Origen",
  "desc": "Estamos a tu disposición para resolver inquietudes sobre pedidos, reservas anuales, maridajes o requerimientos institucionales."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'contacto' AND item_order = 0
);

-- ── 4. Monografías Botánicas (section_key = 'origen_monografias') ────────────

-- Limpieza preventiva de arrays JSON legados que no siguen la convención de items individuales
DELETE FROM public.site_content
WHERE section_key = 'origen_monografias'
  AND jsonb_typeof(content) = 'array';

-- 4.1 Ulmo (Eucryphia cordifolia)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 0, '{
  "slug": "ulmo",
  "common_name": "Ulmo",
  "common_name_en": "Ulmo",
  "scientific_name": "Eucryphia cordifolia (Cavanilles)",
  "short_description": "Árbol majestuoso del bosque valdiviano, conocido por sus grandes flores blancas y su néctar de alta concentración de azúcares. Produce una miel de aroma floral intenso y notas de vainilla.",
  "short_description_en": "Majestic tree of the Valdivian rainforest, renowned for large white flowers and rich sugar nectar. Yields honey with an intense floral bouquet and vanilla notes.",
  "full_description": "El ulmo es un árbol perennifolio majestuoso del bosque valdiviano, endémico del sur de Chile y áreas contiguas en Argentina. Puede sobrepasar los 40 metros de altura y alcanzar diámetros de tronco de hasta dos metros. Su floración —entre enero y marzo— es un evento fenológico masivo de enorme trascendencia ecológica y apícola.",
  "full_description_en": "Ulmo is a majestic evergreen tree of the Valdivian rainforest, endemic to southern Chile and adjacent areas in Argentina. It can exceed 40 meters in height and reach trunk diameters up to two meters. Its flowering—between January and March—is a massive phenological event of immense ecological and apicultural significance.",
  "sensory_profile": "La miel unifloral de ulmo se distingue por un índice de color claro (ámbar extra blanco a ámbar claro). Presenta marcada actividad antioxidante y propiedades antibacterianas no peróxidas significativas. Aroma intensamente floral, volátil, con trazas evidentes de vainilla, anís y jazmín. Cristalización fina y mantecosa.",
  "sensory_profile_en": "Monofloral ulmo honey is distinguished by a light color index (extra white amber to light amber). It exhibits marked antioxidant activity and significant non-peroxide antibacterial properties. Intensely floral, volatile aroma, with evident traces of vanilla, anise, and jasmine. Fine, buttery crystallization.",
  "flowering_period": "Enero a Marzo (Verano Austral)",
  "flowering_period_en": "January to March (Austral Summer)",
  "ecology": "Especie pionera tardía de larga vida que requiere suelos profundos con humedad constante. Sostiene la biodiversidad del dosel albergando epífitas y nutriendo avifauna e insectos nativos.",
  "ecology_en": "Late pioneer, long-lived species requiring deep soils with constant moisture. Sustains canopy biodiversity by hosting epiphytes and feeding native birds and insects.",
  "references": "Donoso, C. (2006). Las especies arbóreas de los bosques templados de Chile y Argentina; Montenegro, G. et al. (2008). Propiedades antibacterianas y antioxidantes de las mieles chilenas.",
  "faqs": [
    {
      "question": "¿Qué es la miel de ulmo?",
      "question_en": "What is ulmo honey?",
      "answer": "La miel de ulmo proviene de la floración de Eucryphia cordifolia, un árbol endémico del bosque valdiviano en el sur de Chile. Es una de las mieles más valoradas del mundo por su perfil floral delicado con notas de vainilla y su color claro ámbar dorado.",
      "answer_en": "Ulmo honey comes from the flowering of Eucryphia cordifolia, an endemic tree of the Valdivian rainforest in southern Chile, famed for delicate floral and vanilla notes."
    },
    {
      "question": "¿Cuándo florece el ulmo?",
      "question_en": "When does the ulmo bloom?",
      "answer": "El ulmo florece entre enero y marzo en el bosque valdiviano, coincidiendo con el verano austral. La floración dura aproximadamente 4-6 semanas y es altamente dependiente de las condiciones climáticas del año.",
      "answer_en": "Ulmo blooms between January and March in the Valdivian rainforest, coinciding with the austral summer."
    }
  ]
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'ulmo'
);

-- 4.2 Tiaca (Caldcluvia paniculata)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 1, '{
  "slug": "tiaca",
  "common_name": "Tiaca",
  "common_name_en": "Tiaca",
  "scientific_name": "Caldcluvia paniculata (Cavanilles)",
  "short_description": "Complejidad balsámica de las quebradas húmedas y cursos de agua del sur. Su miel es de perfil profundo, acidez noble y retrogusto mineral.",
  "short_description_en": "Balsamic complexity of wet ravines and southern watercourses. Its honey offers a deep profile, noble acidity, and mineral finish.",
  "full_description": "La tiaca es una especie endémica de los bosques templados húmedos de Chile y el suroeste de Argentina. Crece vigorosamente en quebradas sombrías, bordes de arroyos y riberas, donde protege cuencas y suelos frágiles. Su floración blanca en panículas densas ocurre entre febrero y abril, ofreciendo una fuente de néctar balsámico insustituible al final de la temporada estival.",
  "full_description_en": "Tiaca is an endemic species of southern Chile temperate rainforests, growing near streams and ravines. Its white inflorescences bloom from February to April, yielding an irreplaceable balsamic nectar.",
  "sensory_profile": "Miel ámbar medio con tonalidades doradas profundas. Perfil marcadamente herbáceo y balsámico, con una acidez noble característica y un final mineral terroso prolongado en el paladar. Cristalización media y textura sedosa.",
  "sensory_profile_en": "Medium amber honey with deep golden tones. Distinctly herbal and balsamic profile with a noble crisp acidity and lingering earthy mineral finish.",
  "flowering_period": "Febrero a Abril (Cierre de verano y preludio otoñal)",
  "flowering_period_en": "February to April (Late summer to autumn prelude)",
  "ecology": "Árbol nodriza ribereño de rápido crecimiento que fija riberas y previene la erosión hídrica en quebradas del archipiélago de Chiloé.",
  "ecology_en": "Fast-growing riparian nurse tree stabilizing riverbanks and preventing soil erosion across Chiloé water basins.",
  "references": "Donoso, C. (2006). Árboles nativos de Chile; Montenegro, G. (2008). Propiedades palinológicas de mieles del bosque templado."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'tiaca'
);

-- 4.3 Melí (Amomyrtus meli)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 2, '{
  "slug": "meli",
  "common_name": "Melí",
  "common_name_en": "Melí",
  "scientific_name": "Amomyrtus meli (Philippi) Legrand et Kausel",
  "short_description": "Árbol endémico de la familia de las mirtáceas en Chiloé. Su miel es de dorado intenso, con notas aromáticas de mirto, pimienta dulce y madera noble.",
  "short_description_en": "Endemic myrtle tree of Chiloé. Yields intense golden honey with aromatic nuances of wild myrtle, sweet pepper, and noble wood.",
  "full_description": "El melí es un árbol siempreverde aromático endémico del sur de Chile, con presencia destacada en las islas y costas de Chiloé. Sus hojas lustrosas y flores blancas desprenden aceites esenciales balsámicos. Su néctar da origen a una miel con carácter terpénico pronunciado de altísima nobleza sensorial.",
  "full_description_en": "Melí is an aromatic evergreen tree endemic to southern Chile, especially prevalent in the damp coastal forests of Chiloé. Its nectar gives birth to an intensely aromatic honey with pronounced terpenic notes.",
  "sensory_profile": "Dorado intenso con matices cobrizos. Aroma resinoso y cálido, especias suaves de mirto, clavo de olor y retrogusto persistente que acompaña maridajes de alta intensidad.",
  "sensory_profile_en": "Deep golden amber. Warm balsamic and resinous aroma with subtle wild spices, sweet pepper, and long persistence.",
  "flowering_period": "Diciembre a Enero (Pleno verano austral)",
  "flowering_period_en": "December to January (Mid austral summer)",
  "ecology": "Especie umbrófila del sotobosque y dosel medio, fundamental en la regulación hídrica y en la provisión de aceites esenciales que fortalecen la sanidad de la colmena.",
  "ecology_en": "Shade-tolerant understory species key to forest moisture retention and essential volatile production.",
  "references": "Hechenleitner, P. et al. (2005). Plantas amenazadas del centro-sur de Chile; UACh Melisopalinología."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'meli'
);

-- 4.4 Tepú (Tepualia stipularis)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 3, '{
  "slug": "tepu",
  "common_name": "Tepú",
  "common_name_en": "Tepú",
  "scientific_name": "Tepualia stipularis (Hook. et Arn.) Griseb.",
  "short_description": "El corazón de los tepuales pantanosos de Chiloé. Miel ámbar rojiza oscura, densa, mineral, con notas de melaza pura, turba y bosque húmedo.",
  "short_description_en": "Heart of the flooded Chiloé tepuales. Dark reddish-amber honey, dense and mineral with notes of pure molasses, peat, and humid rainforest.",
  "full_description": "El tepú conforma formaciones boscosas impenetrables en suelos anegados del archipiélago chilote (tepuales). Sus troncos retorcidos y raíces aéreas crean un tapiz ecológico donde el agua dulce y la salinidad marina se encuentran. Su floración estival tardía suministra néctar denso y oscuro con altísima concentración mineral.",
  "full_description_en": "Tepú forms impenetrable swamp forests in saturated soils across Chiloé. Its dense, mineral-rich nectar yields an amber to dark reddish honey of exceptional depth.",
  "sensory_profile": "Ámbar rojizo oscuro. Textura untuosa y densa, acidez baja, notas de turba, bosque húmedo y azúcar morena con un final mineral marino de gran persistencia.",
  "sensory_profile_en": "Dark reddish amber. Dense buttery texture, low acidity, earthy peat and forest floor undertones with enduring oceanic mineral persistence.",
  "flowering_period": "Febrero a Abril (Cierre de verano y otoño)",
  "flowering_period_en": "February to April (Late summer to autumn)",
  "ecology": "Especie estructurante de humedales costeros y turberas, retenedora insustituible de carbono orgánico y amortiguadora de mareas en los canales chilotes.",
  "ecology_en": "Dominant species in peatlands and wetlands, sequestering massive organic carbon and buffering tidal cycles.",
  "references": "Villagrán, C. (1991). Historia de los bosques de Chiloé; SAG Registro de Especies Melíferas."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'tepu'
);

-- 4.5 Quillay (Quillaja saponaria)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 4, '{
  "slug": "quillay",
  "common_name": "Quillay",
  "common_name_en": "Quillay",
  "scientific_name": "Quillaja saponaria (Molina)",
  "short_description": "El árbol sagrado de la vertiente esclerófila y templada de Chile. Miel ámbar densa, floral intensa con toques tostados y gran riqueza fitoquímica.",
  "short_description_en": "Sacred tree of central and Mediterranean-temperate Chile. Dense amber honey with intense floral and toasted notes, rich in natural phytochemicals.",
  "full_description": "El quillay es un árbol endémico de la zona central y centro-sur de Chile, célebre por su corteza rica en saponinas naturales y su gran resiliencia frente a la sequía. Sus flores pentámeras en corimbos terminales florecen en primavera, generando un flujo masivo de néctar que reactiva la vigorosidad de los enjambres.",
  "full_description_en": "Quillay is an endemic tree famous for natural saponins and high drought resilience, blooming in spring with abundant nectar.",
  "sensory_profile": "Miel ámbar dorada de alta densidad y viscosidad. Aroma penetrante, floral intenso con notas tostadas y un amargor noble sutil muy balanceado. Posee gran persistencia retronasal y riqueza fitoquímica natural.",
  "sensory_profile_en": "Golden amber honey of high density. Pungent floral aroma with roasted undertones and a delicate, balanced noble bitterness.",
  "flowering_period": "Octubre a Diciembre (Primavera)",
  "flowering_period_en": "October to December (Austral Spring)",
  "ecology": "Especie esclerófila estructurante del ecosistema mediterráneo y de transición templada, fundamental para la recuperación de laderas áridas y la nutrición temprana de polinizadores silvestres.",
  "ecology_en": "Keystone sclerophyllous species providing early spring nutrition to wild bees.",
  "references": "Rodríguez, R. et al. (2018). Flora arbórea de Chile; Codex Alimentarius CXS 12-1981."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'quillay'
);

-- 4.6 Avellano Chileno (Gevuina avellana)
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 5, '{
  "slug": "avellano",
  "common_name": "Avellano Chileno",
  "common_name_en": "Chilean Hazelnut",
  "scientific_name": "Gevuina avellana (Molina)",
  "short_description": "Inflorescencias en racimo y nutrición densa del bosque siempreverde. Miel amaderada con notas a fruto seco y final suave.",
  "short_description_en": "Dense clusters and high nutrition from the evergreen forest. Woody honey with nutty undertones and smooth finish.",
  "full_description": "El avellano chileno es un árbol característico del bosque templado lluvioso perteneciente a la familia Proteaceae. Florece a principios de primavera con largos racimos de flores blancas hermafroditas. Además de aportar néctar, su polen posee una concentración excepcional de proteínas y lípidos esenciales para el desarrollo de la cría.",
  "full_description_en": "Chilean hazelnut belongs to the Proteaceae family, blooming in early spring with long clusters of white flowers that provide dense protein and lipid nutrition.",
  "sensory_profile": "Miel ámbar clara a media, de textura untuosa y cristalización rápida y fina. Notas amaderadas, toques tostados que recuerdan frutos secos y un final sedoso muy elegante.",
  "sensory_profile_en": "Light to medium amber, buttery texture with fast fine crystallization, woody nuances, and subtle nut aromas.",
  "flowering_period": "Octubre a Noviembre (Despertar primaveral)",
  "flowering_period_en": "October to November (Early Spring)",
  "ecology": "Especie del estrato medio y dosel que prolifera en suelos volcánicos y húmedos, clave para la nidificación y nutrición de aves e insectos polinizadores.",
  "ecology_en": "Canopy and subcanopy tree thriving in moist soils, crucial for native fauna nesting and nourishment.",
  "references": "Donoso, C. (2006). Bosques templados de Chile; Ensayos palinológicos INIA / UACh."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'avellano'
);

-- 4.7 Dosel Siempreverde Tepa/Arrayán
INSERT INTO public.site_content (section_key, item_order, content)
SELECT 'origen_monografias', 6, '{
  "slug": "arrayan_tepa",
  "common_name": "Dosel Siempreverde (Tepa y Arrayán)",
  "common_name_en": "Evergreen Canopy (Tepa & Arrayán)",
  "scientific_name": "Laureliopsis philippiana · Luma apiculata",
  "short_description": "Resinas balsámicas y arquitectura del bosque profundo austral. Aporta notas alcanforadas, retrogusto fresco y propóleos puros.",
  "short_description_en": "Balsamic resins and deep austral rainforest structure. Camphoric nuances, fresh finish, and pure protective propolis.",
  "full_description": "La asociación del dosel y sotobosque húmedo conformada por la tepa (Laureliopsis philippiana, Monimiaceae) y el arrayán (Luma apiculata, Myrtaceae) define el corazón del bosque siempreverde de Chiloé. Sus floraciones y exudados resinosos abastecen a las colmenas de compuestos aromáticos bioactivos que las abejas convierten en propóleos de máxima pureza.",
  "full_description_en": "The association of tepa and arrayán constitutes the heart of the evergreen rainforest in Chiloé, yielding volatile aromatic resins and propolis of supreme purity.",
  "sensory_profile": "Miel y mielatos de carácter balsámico alcanforado, con matices especiados y un retrogusto fresco muy distintivo. Notas resinosas nobles de bosque húmedo.",
  "sensory_profile_en": "Camphoric and balsamic character with fresh spicy nuances and noble damp forest resin notes.",
  "flowering_period": "Diciembre a Febrero (Verano templado)",
  "flowering_period_en": "December to February (Temperate summer)",
  "ecology": "Especies climácicas que retienen humedad atmosférica, regulan el microclima térmico y amortiguan los vientos oceánicos en el archipiélago.",
  "ecology_en": "Climax species regulating microclimate and shielding apiaries against oceanic winds.",
  "references": "Villagrán, C. (2002). Historia de los bosques del sur de Chile; Universidad Austral de Chile."
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE section_key = 'origen_monografias' AND content->>'slug' = 'arrayan_tepa'
);
