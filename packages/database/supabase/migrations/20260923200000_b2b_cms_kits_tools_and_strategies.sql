-- Migración 20260923200000: Sembrado e integración de Kits Comerciales Listos,
-- Trazabilidad Digital y Estrategias de Venta por Segmento en site_content.
-- Permite que el usuario edite, refine y ajuste el 100% de los kits y mecánicas
-- directamente desde el CMS de Núcleo y se rendericen en el frontend de Tienda.

-- 1. Cafeterías (b2b_cafeterias)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'El Gesto de Origen en Taza y Mesa',
  'strategy_summary', 'Miel cruda de bosque nativo batida en frío pensada para convivir con café de especialidad, infusiones y panadería de autor.',
  'strategy_ticket_boost', 'Servicio en mesa & vitrina retail',
  'strategy_key_tool', 'Código QR de Lote & Reseñas Verificadas',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Servicio en mesa con monodosis de miel cruda o crema botánica junto a la taza.',
    'Paso 2: Armonía sensorial entre perfiles de tueste y la botánica de Chiloé.',
    'Paso 3: Código QR de lote para pasaporte botánico y reseñas verificadas.',
    'Paso 4: Vitrina de retail en mesón para llevar la experiencia a casa.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'El Gesto de Origen en Taza y Mesa',
    'bajada', 'Miel cruda de bosque nativo batida en frío pensada para convivir con café de especialidad, infusiones y panadería de autor.',
    'aumento_ticket', 'Servicio en mesa & vitrina retail',
    'herramienta_clave', 'Código QR de Lote & Reseñas Verificadas',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Servicio en mesa con monodosis de miel cruda o crema botánica junto a la taza.',
      'Paso 2: Armonía sensorial entre perfiles de tueste y la botánica de Chiloé.',
      'Paso 3: Código QR de lote para pasaporte botánico y reseñas verificadas.',
      'Paso 4: Vitrina de retail en mesón para llevar la experiencia a casa.'
    )
  ),
  'tools', '[]'::jsonb,
  'process', jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', '25 g — Pieza de mesa',
      'desc', 'Para una infusión, panadería o regalo de cortesía. Se abre en la mesa manteniendo la estética de origen.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', '150 g — Reserva para llevar',
      'desc', 'Exhibición en barra para que el comensal continúe la experiencia en casa.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', '500 g — Uso interno de barra',
      'desc', 'Miel cruda y cremas botánicas para barista, repostería y preparaciones de la casa.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'barra-esencial',
      'nombre', 'Barra Esencial & Monodosis',
      'badge', 'Iniciación y Barra',
      'tier', 'starter',
      'tagline', 'El primer gesto de origen en la mesa de café',
      'descripcion', 'Orientado a cafeterías de especialidad que desean incorporar una pieza de mesa memorable para infusiones y bollería sin sobrecargar stock inicial.',
      'precio_neto_clp', 89000,
      'pvp_estimado_clp', 145000,
      'margen_estimado_pct', 39,
      'moq_summary', '48 frascos 25g + 6 frascos 150g',
      'sales_strategy', 'Monodosis de 25g lista para bandeja de café, infusión o bollería, acompañada de frascos de 150g para vitrina.',
      'recomendado_para', 'Cafeterías boutique o barras de especialidad iniciando experiencia con miel nativa.',
      'componentes_fisicos', jsonb_build_array(
        '48x Crema de Miel 25g (12 Cruda Floral, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Pureo)',
        '6x Frascos 150g vitrina para venta directa'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Trazabilidad por Lote: Certificado de pureza botánica y humedad <18% escaneable en mesa',
        'Ficha Barista Digital: Guía de maridaje con cafés lavados, naturales y métodos filtrados'
      )
    ),
    jsonb_build_object(
      'id', 'experiencia-barista',
      'nombre', 'Experiencia Barista & Maridaje',
      'badge', 'Más Elegido · Recomendado',
      'tier', 'growth',
      'tagline', 'Integración completa entre barra, cocina y vitrina de venta',
      'descripcion', 'El mix equilibrado para dotar la barra de producto de servicio, repostería con miel cruda y vitrina de alta rotación para los clientes del café.',
      'precio_neto_clp', 189000,
      'pvp_estimado_clp', 310000,
      'margen_estimado_pct', 40,
      'moq_summary', '96 frascos 25g + 18 frascos 150g + 2 potes 500g',
      'sales_strategy', 'Combina servicio en mesa, uso en barra y exhibición en mesón con formatos de origen.',
      'recomendado_para', 'Cafeterías con flujo constante que buscan diferenciar su propuesta gastronómica y fidelizar comensales.',
      'componentes_fisicos', jsonb_build_array(
        '96x Crema de Miel 25g mesa (24 Cruda, 24 Avellana, 24 Cacao, 24 Polen)',
        '18x Frascos 150g vitrina para venta directa',
        '2x Potes 500g uso barra y repostería'
      ),
      'integraciones_digitales', jsonb_build_array(
        'QR de Reseñas Verificadas: Calificación sensorial y notas de maridaje en vivo',
        'Sellos de Fidelización: Tus clientes acumulan sellos por cada café con miel servido',
        'Pack de Contenidos Digitales: Fotografías de alta resolución y fichas para cartas digitales'
      )
    ),
    jsonb_build_object(
      'id', 'alianza-integral',
      'nombre', 'Alianza Integral & Barra de Autor',
      'badge', 'Escala & Alta Rotación',
      'tier', 'flagship',
      'tagline', 'El estándar máximo de presencia y volumen preferente',
      'descripcion', 'Diseñado para cafeterías de alto volumen, tostadurías con salón o múltiples locales que buscan la máxima rentabilidad y soporte continuo.',
      'precio_neto_clp', 349000,
      'pvp_estimado_clp', 590000,
      'margen_estimado_pct', 42,
      'moq_summary', '192 frascos 25g + 36 frascos 150g + 6 potes 500g',
      'sales_strategy', 'Abastecimiento continuo para barra, vitrina y repostería interna, con reposición preferente y acompañamiento de origen.',
      'recomendado_para', 'Tostadurías, cafeterías de alto flujo o grupos gastronómicos con múltiples barras.',
      'componentes_fisicos', jsonb_build_array(
        '192x Crema de Miel 25g monodosis mesa (48 Cruda, 48 Avellana, 48 Cacao, 48 Polen)',
        '36x Frascos 150g vitrina con sello de recolección de bosque',
        '6x Potes 500g barista/cocina para repostería y bebidas de temporada'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Facturación Electrónica Automática: Emisión inmediata de factura exenta de IVA',
        'Directorio de Cafeterías Aliadas: Perfil geolocalizado en la app para comensales de la zona',
        'Reposición con Prioridad de Recolección: Reserva de lote anual garantizada'
      )
    ),
    jsonb_build_object(
      'id', 'obrador-reposteria',
      'nombre', 'Obrador & Cocina Dulce',
      'badge', 'Producción Gastronómica',
      'tier', 'growth',
      'tagline', 'Abastecimiento noble para cocina, repostería y coctelería',
      'descripcion', 'Miel cruda de gran volumen para obradores de panadería de masa madre, pastelería fina y preparación de bebidas de especialidad.',
      'precio_neto_clp', 280000,
      'pvp_estimado_clp', 490000,
      'margen_estimado_pct', 43,
      'moq_summary', '4 baldes 5kg + 2 potes 500g + 12 frascos 150g',
      'sales_strategy', 'Reemplazo noble de azúcares refinados en obrador y pastelería, destacando miel cruda de Chiloé en la carta.',
      'recomendado_para', 'Obradores de panadería, cocinas de autor y cafeterías con producción propia de repostería.',
      'componentes_fisicos', jsonb_build_array(
        '4x Baldes Gastronómicos 5kg Miel Cruda de Bosque Nativo',
        '2x Potes 500g cremas botánicas para pruebas de coctelería y café',
        '12x Frascos 150g para vitrina de caja'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Ficha Técnica de Humedad y Azúcares: Análisis analítico de laboratorio',
        'Sello Digital de Ingrediente Noble: Relato de origen para incluir en menú y redes'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-sale-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Pasaporte Digital de Lote & Trazabilidad en Mesa',
      'titulo_en', 'Batch Digital Passport & Table Traceability',
      'descripcion', 'Genera códigos QR dinámicos para cartas y mesas. Los comensales escanean directamente para descubrir el origen botánico, fecha de recolección y análisis de pureza de la miel que acompaña su café.',
      'descripcion_en', 'Generates dynamic QR codes for menus and tables. Patrons scan directly to explore botanical origin maps, collection dates, and laboratory purity metrics of their honey.',
      'badge', 'Trazabilidad Dinámica',
      'beneficio_comercial', 'Aporta valor tangible a la experiencia de café de especialidad y convierte comensales en compradores de frascos para llevar.',
      'beneficio_comercial_en', 'Adds tangible value to the specialty coffee experience, converting patrons into takeaway retail jar buyers.'
    ),
    jsonb_build_object(
      'id', 'modulo-resenas',
      'package_name', '@enjambre/resenas',
      'titulo', 'Motor de Reseñas Verificadas de Cata',
      'titulo_en', 'Verified Tasting Review Engine',
      'descripcion', 'Sistema de calificación sensorial en escala chilena 1–7 que captura notas de maridaje de tus baristas y comensales en tiempo real, publicándolas de forma transparente.',
      'descripcion_en', 'Sensory evaluation engine on the Chilean 1–7 scale capturing real-time coffee-and-honey pairing notes from your baristas and guests.',
      'badge', 'Prueba Social',
      'beneficio_comercial', 'Genera validación social inmediata en barra y posiciona a tu cafetería como referente en maridaje de café de especialidad.',
      'beneficio_comercial_en', 'Builds immediate social proof at the counter, positioning your coffee shop as a premier specialty pairing destination.'
    ),
    jsonb_build_object(
      'id', 'modulo-wallet',
      'package_name', '@enjambre/wallet',
      'titulo', 'Pase Digital Apple & Google Wallet con Retorno de Frascos',
      'titulo_en', 'Apple & Google Digital Wallet Pass with Jar Return',
      'descripcion', 'Permite a tus clientes guardar su tarjeta de membresía en su smartphone sin descargar aplicaciones. Acumulan sellos por cada café con miel y reciben abonos por devolver frascos de vidrio vacíos.',
      'descripcion_en', 'Enables customers to save their membership pass on smartphones with zero app downloads. They collect stamps per coffee and receive credits for returning empty glass jars.',
      'badge', 'Fidelización & Circularidad',
      'beneficio_comercial', 'Multiplica la retención de clientes recurrentes e impulsa un ciclo de reciclaje noble con incentivo de consumo en tu local.',
      'beneficio_comercial_en', 'Drives repeat patron retention while fueling a circular packaging loop that incentivizes spending in your store.'
    ),
    jsonb_build_object(
      'id', 'modulo-ciencia',
      'package_name', '@enjambre/ciencia',
      'titulo', 'Dossier Técnico & Triangulación de Laboratorio',
      'titulo_en', 'Technical Laboratory Dossier & Calibration',
      'descripcion', 'Acceso directo a análisis físico-químicos (humedad <18%, índice HMF, espectro polínico NCh2981) para calibrar recetas de autor, extracción espresso y emulsionado en frío.',
      'descripcion_en', 'Direct access to physico-chemical analyses (moisture <18%, HMF index, pollen profile) to calibrate signature recipes, espresso extractions, and cold churning.',
      'badge', 'Estándar Científico',
      'beneficio_comercial', 'Garantiza estabilidad técnica en cocina y barra sin fermentación ni azúcares adulterados, asegurando consistencia en cada taza.',
      'beneficio_comercial_en', 'Guarantees technical kitchen and bar stability with zero fermentation or adulterated sugars, ensuring consistency in every cup.'
    )
  )
)
WHERE section_key = 'b2b_cafeterias';

