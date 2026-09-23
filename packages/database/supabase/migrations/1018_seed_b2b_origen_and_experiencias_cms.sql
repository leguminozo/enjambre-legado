-- Migración 1018: Seeding default content para B2B, Origen, Experiencias y Trazabilidad QR (idempotent)
-- Permite editar todas las landings de alianzas B2B (/para/*), la biblioteca botánica (/origen),
-- las experiencias bioculturales (/experiencias, /experiencias/floraciones) y el escáner QR (/qr-scan)
-- directamente desde el CMS de Núcleo.

-- 1. B2B: Cafeterías
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_cafeterias', 0,
'{
  "slug": "cafeterias",
  "tipo": "cafeterias",
  "kicker": "Cafeterías & Tostadurías de Especialidad",
  "kicker_en": "Specialty Coffee Shops & Roasters",
  "headline": "Miel nativa de origen para café de especialidad",
  "headline_en": "Native origin honey for specialty coffee",
  "subheadline": "Perfiles monoflorales de Chiloé que complementan espressos y filtrados sin enmascarar su origen.",
  "subheadline_en": "Monofloral Chiloé profiles that complement espresso and pour-over without masking origin.",
  "hero_image": "/assets/editorial/b2b-cafeterias.jpg",
  "suggested_products_copy": "Formatos profesionales en baldes de 5 kg y dosificadores antigoteo para barra, más frascos de 300 g para reventa en tienda.",
  "suggested_products_copy_en": "Professional 5 kg buckets and no-drip bar dispensers, plus 300 g retail jars.",
  "cta_text": "Solicitar catálogo y muestras",
  "cta_text_en": "Request catalog & samples",
  "cta_href": "/contacto?asunto=cafeterias",
  "value_props": [
    {
      "icon": "Coffee",
      "title": "Perfiles organolépticos definidos",
      "title_en": "Defined organoleptic profiles",
      "description": "Ulmo para notas florales y cremosidad; Tiaca para acidez balanceada; Bosque Nativo para cuerpo robusto.",
      "description_en": "Ulmo for floral notes and creaminess; Tiaca for balanced acidity; Native Forest for robust body."
    },
    {
      "icon": "Layers",
      "title": "Formato barra y reventa",
      "title_en": "Bar & retail formats",
      "description": "Baldes gastronómicos de 5 kg para barra y frascos de 300 g para góndola de café.",
      "description_en": "5 kg catering buckets for bar and 300 g jars for retail shelves."
    },
    {
      "icon": "QrCode",
      "title": "Trazabilidad completa",
      "title_en": "Full traceability",
      "description": "Cada lote tiene código QR con origen en apiario de Chiloé, fecha de recolección y análisis de humedad.",
      "description_en": "Every batch has a QR code tracing back to Chiloé apiary, harvest date, and moisture analysis."
    }
  ],
  "stats": [
    { "value": "18%", "label": "Humedad máxima garantizada", "note": "Sin fermentación en barra" },
    { "value": "3", "label": "Perfiles monoflorales", "note": "Ulmo, Tiaca, Bosque Nativo" },
    { "value": "48h", "label": "Despacho a regiones", "note": "Desde centro de distribución" }
  ],
  "process": [
    { "step": "01", "title": "Cata de muestras", "description": "Enviamos kit de cata con 3 perfiles para que tu equipo de baristas pruebe con sus cafés." },
    { "step": "02", "title": "Definición de volumen", "description": "Elegimos los formatos adecuados (barra, cocina, reventa) y la frecuencia de reposición." },
    { "step": "03", "title": "Despacho programado", "description": "Entregas semanales o quincenales según el consumo de tu local, con facturación centralizada." }
  ],
  "faq": [
    {
      "question": "¿Cristaliza la miel en barra?",
      "answer": "La miel de Ulmo cristaliza de forma cremosa y suave. La de Tiaca se mantiene líquida por más tiempo. Recomendamos mantener a temperatura ambiente (18-22°C)."
    },
    {
      "question": "¿Cuál es el pedido mínimo para cafeterías?",
      "answer": "El pedido mínimo inicial es de 1 balde de 5 kg o 12 frascos de 300 g para reventa. Despachamos a todo Chile."
    },
    {
      "question": "¿Ofrecen capacitación para el equipo de baristas?",
      "answer": "Sí, entregamos fichas de cata y maridaje café-miel para cada perfil, y podemos coordinar una sesión virtual o presencial."
    }
  ],
  "seo_title": "Miel para Cafeterías de Especialidad · La Obrera y el Zángano",
  "seo_description": "Miel monofloral de Chiloé para cafeterías y tostadurías de especialidad. Formatos gastronómicos y de reventa con trazabilidad verificada."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_cafeterias');

-- 2. B2B: Hoteles
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_hoteles', 0,
'{
  "slug": "hoteles",
  "tipo": "hoteles",
  "kicker": "Hotelería Boutique & Lodges",
  "kicker_en": "Boutique Hospitality & Lodges",
  "headline": "Experiencia de origen austral para tus huéspedes",
  "headline_en": "Austral origin experience for your guests",
  "subheadline": "Desayunos memorables, amenidades exclusivas y el relato vivo del bosque nativo de Chiloé.",
  "subheadline_en": "Memorable breakfasts, exclusive amenities, and the living story of the Chiloé native forest.",
  "hero_image": "/assets/editorial/b2b-hoteles.jpg",
  "suggested_products_copy": "Frascos individuales para desayuno buffet, sets de regalo de bienvenida y miel a granel para cocina de autor.",
  "suggested_products_copy_en": "Individual breakfast buffet jars, welcome gift sets, and bulk honey for signature cuisine.",
  "cta_text": "Diseñar propuesta para hotel",
  "cta_text_en": "Design proposal for hotel",
  "cta_href": "/contacto?asunto=hoteles",
  "value_props": [
    {
      "icon": "Award",
      "title": "Narrativa de origen que eleva la estadía",
      "title_en": "Origin storytelling that elevates the stay",
      "description": "Tus huéspedes no solo consumen miel: conocen el bosque nativo de Chiloé, las floraciones y el cuidado de las abejas.",
      "description_en": "Your guests do not just consume honey: they experience Chiloé native forest, blooms, and bee stewardship."
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
      "description": "Resolución sanitaria al día, análisis de laboratorio por lote y suministro garantizado todo el año.",
      "description_en": "Up-to-date sanitary resolution, lab analysis per batch, and guaranteed year-round supply."
    }
  ],
  "stats": [
    { "value": "100%", "label": "Bosque nativo de Chiloé", "note": "Sin mezclas ni aditivos" },
    { "value": "40g–5kg", "label": "Rango de formatos", "note": "Amenidad, retail y cocina" },
    { "value": "12", "label": "Meses de suministro", "note": "Stock reservado para hotelería" }
  ],
  "process": [
    { "step": "01", "title": "Diagnóstico de necesidades", "description": "Analizamos tus puntos de contacto: desayuno, amenidades de bienvenida, carta de restaurante o tienda del hotel." },
    { "step": "02", "title": "Selección de formatos y personalización", "description": "Elegimos los perfiles y formatos ideales. Opciones de presentación con la identidad de tu establecimiento." },
    { "step": "03", "title": "Abastecimiento continuo", "description": "Calendario de entregas adaptado a tu temporada alta y baja, con soporte prioritario." }
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
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_hoteles');

-- 3. B2B: Tiendas Gourmet
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_tiendas_gourmet', 0,
'{
  "slug": "tiendas-gourmet",
  "tipo": "tiendas-gourmet",
  "kicker": "Tiendas Gourmet & Emporios",
  "kicker_en": "Gourmet Stores & Emporiums",
  "headline": "Un producto de alta gama que cuenta una historia",
  "headline_en": "A premium product that tells a story",
  "subheadline": "Presentación cuidada, calidad excepcional y márgenes comerciales justos para tu tienda especializada.",
  "subheadline_en": "Curated presentation, exceptional quality, and fair margins for your specialty store.",
  "hero_image": "/assets/editorial/b2b-tiendas.jpg",
  "suggested_products_copy": "Línea completa en frascos de 300 g y 500 g con estuche de regalo individual, packs de degustación y material de exhibición.",
  "suggested_products_copy_en": "Full line in 300 g and 500 g jars with individual gift boxes, tasting packs, and display materials.",
  "cta_text": "Solicitar lista de precios mayorista",
  "cta_text_en": "Request wholesale price list",
  "cta_href": "/contacto?asunto=tiendas-gourmet",
  "value_props": [
    {
      "icon": "Sparkles",
      "title": "Packaging y presentación premium",
      "title_en": "Premium packaging & presentation",
      "description": "Diseño editorial cuidado, frascos de vidrio hexagonales y etiquetas con serigrafía que destacan en repisa.",
      "description_en": "Curated editorial design, hexagonal glass jars, and screen-printed labels that stand out on shelf."
    },
    {
      "icon": "TrendingUp",
      "title": "Márgenes atractivos y rotación alta",
      "title_en": "Attractive margins & high turnover",
      "description": "Estructura de precios mayorista con márgenes del 35-45% para el canal retail gourmet.",
      "description_en": "Wholesale pricing structure with 35-45% margins for the gourmet retail channel."
    },
    {
      "icon": "QrCode",
      "title": "Material POP y soporte comercial",
      "title_en": "POP material & sales support",
      "description": "Fichas de producto, exhibidores de madera nativa y muestras para degustación en tu punto de venta.",
      "description_en": "Product sheets, native wood displays, and tasting samples for your point of sale."
    }
  ],
  "stats": [
    { "value": "35–45%", "label": "Margen comercial", "note": "Para el canal especializado" },
    { "value": "6", "label": "Unidades por caja", "note": "Pedido mínimo por variedad" },
    { "value": "100%", "label": "Recompra estimada", "note": "Alta fidelidad del cliente final" }
  ],
  "process": [
    { "step": "01", "title": "Solicitud de lista de precios", "description": "Te enviamos catálogo con precios mayoristas, escalas por volumen y condiciones comerciales." },
    { "step": "02", "title": "Primer pedido con material POP", "description": "Tu primer pedido incluye muestras de degustación, fichas descriptivas y opciones de exhibidor." },
    { "step": "03", "title": "Reposición ágil", "description": "Pedidos de reposición con despacho en 48 horas para mantener tu stock siempre fresco." }
  ],
  "faq": [
    {
      "question": "¿Cuál es el pedido mínimo para tiendas?",
      "answer": "El pedido mínimo es de 1 caja (6 unidades) por variedad. Puedes combinar variedades para armar un pedido variado."
    },
    {
      "question": "¿Incluyen material de apoyo para la venta?",
      "answer": "Sí, entregamos fichas descriptivas plastificadas, cucharillas de cata y frasco de muestra con cada pedido inicial."
    },
    {
      "question": "¿Tienen exclusividad territorial?",
      "answer": "Evaluamos exclusividad por zona geográfica según el volumen de compra y el perfil del establecimiento."
    }
  ],
  "seo_title": "Miel para Tiendas Gourmet y Emporios · La Obrera y el Zángano",
  "seo_description": "Miel premium de Chiloé para tiendas gourmet, emporios y almacenes naturales. Precios mayoristas, márgenes competitivos y material POP."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_tiendas_gourmet');

-- 4. B2B: Ferias
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_ferias', 0,
'{
  "slug": "ferias",
  "tipo": "ferias",
  "kicker": "Mercados & Ferias Gourmet",
  "kicker_en": "Markets & Gourmet Fairs",
  "headline": "Presencia destacada en eventos y mercados",
  "headline_en": "Standout presence at events & food markets",
  "subheadline": "Formatos listos para venta directa, degustaciones de alto impacto y soporte logístico para eventos.",
  "subheadline_en": "Direct sales-ready formats, high-impact tastings, and logistical event support.",
  "hero_image": "/assets/editorial/b2b-ferias.jpg",
  "suggested_products_copy": "Surtido variado en frascos de 300 g y 500 g, packs de 3 variedades para regalo y material de degustación para punto de venta.",
  "suggested_products_copy_en": "Assorted 300 g and 500 g jars, 3-jar gift sets, and tasting materials for POS.",
  "cta_text": "Coordinar stock para evento",
  "cta_text_en": "Coordinate stock for event",
  "cta_href": "/contacto?asunto=ferias",
  "value_props": [
    {
      "icon": "Users",
      "title": "La degustación vende sola",
      "title_en": "Tasting sells itself",
      "description": "El contraste sensorial entre Ulmo, Tiaca y Bosque Nativo genera una experiencia interactiva que convierte visitantes en compradores.",
      "description_en": "The sensory contrast between Ulmo, Tiaca, and Native Forest creates an interactive experience that converts visitors into buyers."
    },
    {
      "icon": "Truck",
      "title": "Logística flexible para fechas clave",
      "title_en": "Flexible logistics for key dates",
      "description": "Despachos coordinados para llegar justo antes de tu feria o mercado, con posibilidad de devolución de saldo no vendido.",
      "description_en": "Coordinated dispatches timed for your fair or market, with consignment return options."
    },
    {
      "icon": "Award",
      "title": "Material de stand profesional",
      "title_en": "Professional booth material",
      "description": "Banners de mesa, manteles de lino, fichas de cata y soportes de exhibición listos para usar.",
      "description_en": "Table banners, linen runners, tasting sheets, and turnkey display stands."
    }
  ],
  "stats": [
    { "value": "85%+", "label": "Conversión en degustación", "note": "De quienes prueban, compran" },
    { "value": "3x", "label": "Formatos de pack", "note": "Individual, dúo y trío de regalo" },
    { "value": "24h", "label": "Respuesta para eventos", "note": "Atención rápida por fechas límite" }
  ],
  "process": [
    { "step": "01", "title": "Cuéntanos sobre tu evento", "description": "Fecha, lugar, afluencia estimada de público y perfil de los asistentes." },
    { "step": "02", "title": "Plan de stock y degustación", "description": "Calculamos el stock óptimo por variedad y armamos el kit de degustación con insumos." },
    { "step": "03", "title": "Entrega y soporte post-evento", "description": "Despacho puntual en la locación del evento y balance comercial posterior." }
  ],
  "faq": [
    {
      "question": "¿Trabajan a consignación para ferias?",
      "answer": "Para eventos seleccionados ofrecemos esquemas mixtos con consignación parcial y devolución de unidades selladas en perfecto estado."
    },
    {
      "question": "¿Qué insumos de degustación incluyen?",
      "answer": "Podemos suministrar cucharillas de madera compostables, frascos de muestra y manteles de lino para montaje de stand."
    },
    {
      "question": "¿Con cuánta anticipación debo solicitar stock para una feria?",
      "answer": "Recomendamos al menos 7 días hábiles para garantizar stock completo y despacho coordinado."
    }
  ],
  "seo_title": "Miel para Ferias y Mercados Gourmet · La Obrera y el Zángano",
  "seo_description": "Miel de bosque nativo para stands de feria, mercados gastronómicos y eventos. Kits de degustación, formatos de venta rápida y logística flexible."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_ferias');

-- 5. B2B: Revendedores
INSERT INTO site_content (section_key, item_order, content)
SELECT 'b2b_revendedores', 0,
'{
  "slug": "revendedores",
  "tipo": "revendedores",
  "kicker": "Red de Representantes & Revendedores",
  "kicker_en": "Representatives & Resellers Network",
  "headline": "Únete a nuestra red de distribución consciente",
  "headline_en": "Join our conscious distribution network",
  "subheadline": "Distribuye miel nativa de Chiloé en tu territorio con respaldo de marca, herramientas de venta y precios preferenciales.",
  "subheadline_en": "Distribute Chiloé native honey in your territory with brand support, sales tools, and preferred pricing.",
  "hero_image": "/assets/editorial/b2b-revendedores.jpg",
  "suggested_products_copy": "Cajas cerradas de 12 y 24 unidades, kits de inicio con surtido completo y acceso a la app de Campo para gestión de pedidos.",
  "suggested_products_copy_en": "Cases of 12 and 24 units, starter kits with full assortment, and Campo app access for order management.",
  "cta_text": "Postular como revendedor",
  "cta_text_en": "Apply as reseller",
  "cta_href": "/contacto?asunto=revendedores",
  "value_props": [
    {
      "icon": "ShieldCheck",
      "title": "Marca consolidada con respaldo científico",
      "title_en": "Established brand with scientific backing",
      "description": "Vendes un producto con identidad territorial real, sellos de pureza y el respaldo del laboratorio apícola de Chiloé.",
      "description_en": "Sell a product with authentic territorial identity, purity seals, and Chiloé beekeeping lab backing."
    },
    {
      "icon": "TrendingUp",
      "title": "Escala de precios por volumen",
      "title_en": "Volume-based price tiers",
      "description": "Precios escalonados que premian tu crecimiento: mientras más volumen distribuyes, mejor es tu margen.",
      "description_en": "Tiered pricing that rewards your growth: the more volume you distribute, the better your margin."
    },
    {
      "icon": "Smartphone",
      "title": "Herramientas digitales de venta",
      "title_en": "Digital sales tools",
      "description": "Acceso a la app de Campo para registrar ventas offline, catálogo digital compartible y material gráfico para redes sociales.",
      "description_en": "Campo app access for offline sales, shareable digital catalog, and social media marketing assets."
    }
  ],
  "stats": [
    { "value": "40%+", "label": "Margen potencial", "note": "Según escala de volumen" },
    { "value": "24/7", "label": "App de gestión", "note": "Registro de ventas offline/online" },
    { "value": "1 a 1", "label": "Acompañamiento", "note": "Ejecutivo comercial asignado" }
  ],
  "process": [
    { "step": "01", "title": "Postulación y validación de zona", "description": "Revisamos tu propuesta, tu canal de venta y verificamos que no haya conflicto con revendedores existentes." },
    { "step": "02", "title": "Kit de inicio y capacitación", "description": "Recibes tu primer pedido con condiciones especiales, muestras, material comercial y acceso a las herramientas digitales." },
    { "step": "03", "title": "Crecimiento y exclusividad", "description": "A medida que consolidas tu volumen, accedes a mejores precios, condiciones de crédito y exclusividad en tu territorio." }
  ],
  "faq": [
    {
      "question": "¿Cuáles son los requisitos para ser revendedor?",
      "answer": "Tener iniciación de actividades o boleta de honorarios, definir un canal o territorio de venta, y comprometer un volumen mínimo mensual."
    },
    {
      "question": "¿Cómo funciona la app de Campo para revendedores?",
      "answer": "Nuestra PWA Campo te permite consultar stock, registrar ventas presenciales (incluso sin internet) y generar comprobantes digitales para tus clientes."
    },
    {
      "question": "¿Puedo vender a través de mis propias redes sociales o sitio web?",
      "answer": "Sí, facilitamos material fotográfico profesional, textos descriptivos y pautas de marca para que promociones en tus canales digitales."
    }
  ],
  "seo_title": "Red de Revendedores y Distribuidores · La Obrera y el Zángano",
  "seo_description": "Conviértete en revendedor o distribuidor de miel nativa de Chiloé. Márgenes competitivos, herramientas digitales de venta y soporte continuo."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_revendedores');

-- 6. Origen Settings (/origen)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'origen_settings', 0,
'{
  "kicker": "Colección",
  "kicker_en": "Collection",
  "title": "Origen & Floraciones",
  "title_en": "Origin & Blooms",
  "description": "Explora nuestra biblioteca de monografías botánicas. Un estudio profundo y documentado sobre las especies nectaríferas que sostienen la biodiversidad del bosque valdiviano y dan origen a nuestras creaciones.",
  "description_en": "Explore our botanical monograph library. An in-depth and documented study of nectariferous species that sustain Valdivian rainforest biodiversity and give origin to our creations."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'origen_settings');

-- 7. Origen Monografías Botánicas (/origen/ulmo, etc.)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'origen_monografias', 0,
'[
  {
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
        "answer": "La miel de ulmo proviene de la floración de Eucryphia cordifolia, un árbol endémico del bosque valdiviano en el sur de Chile. Es una de las mieles más valoradas del mundo por su perfil floral delicado con notas de vainilla y su color claro ámbar dorado."
      },
      {
        "question": "¿Cuándo florece el ulmo?",
        "answer": "El ulmo florece entre enero y marzo en el bosque valdiviano, coincidiendo con el verano austral. La floración dura aproximadamente 4-6 semanas y es altamente dependiente de las condiciones climáticas del año."
      },
      {
        "question": "¿Qué diferencia la miel de ulmo de la de tiaca?",
        "answer": "La miel de ulmo (Eucryphia cordifolia) es clara, floral, con notas de vainilla y cuerpo ligero. La miel de tiaca (Calcluvia paniculata) es más ámbar, herbácea, con mayor cuerpo y un perfil más terroso."
      }
    ]
  }
]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'origen_monografias');

-- 8. Experiencias Settings (/experiencias)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'experiencias_settings', 0,
'{
  "hero_kicker": "Programa de Experiencias",
  "hero_kicker_en": "Experience Program",
  "hero_title": "Encuentros en torno al origen apícola",
  "hero_title_en": "Gatherings around beekeeping origin",
  "hero_subtitle": "Sesiones a puerta cerrada diseñadas para directorios, círculos privados y gastronomía de autor. Conducidas personalmente por apicultores de Pureo, Chiloé.",
  "hero_subtitle_en": "Private sessions designed for boards, private circles and culinary creators. Personally led by beekeepers from Pureo, Chiloé.",
  "hero_image": "/assets/editorial/experiencias.jpg",
  "hero_cta_label": "Ver sesión insignia: Floraciones",
  "hero_cta_label_en": "Explore flagship session: Blooms",
  "hero_cta_href": "/experiencias/floraciones",
  "hero_secondary_label": "Solicitar propuesta privada",
  "hero_secondary_label_en": "Request private proposal",
  "hero_secondary_href": "#solicitud",
  "flagship_badge": "Sesión Insignia",
  "flagship_badge_en": "Flagship Session",
  "flagship_title": "Cata y Degustación: Floraciones del Bosque Austral",
  "flagship_title_en": "Tasting & Origin Analysis: Austral Forest Blooms",
  "flagship_desc": "Análisis sensorial guiado de mieles nativas y relato territorial sobre la supervivencia de la colmena en el archipiélago de Chiloé. Conducido por Cristina Miranda.",
  "flagship_desc_en": "Guided sensory analysis of native honeys and territorial narrative on colony resilience in the Chiloé archipelago. Conducted by Cristina Miranda.",
  "flagship_cta_label": "Ver experiencia completa",
  "flagship_cta_label_en": "View complete experience",
  "flagship_href": "/experiencias/floraciones"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'experiencias_settings');

-- 9. Floraciones Experience Settings (/experiencias/floraciones)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'floraciones_experience_settings', 0,
'{
  "kicker": "Cata Sensorial & Degustación de Autor",
  "kicker_en": "Sensory Tasting & Signature Experience",
  "title": "Cata y Degustación: Floraciones del Bosque Austral",
  "title_en": "Tasting & Sensory Analysis: Austral Forest Blooms",
  "subtitle": "Análisis sensorial guiado de mieles nativas y relato territorial sobre la supervivencia de la colmena en el archipiélago de Chiloé. Experiencia para empresas y grupos privados conducida por Cristina Miranda.",
  "subtitle_en": "Guided sensory analysis of native honeys and territorial storytelling on colony resilience in the Chiloé archipelago. Experience for companies and private groups conducted by Cristina Miranda.",
  "edition_note": "Edición actual: selección de floraciones nativas de temporada en copas y cucharillas técnicas.",
  "edition_note_en": "Current edition: seasonal native bloom selection in technical glassware and spoons.",
  "hero_image": "/assets/editorial/experiencias.jpg",
  "bio_name": "Cristina Miranda",
  "bio_location": "Pureo, Queilén · Archipiélago de Chiloé (km 8560)",
  "bio_trajectory_years": 19,
  "bio_paragraphs": [
    "Nacida y radicada en la localidad rural de Pureo, comuna de Queilén. Tras años dedicados a la pesca artesanal en los canales chilotes, inició en 2005 la transición hacia la apicultura tras sucesivas crisis en el sector pesquero de la zona.",
    "Sostiene apiarios en un territorio caracterizado por 9 a 10 meses de lluvia al año, humedad constante y vientos del Pacífico sur. Estas condiciones obligan a un manejo apícola riguroso y han favorecido la adaptación de abejas con alta resistencia climática, que pecorean en ventanas acotadas de floración en bosque nativo.",
    "Su trabajo con mieles de ulmo, tiaca, melí y bosque templado lluvioso ha sido parte de muestras del Festival Ñam, Expo Mundo Rural y la red de tiendas Mundo Rural en Santiago. La experiencia no es una demostración teórica: es el relato directo de dos décadas de oficio apícola continuo en uno de los puntos más australes del país."
  ],
  "bio_metrics": [
    { "value": "19 años", "label": "De oficio apícola continuo" },
    { "value": "9-10 meses", "label": "Lluvia anual en Pureo" },
    { "value": "km 8560", "label": "Ruta W-855, Queilén" },
    { "value": "48–72 h", "label": "Despacho de pedidos diferidos" }
  ],
  "movements": [
    {
      "step": "I",
      "title": "Cartografía de Floraciones",
      "description": "Degustación metódica de mieles monoflorales y de bosque nativo. Examen de color en escala visual, comportamiento de fluidez y textura de cristalización.",
      "elements": [
        "Copas y cucharillas técnicas de cata",
        "Floraciones nativas de temporada (Ulmo, Tiaca, Melí, Tineo, bosque templado)",
        "Análisis de acidez, aroma y notas botánicas"
      ]
    },
    {
      "step": "II",
      "title": "Invierno Austral en Pureo",
      "description": "Relato técnico sobre el ciclo biológico de la colmena bajo precipitaciones continuas. Decisiones de reserva de miel, control de humedad y termorregulación en el nido.",
      "elements": [
        "Pecoreo en ventanas climáticas reducidas",
        "Adaptación de abejas en el bosque insular",
        "Diferencias entre miel cruda recolectada en origen y miel procesada industrial"
      ]
    },
    {
      "step": "III",
      "title": "Contrapunto Gastronómico",
      "description": "Maridaje estructurado para contrarrestar la carga de azúcares y evaluar el comportamiento de la miel en presencia de grasas, sal y acidez.",
      "elements": [
        "Quesos maduros de guarda de pequeña producción",
        "Pan de masa madre de fermentación prolongada",
        "Chocolate 85% de origen definido",
        "Agua purificada para limpieza sensorial entre muestras"
      ]
    },
    {
      "step": "IV",
      "title": "Registro y Salida Diferida",
      "description": "Cierre de la sesión mediante registro individual. Cada participante conserva un artefacto físico con el perfil botánico y notas de la sesión.",
      "elements": [
        "Tarjeta de registro sensorial en papel de alta gramaje",
        "Código de sesión único para acceso a catálogo de reserva",
        "Despacho diferido en 48–72 horas a domicilio o empresa"
      ]
    }
  ],
  "formats": [
    {
      "id": "corporativo",
      "title": "Encuentro Corporativo & Directorios",
      "kicker": "Empresas, retiros de liderazgo y clientes institucionales",
      "capacity": "10 a 20 asistentes",
      "duration": "90 a 120 minutos",
      "context": "En dependencias del cliente o sala privada seleccionada (Santiago y regiones).",
      "summary": "Diseñado para directorios, equipos de liderazgo y recepción de clientes. Una sesión rigurosa de apreciación botánica y conversación sobre sistemas vivos y resiliencia territorial.",
      "includes": [
        "Conducción completa a cargo de Cristina Miranda y soporte técnico de OYZ",
        "Set completo de copas, cucharillas y vajilla de cata",
        "Floraciones nativas seleccionadas de la edición",
        "Maridaje de contrapunto (quesos de guarda, masa madre, chocolate 85%)",
        "Tarjetas de registro sensorial para cada asistente",
        "Montaje y desmontaje previo y posterior al encuentro"
      ]
    },
    {
      "id": "intimo",
      "title": "Encuentro Íntimo & Residencia",
      "kicker": "Círculos privados y celebraciones de autor",
      "capacity": "4 a 8 asistentes",
      "duration": "75 a 90 minutos",
      "context": "En residencia particular o locación seleccionada.",
      "summary": "Formato pausado para grupos reducidos y amantes de la gastronomía de origen. Degustación extendida y diálogo abierto sobre la apicultura austral.",
      "includes": [
        "Conducción personal de Cristina Miranda",
        "Muestras técnicas de floraciones de guarda",
        "Maridaje artesanal seleccionado",
        "Bitácora sensorial para cada invitado"
      ]
    }
  ],
  "protocol_headline": "Protocolo de Adquisición Diferida",
  "protocol_description": "Las creaciones degustadas durante el encuentro no se entregan en el lugar: se despachan directamente desde Chiloé en un plazo de 48 a 72 horas para garantizar la cadena de origen.",
  "protocol_artifact": "Tarjeta de Registro Sensorial y Pasaporte de Origen",
  "faq": [
    {
      "question": "¿Dónde se realizan las experiencias?",
      "answer": "Nos desplazamos a las oficinas de tu empresa, residencias privadas o espacios seleccionados tanto en Santiago como en regiones."
    },
    {
      "question": "¿Con cuánta anticipación se debe agendar?",
      "answer": "Recomendamos al menos 2 semanas de anticipación para coordinar el traslado de Cristina Miranda y el envío de las muestras frescas de la temporada."
    },
    {
      "question": "¿Los participantes pueden adquirir mieles después del encuentro?",
      "answer": "Sí. Cada asistente recibe una tarjeta con un código privado para ordenar lotes de reserva con entrega a domicilio."
    }
  ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'floraciones_experience_settings');

-- 10. Trazabilidad QR Settings (/qr-scan)
INSERT INTO site_content (section_key, item_order, content)
SELECT 'qr_scan_settings', 0,
'{
  "title": "Escáner de Trazabilidad",
  "title_en": "Traceability Scanner",
  "subtitle": "Escanea el código QR de tu producto para ver su trazabilidad completa desde el apiario hasta tu mesa.",
  "subtitle_en": "Scan the QR code on your jar to discover its complete traceability from the apiary to your table.",
  "search_label": "Ingresa o escanea el código QR",
  "search_label_en": "Enter or scan QR code",
  "search_placeholder": "Ej: ABC123XYZ",
  "search_button_label": "Escanear",
  "search_button_label_en": "Scan",
  "valid_title": "Cadena de trazabilidad íntegra",
  "valid_desc": "Eventos verificados con sello de autenticidad digital certificado.",
  "invalid_title": "Cadena de trazabilidad alterada",
  "invalid_desc": "El código ingresado no coincide con los registros oficiales verificados del lote."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'qr_scan_settings');