-- 2. Hoteles (b2b_hoteles)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Hospitalidad Austral & Amenities de Origen',
  'strategy_summary', 'Transformación del desayuno buffet en una experiencia memorable y servicio de cortesía en habitaciones: frascos de bienvenida y formatos gastronómicos sin envases plásticos.',
  'strategy_ticket_boost', 'Hospitalidad de origen y estuches de cortesía en checkout',
  'strategy_key_tool', 'Formatos Gastronómicos de Servicio & Tarjetas de Bienvenida',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Servicio de miel virgen en el desayuno buffet con formatos gastronómicos y frascos de mesa.',
    'Paso 2: Disponer en habitaciones el frasco de 25g de bienvenida con tarjeta QR de origen botánico.',
    'Paso 3: Ofrecer en recepción y lobby el estuche de regalo como recuerdo territorial del viaje.',
    'Paso 4: Envío directo a domicilio para turistas que viajan sin equipaje de bodega.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Hospitalidad Austral & Amenities de Origen',
    'bajada', 'Transformación del desayuno buffet en una experiencia memorable y servicio de cortesía en habitaciones: frascos de bienvenida y formatos gastronómicos sin envases plásticos.',
    'aumento_ticket', 'Hospitalidad de origen y estuches de cortesía en checkout',
    'herramienta_clave', 'Formatos Gastronómicos de Servicio & Tarjetas de Bienvenida',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Servicio de miel virgen en el desayuno buffet con formatos gastronómicos y frascos de mesa.',
      'Paso 2: Disponer en habitaciones el frasco de 25g de bienvenida con tarjeta QR de origen botánico.',
      'Paso 3: Ofrecer en recepción y lobby el estuche de regalo como recuerdo territorial del viaje.',
      'Paso 4: Envío directo a domicilio para turistas que viajan sin equipaje de bodega.'
    )
  ),
  'tools', '[]'::jsonb,
  'process', jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', '25 g — Amenity de Habitación',
      'desc', 'Mini frasco de cortesía en la habitación con tarjeta de origen para la bienvenida del huésped.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', '150 g — Boutique del Lobby',
      'desc', 'Ediciones numeradas con empaque para regalo en recepción y boutique del hotel.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', '500 g — Salón de Desayuno & Buffet',
      'desc', 'Miel cruda de bosque nativo para servicio continuo en buffet gastronómico.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'bienvenida-boutique',
      'nombre', 'Kit Bienvenida Boutique',
      'badge', 'Hospitalidad & Amenities',
      'tier', 'starter',
      'tagline', 'Amenities de 25g que elevan la bienvenida del huésped',
      'descripcion', 'Mini frascos de crema de miel cruda con tapa dorada y tarjeta de bienvenida que introduce al huésped en el bosque chilote.',
      'precio_neto_clp', 99000,
      'pvp_estimado_clp', 165000,
      'margen_estimado_pct', 40,
      'moq_summary', '72 frascos 25g + 72 tarjetas',
      'sales_strategy', 'Entrega un amenity memorable en habitación con tarjeta QR que induce al huésped a solicitar el set de regalo en recepción antes de su salida.',
      'recomendado_para', 'Lodges boutique, hoteles de autor y bed & breakfast premium.',
      'componentes_fisicos', jsonb_build_array(
        '72x Mini frascos 25g cortesía con tapa dorada y sello de garantía botánica',
        '72x Tarjetas de bienvenida con relato de bosque y QR de cata guiada'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Experiencia Sensorial Digital: El huésped escanea el QR del frasco y realiza una cata guiada desde su teléfono'
      )
    ),
    jsonb_build_object(
      'id', 'desayuno-buffet',
      'nombre', 'Kit Desayuno & Buffet Austral',
      'badge', 'Más Elegido · Servicio Continuo',
      'tier', 'medio',
      'tagline', 'Formatos para salón de desayuno y reposición continua',
      'descripcion', 'Elimina los envases plásticos individuales. Presenta miel cruda fluida en formatos de 500g para reposición continua y 25g para sala.',
      'precio_neto_clp', 219000,
      'pvp_estimado_clp', 365000,
      'margen_estimado_pct', 40,
      'moq_summary', '12 potes 500g + 36 mini frascos 25g',
      'sales_strategy', 'Formatos seleccionados de servicio para el salón de desayuno. Elimina mermas y envases individuales de plástico, proyectando calidad hotelera superior.',
      'recomendado_para', 'Hoteles con servicio de desayuno buffet, salones de té y resorts.',
      'componentes_fisicos', jsonb_build_array(
        '12x Potes 500g Miel Cruda de Bosque para reposición continua en buffet',
        '36x Mini frascos 25g cortesía para atención VIP o room service'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Pasaporte de Origen Forestal: QR en salón con mapa botánico de los predios protegidos'
      )
    ),
    jsonb_build_object(
      'id', 'gran-hospitalidad',
      'nombre', 'Gran Hospitalidad & Boutique del Lobby',
      'badge', 'Experiencia Completa & Lobby',
      'tier', 'flagship',
      'tagline', 'Amenities de suite, salón de desayuno y venta en lobby',
      'descripcion', 'Cubre el ciclo completo del huésped: amenity de llegada en 25g, salón de desayuno con potes de 500g y frascos de 150g para venta de souvenirs en recepción.',
      'precio_neto_clp', 385000,
      'pvp_estimado_clp', 650000,
      'margen_estimado_pct', 42,
      'moq_summary', '144 frascos 25g + 24 frascos 150g + 12 potes 500g',
      'sales_strategy', 'La solución total para el hotel: cubre habitaciones (amenities), salón de desayuno y la boutique del lobby para capturar ventas de souvenirs de alto margen.',
      'recomendado_para', 'Hoteles 4 y 5 estrellas, lodges de lujo y complejos turísticos con boutique.',
      'componentes_fisicos', jsonb_build_array(
        '144x Mini frascos 25g de cortesía para turndown service y bienvenida',
        '24x Frascos 150g vitrina lobby con empaque de regalo',
        '12x Potes 500g cocina/buffet para estación de desayuno'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Co-Branding Digital & Reseñas: Insignia compartida en la experiencia móvil y reseñas de huéspedes',
        'Despacho Programado Continuo: Garantía de stock reservado anual según ocupación hotelera'
      )
    ),
    jsonb_build_object(
      'id', 'spa-ritual',
      'nombre', 'Kit Spa & Ritual Austral',
      'badge', 'Cabina & Bienestar',
      'tier', 'especialidad',
      'tagline', 'Miel cruda pura y polen vivo para cabinas de masaje y spa',
      'descripcion', 'Protocolo de bienestar autóctono: formulado para envolturas corporales, tratamientos faciales y degustación post-sesión de relajación.',
      'precio_neto_clp', 145000,
      'pvp_estimado_clp', 240000,
      'margen_estimado_pct', 40,
      'moq_summary', '8 potes 500g + 4 potes polen de Pureo',
      'sales_strategy', 'Incorpora miel cruda pura y polen vivo en protocolos de spa, masajes australes y faciales regenerativos.',
      'recomendado_para', 'Spas de destino, cabinas de masaje y centros holísticos de hotelería.',
      'componentes_fisicos', jsonb_build_array(
        '8x Potes 500g Miel Cruda Pura grado alimentario y cosmético para cabina',
        '4x Potes Polen de Pureo con granos dorados ricos en antioxidantes'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Protocolo de Bienestar Austral: Guía técnica de preparación de emulsiones y aplicaciones frescas'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-impacto',
      'package_name', '@enjambre/impacto',
      'titulo', 'Certificado de Bosque Protegido para Memorias ESG',
      'titulo_en', 'Protected Forest Certificate for ESG Reports',
      'descripcion', 'Mide y certifica los metros cuadrados de bosque nativo templado preservados gracias al abastecimiento de miel virgen consumida en tu hotel.',
      'descripcion_en', 'Measures and certifies square meters of native temperate rainforest conserved through raw honey consumed at your hotel.',
      'badge', 'Sostenibilidad & ESG',
      'beneficio_comercial', 'Entrega a tu cadena hotelera reportes oficiales de sostenibilidad y conservación para memorias anuales y certificaciones ambientales.',
      'beneficio_comercial_en', 'Provides official sustainability and conservation metrics for corporate annual reports and environmental hospitality badges.'
    ),
    jsonb_build_object(
      'id', 'modulo-hotel-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Pasaporte Botánico Bilingüe & Trazabilidad de Mesa',
      'titulo_en', 'Bilingual Botanical Passport & Table Traceability',
      'descripcion', 'Códigos QR de alta resolución con detección automática de idioma (español/inglés) para la estación de desayuno, mostrando a turistas internacionales el origen de cada gota.',
      'descripcion_en', 'High-resolution QR codes with automatic language detection (Spanish/English) for breakfast buffet stations, showing international travelers the forest source.',
      'badge', 'Experiencia Bilingüe',
      'beneficio_comercial', 'Elimina los plásticos de un solo uso en el buffet y posiciona el desayuno del hotel como una experiencia gastronómica de nivel mundial.',
      'beneficio_comercial_en', 'Eliminates single-use plastics from the buffet line and elevates hotel breakfast into a world-class gastronomic experience.'
    ),
    jsonb_build_object(
      'id', 'modulo-fiscal',
      'package_name', '@enjambre/fiscal',
      'titulo', 'Facturación Centralizada B2B y Orden de Compra',
      'titulo_en', 'Centralized B2B Invoicing & Purchase Orders',
      'descripcion', 'Soporte completo para portales corporativos de compras hoteleras, órdenes de compra y facturación electrónica exenta de IVA.',
      'descripcion_en', 'Full support for hotel corporate purchasing portals, purchase orders, and VAT-exempt electronic invoicing.',
      'badge', 'Gestión Corporativa',
      'beneficio_comercial', 'Simplifica el ciclo contable y reduce los tiempos de aprobación con tu departamento de adquisiciones.',
      'beneficio_comercial_en', 'Simplifies accounting workflows and expedites procurement approvals with your corporate purchasing team.'
    )
  )
)
WHERE section_key = 'b2b_hoteles';

-- 3. Tiendas Gourmet (b2b_tiendas_gourmet)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Rotación Acelerada & Maridaje Fino',
  'strategy_summary', 'Estrategia de exhibición para mesón y maridaje activo junto a quesos maduros y charcutería. La miel como acompañante de valor para el ticket gourmet.',
  'strategy_ticket_boost', 'Maridaje fino de quesos, masas y charcutería',
  'strategy_key_tool', 'Exhibición Escalonada & Muestrario de Degustación',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Ubicar los frascos de miel cruda y cremas junto a la vitrina de quesos artesanales o panadería noble.',
    'Paso 2: Disponer degustación activa con pequeñas muestras para cata guiada.',
    'Paso 3: Proponer a los clientes el maridaje directo: Miel de Tiaca con queso azul y Ulmo con quesos de cabra.',
    'Paso 4: Ofrecer estuches de regalo para fechas especiales y obsequios gourmet.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Rotación Acelerada & Maridaje Fino',
    'bajada', 'Estrategia de exhibición para mesón y maridaje activo junto a quesos maduros y charcutería. La miel como acompañante de valor para el ticket gourmet.',
    'aumento_ticket', 'Maridaje fino de quesos, masas y charcutería',
    'herramienta_clave', 'Exhibición Escalonada & Muestrario de Degustación',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Ubicar los frascos de miel cruda y cremas junto a la vitrina de quesos artesanales o panadería noble.',
      'Paso 2: Disponer degustación activa con pequeñas muestras para cata guiada.',
      'Paso 3: Proponer a los clientes el maridaje directo: Miel de Tiaca con queso azul y Ulmo con quesos de cabra.',
      'Paso 4: Ofrecer estuches de regalo para fechas especiales y obsequios gourmet.'
    )
  ),
  'tools', '[]'::jsonb,
  'process', jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', '25 g — Impulso en Mesón de Cobro',
      'desc', 'Mini frascos de compra rápida al paso junto a la caja para impulsar el ticket promedio.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', '150 g — Góndola & Vitrina Retail',
      'desc', 'Formatos estándar de 150g en las 4 variedades botánicas con alta rotación en góndola.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', '500 g — Reserva Familiar de Cocina',
      'desc', 'Frascos de 500g para clientes recurrentes que consumen miel cruda en su hogar.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'vitrina-autor',
      'nombre', 'Kit Vitrina de Autor & Degustación',
      'badge', 'Iniciación Retail',
      'tier', 'starter',
      'tagline', 'El set indispensable para probar rotación en tu mostrador',
      'descripcion', '24 frascos de 150g en las variedades más aclamadas para mesón de venta y rotación ágil.',
      'precio_neto_clp', 75000,
      'pvp_estimado_clp', 125000,
      'margen_estimado_pct', 40,
      'moq_summary', '24 frascos 150g surtidos',
      'sales_strategy', 'Coloca los 24 frascos en el mostrador para compras de impulso con margen del 40%.',
      'recomendado_para', 'Emporios boutique, panaderías de masa madre y tiendas de quesos artesanales.',
      'componentes_fisicos', jsonb_build_array(
        '24x Frascos 150g surtidos (8 Miel Cruda Floral, 8 Crema con Avellana, 8 Crema con Cacao)'
      ),
      'integraciones_digitales', jsonb_build_array(
        'QR de Reseñas en Vivo: Tus clientes leen calificaciones reales de otros comensales antes de comprar'
      )
    ),
    jsonb_build_object(
      'id', 'emporio-selecto',
      'nombre', 'Kit Emporio Selecto & Alta Rotación',
      'badge', 'Más Elegido · Alta Rotación',
      'tier', 'growth',
      'tagline', 'El mix completo de formatos pequeños, medianos y de reserva',
      'descripcion', 'Combina frascos de 150g para consumo de mesa y 500g Reserva del Bosque para abastecer a la clientela habitual.',
      'precio_neto_clp', 195000,
      'pvp_estimado_clp', 330000,
      'margen_estimado_pct', 41,
      'moq_summary', '48 frascos 150g + 12 frascos 500g',
      'sales_strategy', 'La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina.',
      'recomendado_para', 'Tiendas gourmet consolidadas, fiambrerías finas y tiendas de vinos y quesos.',
      'componentes_fisicos', jsonb_build_array(
        '48x Frascos 150g vitrina (16 Miel Cruda, 16 Avellana, 8 Cacao, 8 Polen)',
        '12x Frascos 500g Reserva de bosque nativo con sello de recolección'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Sello de Fidelización de Tienda: Los clientes acumulan puntos por escanear en tu local',
        'Pack de Marketing y Redes: Fotografías en alta resolución para las redes de tu tienda'
      )
    ),
    jsonb_build_object(
      'id', 'coleccion-maestra',
      'nombre', 'Colección Maestra & Reserva Familiar',
      'badge', 'Escala & Rotación',
      'tier', 'flagship',
      'tagline', 'Volumen preferente de frascos de 150g y 500g',
      'descripcion', 'La solución para tiendas de gran volumen que buscan frascos de 150g de alta rotación y frascos de 500g Reserva del Bosque.',
      'precio_neto_clp', 420000,
      'pvp_estimado_clp', 720000,
      'margen_estimado_pct', 42,
      'moq_summary', '96 frascos 150g + 24 frascos 500g',
      'sales_strategy', 'La combinación de 96 frascos de 150g y 24 frascos de 500g asegura rotación continua en góndola.',
      'recomendado_para', 'Emporios de alta gama, tiendas de aeropuerto y tiendas gourmet de alto tráfico.',
      'componentes_fisicos', jsonb_build_array(
        '96x Frascos 150g surtidos de la colección completa de 4 variedades',
        '24x Frascos 500g Reserva con numeración de lote'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Fondo de Co-Marketing (Co-op): Rebate porcentual en publicidad para tu tienda',
        'Descuento de Recompra Rápida: Precios preferentes automáticos al reordenar antes de 30 días'
      )
    ),
    jsonb_build_object(
      'id', 'regalos-corporativos',
      'nombre', 'Kit Formatos de Selección & Obsequio',
      'badge', 'Edición Selección',
      'tier', 'especialidad',
      'tagline', 'Formatos seleccionados de 150g con relato de origen botánico',
      'descripcion', 'Orientado a tiendas con demanda de formatos selectos para obsequio gourmet y fechas clave.',
      'precio_neto_clp', 280000,
      'pvp_estimado_clp', 480000,
      'margen_estimado_pct', 42,
      'moq_summary', '60 frascos 150g surtidos + 30 tarjetas de origen botánico',
      'sales_strategy', 'Formatos selectos de miel cruda y crema batida con información botánica del lote, listos para venta como obsequio gourmet.',
      'recomendado_para', 'Tiendas con venta corporativa activa, clubes de vino y boutiques gastronómicas.',
      'componentes_fisicos', jsonb_build_array(
        '60x Frascos 150g surtidos (Miel Cruda Floral, Crema con Avellana y Crema con Cacao)',
        '30x Tarjetas de Origen Botánico con información del lote y notas de cata'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Pasaporte Digital de Regalo: El receptor del obsequio escanea el sello y conoce el origen'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-pricing',
      'package_name', '@enjambre/pricing',
      'titulo', 'Gestión de Márgenes Protegidos & PVP Sugerido',
      'titulo_en', 'Protected Margin Management & MAP Policies',
      'descripcion', 'Protegemos tu margen comercial garantizando que ningún canal venda por debajo del PVP acordado, manteniendo un estándar equitativo.',
      'descripcion_en', 'Protects your commercial margin by ensuring strict MAP compliance across all retail touchpoints.',
      'badge', 'Margen Protegido',
      'beneficio_comercial', 'Evita la canibalización de precios y garantiza rentabilidad predecible y blindada en tu góndola.',
      'beneficio_comercial_en', 'Prevents price cannibalization and guarantees predictable, bulletproof shelf profitability.'
    ),
    jsonb_build_object(
      'id', 'modulo-banco-chile',
      'package_name', '@enjambre/banco-chile',
      'titulo', 'Conciliación Automática de Pagos & Transferencias B2B',
      'titulo_en', 'Automated B2B Payment Conciliation',
      'descripcion', 'Integración directa con TEF bancaria para liberar pedidos mayoristas y despachos en minutos con factura emitida.',
      'descripcion_en', 'Direct wire transfer integration automating instant order release and electronic invoicing.',
      'badge', 'Conciliación Instantánea',
      'beneficio_comercial', 'Cero fricción en cobranza: tus transferencias bancarias se validan en segundos sin enviar comprobantes manuales.',
      'beneficio_comercial_en', 'Zero billing friction: bank transfers reconcile automatically with no manual receipts required.'
    )
  )
)
WHERE section_key = 'b2b_tiendas_gourmet';

-- 4. Ferias (b2b_ferias)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Degustación Sensorial & Conversión Ágil',
  'strategy_summary', 'Estructura de atención para ferias gourmet y mercados de autor. Degustación activa de perfiles botánicos y cobro rápido con QR o terminal móvil en menos de 1 minuto.',
  'strategy_ticket_boost', 'Degustación guiada al paso y formatos para llevar',
  'strategy_key_tool', 'Set de Degustación Sensorial & Pagos Móviles',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Disponer degustación abierta de las variedades de bosque nativo en el frente del stand.',
    'Paso 2: Invitar al asistente a descubrir las notas de origen y textura de la miel cruda recién batida.',
    'Paso 3: Presentar la riqueza botánica de Chiloé como garantía de pureza silvestre.',
    'Paso 4: Ofrecer formatos de 25g, 150g o packs de regalo con cobro inmediato QR o tarjeta.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Degustación Sensorial & Conversión Ágil',
    'bajada', 'Estructura de atención para ferias gourmet y mercados de autor. Degustación activa de perfiles botánicos y cobro rápido con QR o terminal móvil en menos de 1 minuto.',
    'aumento_ticket', 'Degustación guiada al paso y formatos para llevar',
    'herramienta_clave', 'Set de Degustación Sensorial & Pagos Móviles',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Disponer degustación abierta de las variedades de bosque nativo en el frente del stand.',
      'Paso 2: Invitar al asistente a descubrir las notas de origen y textura de la miel cruda recién batida.',
      'Paso 3: Presentar la riqueza botánica de Chiloé como garantía de pureza silvestre.',
      'Paso 4: Ofrecer formatos de 25g, 150g o packs de regalo con cobro inmediato QR o tarjeta.'
    )
  ),
  'tools', '[]'::jsonb,
  'process', jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', '25 g — Degustación e Impulso',
      'desc', 'Mini frascos de 25g para prueba rápida y compra impulsiva al paso.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', '150 g — Formato de Mesa para Llevar',
      'desc', 'Frascos de 150g en las variedades más apreciadas para consumo doméstico.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', '500 g — Reserva del Bosque',
      'desc', 'Formato mayor de miel cruda para clientes conocedores y familias.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'stand-degustacion',
      'nombre', 'Kit Stand de Degustación Rápida',
      'badge', 'Feria Inicial',
      'tier', 'starter',
      'tagline', 'Configuración ágil para ferias de fin de semana y mercados de autor',
      'descripcion', '72 mini frascos de 25g para venta rápida de impulso y 18 frascos de 150g para formatos de mesa.',
      'precio_neto_clp', 95000,
      'pvp_estimado_clp', 165000,
      'margen_estimado_pct', 42,
      'moq_summary', '72 frascos 25g + 18 frascos 150g',
      'sales_strategy', 'Los mini frascos a $2.500 CLP y el pack de 3 a $6.900 CLP garantizan un flujo ininterrumpido de ventas sin objeción de precio.',
      'recomendado_para', 'Emprendedores en ferias gastronómicas, bazares de diseño y ferias de fin de semana.',
      'componentes_fisicos', jsonb_build_array(
        '72x Mini frascos 25g (Surtido de 4 variedades con tapa dorada)',
        '18x Frascos 150g para formato de mesa'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Cobro Exprés con QR de Venta: El visitante escanea y paga directamente desde su aplicación bancaria'
      )
    ),
    jsonb_build_object(
      'id', 'encuentro-gastronomico',
      'nombre', 'Kit Encuentro Gastronómico & Cemento de Ventas',
      'badge', 'Más Elegido · Evento Mayor',
      'tier', 'growth',
      'tagline', 'Presencia robusta para festivales, ferias de 3 a 5 días y congresos',
      'descripcion', 'Un mix completo de 25g, 150g y 500g para atención de degustación continua y venta de formatos familiares.',
      'precio_neto_clp', 220000,
      'pvp_estimado_clp', 380000,
      'margen_estimado_pct', 42,
      'moq_summary', '144 frascos 25g + 36 frascos 150g + 12 frascos 500g',
      'sales_strategy', 'Atención continua de degustación y venta directa en mesón, maximizando la rotación diaria de producto.',
      'recomendado_para', 'Festivales gastronómicos, ferias costumbristas y expo de turismo austral.',
      'componentes_fisicos', jsonb_build_array(
        '144x Mini frascos 25g para venta por impulso y degustación masiva',
        '36x Frascos 150g vitrina con ediciones completas de bosque nativo',
        '12x Frascos 500g Reserva para compradores gourmet y familias'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Catas Digitales & Registro en Stand: Captura de contactos a cambio del primer sello del club'
      )
    ),
    jsonb_build_object(
      'id', 'activacion-masiva',
      'nombre', 'Kit Activación Masiva & Gran Feria',
      'badge', 'Gran Escala',
      'tier', 'flagship',
      'tagline', 'Volumen y puesta en escena para pabellones y eventos multitudinarios',
      'descripcion', 'El equipamiento total para ferias nacionales o exposiciones masivas con soporte de reposición de lote durante el evento.',
      'precio_neto_clp', 480000,
      'pvp_estimado_clp', 850000,
      'margen_estimado_pct', 44,
      'moq_summary', '288 frascos 25g + 72 frascos 150g + 24 frascos 500g',
      'sales_strategy', 'Presencia de alto impacto en pasillo ferial con margen protegido del 44%.',
      'recomendado_para', 'Ferias internacionales, pabellones gourmet y eventos de alta concurrencia.',
      'componentes_fisicos', jsonb_build_array(
        '288x Mini frascos 25g para máxima rotación en mesón de impulso',
        '72x Frascos 150g mix completo con etiqueta numerada',
        '24x Frascos 500g Reserva de gran formato para el hogar'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Soporte POS de Feria y Respaldo Continuo: Monitoreo de inventario y reposición prioritaria'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-sumup',
      'package_name', '@enjambre/sumup',
      'titulo', 'Terminal POS Móvil & Cobro en 3 Segundos',
      'titulo_en', 'Mobile POS Terminal & 3-Second Processing',
      'descripcion', 'Integración con lectores SumUp y Transbank para procesar pagos con tarjeta en condiciones de señal intermitente en recintos feriales.',
      'descripcion_en', 'SumUp and Transbank hardware integration allowing seamless card checkouts even under poor connectivity.',
      'badge', 'Cobro Sin Conexión',
      'beneficio_comercial', 'Reduce el tiempo de atención por cliente a menos de 45 segundos, capturando cada compra impulsiva del flujo peatonal.',
      'beneficio_comercial_en', 'Cuts service cycle to under 45 seconds per buyer, capturing every impulse purchase from the passing crowd.'
    ),
    jsonb_build_object(
      'id', 'modulo-ferias-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Cobro Inmediato con QR & Catas Digitales en Stand',
      'titulo_en', 'Instant QR Payments & In-Booth Digital Tastings',
      'descripcion', 'Código QR visible para pagos directos y registro sensorial guiado mientras el visitante prueba las variedades botánicas.',
      'descripcion_en', 'Visible QR display for direct payments alongside guided sensory feedback while visitors sample botanical varieties.',
      'badge', 'Interacción Interactiva',
      'beneficio_comercial', 'Multiplica las degustaciones efectivas y captura el contacto digital de cada comprador para ventas posteriores.',
      'beneficio_comercial_en', 'Quadruples successful tastings and captures digital contact info from every buyer for post-event reorders.'
    ),
    jsonb_build_object(
      'id', 'modulo-logistica',
      'package_name', '@enjambre/logistica',
      'titulo', 'Reposición Express para Eventos & Alerta de Stock Crítico',
      'titulo_en', 'Express Event Restocking & Critical Inventory Alerts',
      'descripcion', 'Monitoreo de inventario en tiempo real desde Campo hacia el backend de Núcleo para despachar refuerzos el mismo día.',
      'descripcion_en', 'Real-time stock monitoring pushing replenishment alerts directly to our fulfillment center.',
      'badge', 'Soporte Logístico',
      'beneficio_comercial', 'Nunca te quedes sin stock en los días de mayor venta del año.',
      'beneficio_comercial_en', 'Ensures you never run out of inventory during peak holiday market days.'
    )
  )
)
WHERE section_key = 'b2b_ferias';

-- 5. Revendedores (b2b_revendedores)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Venta por Recomendación & Degustación Cercana',
  'strategy_summary', 'Estrategia para embajadores territoriales y distribuidores independientes basada en demostración en círculos de confianza, oficinas y pedidos recurrentes quincenales.',
  'strategy_ticket_boost', 'Margen directo por volumen y compras recurrentes',
  'strategy_key_tool', 'Set de Muestras de Autor con Tarjetas QR de Lote',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Organizar micro-catas de degustación en reuniones familiares, grupos de trabajo o clubes.',
    'Paso 2: Presentar los perfiles de floración y la riqueza botánica del bosque nativo de Chiloé.',
    'Paso 3: Tomar el pedido directo en mano o compartir el link personalizado de revendedor con cobro digital.',
    'Paso 4: Coordinar la entrega quincenal acumulada con despacho bonificado a domicilio.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Venta por Recomendación & Degustación Cercana',
    'bajada', 'Estrategia para embajadores territoriales y distribuidores independientes basada en demostración en círculos de confianza, oficinas y pedidos recurrentes quincenales.',
    'aumento_ticket', 'Margen directo por volumen y compras recurrentes',
    'herramienta_clave', 'Set de Muestras de Autor con Tarjetas QR de Lote',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Organizar micro-catas de degustación en reuniones familiares, grupos de trabajo o clubes.',
      'Paso 2: Presentar los perfiles de floración y la riqueza botánica del bosque nativo de Chiloé.',
      'Paso 3: Tomar el pedido directo en mano o compartir el link personalizado de revendedor con cobro digital.',
      'Paso 4: Coordinar la entrega quincenal acumulada con despacho bonificado a domicilio.'
    )
  ),
  'tools', '[]'::jsonb,
  'process', jsonb_build_array(
    jsonb_build_object(
      'step', '01',
      'title', '25 g — Muestras de Apertura',
      'desc', 'Mini frascos de 25g de cortesía para dar a probar a nuevos prospectos y círculos cercanos.'
    ),
    jsonb_build_object(
      'step', '02',
      'title', '150 g — Entrega Directa en Mano',
      'desc', 'Frascos de 150g en mano para tus primeras ventas inmediatas.'
    ),
    jsonb_build_object(
      'step', '03',
      'title', '500 g — Reposición Hogar & Familia',
      'desc', 'Frascos de 500g para abastecer hogares que consumen miel cruda a diario.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-embajador-inicial',
      'nombre', 'Kit Embajador Inicial',
      'badge', 'Iniciación Embajador',
      'tier', 'starter',
      'tagline', 'Formatos de mano para iniciar ventas en tu red cercana',
      'descripcion', 'Incluye 18 frascos de 150g para tus primeras ventas inmediatas con entrega en mano.',
      'precio_neto_clp', 65000,
      'pvp_estimado_clp', 110000,
      'margen_estimado_pct', 41,
      'moq_summary', '18 frascos 150g surtidos',
      'sales_strategy', 'Inicia ventas en tu red cercana; recupera la inversión total del kit en menos de 48 horas entregando los frascos en mano.',
      'recomendado_para', 'Nuevos embajadores que inician ventas con familiares, amigos y compañeros de trabajo.',
      'componentes_fisicos', jsonb_build_array(
        '18x Frascos 150g entrega inmediata (Miel Cruda, Crema Avellana, Crema Cacao)'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Código QR de Embajador Asignado: Tus clientes escanean tu código y sus compras quedan vinculadas a tu cuenta'
      )
    ),
    jsonb_build_object(
      'id', 'stock-rotacion',
      'nombre', 'Kit Stock de Rotación & Demostración',
      'badge', 'Más Elegido · Círculo Activo',
      'tier', 'growth',
      'tagline', 'El balance ideal entre producto de entrega inmediata y obsequios',
      'descripcion', '36 frascos de 150g y 12 frascos de 500g para abastecer hogares, más 50 mini frascos de 25g de obsequio para abrir nuevos clientes.',
      'precio_neto_clp', 185000,
      'pvp_estimado_clp', 320000,
      'margen_estimado_pct', 42,
      'moq_summary', '36 frascos 150g + 12 frascos 500g + 50 minis 25g',
      'sales_strategy', 'Los mini frascos de 25g de obsequio abren puertas instantáneamente para generar pedidos recurrentes.',
      'recomendado_para', 'Revendedores activos con red consolidada en oficinas, condominios o gimnasios.',
      'componentes_fisicos', jsonb_build_array(
        '36x Frascos 150g surtidos de las 4 cremas botánicas de Chiloé',
        '12x Frascos 500g Reserva para consumo familiar continuo',
        '50x Mini frascos 25g cortesía para abrir nuevos prospectos'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Bonus de Recompra Rápida: Desbloquea unidades de cortesía al recomprar en menos de 30 días',
        'Pack Digital de Ventas: Imágenes y fichas botánicas para compartir en WhatsApp e Instagram'
      )
    ),
    jsonb_build_object(
      'id', 'distribuidor-zonal',
      'nombre', 'Kit Distribuidor Zonal & Red de Contactos',
      'badge', 'Red Ampliada',
      'tier', 'flagship',
      'tagline', 'Abastecimiento de volumen para liderar una micro-red en tu comuna',
      'descripcion', 'Para distribuidores independientes que colocan producto en pequeños comercios de barrio, ferias locales o grupos de compra comunitaria.',
      'precio_neto_clp', 460000,
      'pvp_estimado_clp', 810000,
      'margen_estimado_pct', 43,
      'moq_summary', '96 frascos 150g + 36 frascos 500g + 120 minis 25g',
      'sales_strategy', 'Margen del 43% que permite revender a pequeños negocios aliados o clientes finales.',
      'recomendado_para', 'Líderes de distribución local, profesionales independientes y distribuidores zonales.',
      'componentes_fisicos', jsonb_build_array(
        '96x Frascos 150g mix completo de alta rotación',
        '36x Frascos 500g Reserva de miel cruda pura de bosque nativo',
        '120x Mini frascos 25g de impulso para activación comercial continua'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Asignación de Zona Preferente: Derivación de prospectos minoristas que consultan desde tu comuna'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-rate-limit',
      'package_name', '@enjambre/rate-limit',
      'titulo', 'Link Personal de Afiliado & Registro de Pedidos Blindado',
      'titulo_en', 'Personal Affiliate Link & Abuse-Protected Ordering',
      'descripcion', 'Tu enlace único para compartir por WhatsApp o redes sociales cuenta con protección perimetral contra spam y bots.',
      'descripcion_en', 'Your personal shareable link is shielded with edge rate-limiting to prevent spam orders and bots.',
      'badge', 'Seguridad Perimetral',
      'beneficio_comercial', 'Garantiza que todas las comisiones por ventas en línea se asignen limpiamente a tu cuenta bancaria.',
      'beneficio_comercial_en', 'Ensures online referral commissions attribute cleanly and securely to your bank account.'
    ),
    jsonb_build_object(
      'id', 'modulo-pricing-rev',
      'package_name', '@enjambre/pricing',
      'titulo', 'Escalado Dinámico de Margen por Recompra',
      'titulo_en', 'Dynamic Margin Scaling on Reorders',
      'descripcion', 'Aumenta automáticamente tu margen comercial neto por frasco a medida que consolidas una cartera de clientes habituales.',
      'descripcion_en', 'Boosts your net profit per jar as you grow a steady customer base in your neighborhood.',
      'badge', 'Margen Creciente',
      'beneficio_comercial', 'Premia tu dedicación comercial con mayores márgenes netos en cada ciclo de reabastecimiento.',
      'beneficio_comercial_en', 'Rewards active distributors with escalating margins on every scheduled replenishment run.'
    )
  )
)
WHERE section_key = 'b2b_revendedores';
