-- Migración 20260923200000: Sembrado e integración de Kits Comerciales Listos,
-- Herramientas Territoriales en Madera Nativa de Chiloé y Estrategias de Venta por Segmento en site_content.
-- Permite que el usuario edite, refine y ajuste el 100% de los kits, herramientas y mecánicas
-- directamente desde el CMS de Núcleo y se rendericen en el frontend de Tienda.

-- 1. Cafeterías (b2b_cafeterias)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'El Gesto de Origen en Taza',
  'strategy_summary', 'Monetización del ritual de endulzado consciente en barra. La miel no se regala ni se esconde en sachet anónimo: se presenta como una opción de origen (+ $1.500 CLP) con cuchara de avellano y dosis servida en mesa.',
  'strategy_ticket_boost', '+$1.500 CLP por bebida caliente',
  'strategy_key_tool', 'Tótem de Barra en Roble & Cucharas de Avellano',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Ofrecer en carta y barra "Endulzado de Origen Austral" (+ $1.500 CLP) con miel de Ulmo cruda batida.',
    'Paso 2: Servir el café acompañado de una dosis de miel presentada en base de madera nativa con cuchara de avellano.',
    'Paso 3: El cliente escanea el QR grabado en el tótem de la barra, revisa el análisis de laboratorio y las reseñas verificadas.',
    'Paso 4: El barista ofrece llevarse el formato retail de 300 g con 10% de beneficio al registrarse como cliente del colmenar.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'El Gesto de Origen en Taza',
    'bajada', 'Monetización del ritual de endulzado consciente en barra. La miel no se regala ni se esconde en sachet anónimo: se presenta como una opción de origen (+ $1.500 CLP) con cuchara de avellano y dosis servida en mesa.',
    'aumento_ticket', '+$1.500 CLP por bebida caliente',
    'herramienta_clave', 'Tótem de Barra en Roble & Cucharas de Avellano',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Ofrecer en carta y barra "Endulzado de Origen Austral" (+ $1.500 CLP) con miel de Ulmo cruda batida.',
      'Paso 2: Servir el café acompañado de una dosis de miel presentada en base de madera nativa con cuchara de avellano.',
      'Paso 3: El cliente escanea el QR grabado en el tótem de la barra, revisa el análisis de laboratorio y las reseñas verificadas.',
      'Paso 4: El barista ofrece llevarse el formato retail de 300 g con 10% de beneficio al registrarse como cliente del colmenar.'
    )
  ),
  'tools', jsonb_build_array(
    jsonb_build_object(
      'nombre', 'Tótem de Barra en Roble Demolido',
      'material', 'Roble reciclado de Chiloé curado con cera virgen de abejas',
      'rol', 'Servicio',
      'descripcion', 'Soporte macizo de mostrador con placa de bronce y QR láser a reseñas verificadas.',
      'impacto_ventas', 'Aumenta la conversión de compra retail en barra un 28%.'
    ),
    jsonb_build_object(
      'nombre', 'Rueda de Maridaje Café-Miel',
      'material', 'Papel mineral impermeable lavable',
      'rol', 'Barista',
      'descripcion', 'Guía sensorial táctil que asocia tuestes de especialidad con notas de Ulmo, Tiaca y Bosque Nativo.',
      'impacto_ventas', 'Aumenta en 35% la venta cruzada de espresso + miel.'
    ),
    jsonb_build_object(
      'nombre', 'Tablilla de Degustación en Avellano',
      'material', 'Madera de avellano chilote con ranuras para 3 copas',
      'rol', 'Mesa',
      'descripcion', 'Trío de copitas de degustación para catas guiadas y servicio en mesa.',
      'impacto_ventas', 'Permite cobrar $4.900 CLP por vuelo de cata en mesa.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-cafeteria-esencial',
      'nombre', 'Barra Esencial',
      'badge', 'Más Vendido',
      'tier', 'starter',
      'tagline', 'Starter de Alta Rotación para Cafeterías',
      'descripcion', 'La fórmula de entrada rápida para cafeterías que buscan validar la miel de especialidad en barra y generar ingresos adicionales con frascos retail.',
      'precio_neto_clp', 195000,
      'pvp_estimado_clp', 340000,
      'margen_estimado_pct', 43,
      'moq_summary', '1 kit inicial · Reposición flexible cada 30 días',
      'sales_strategy', 'Despliegue en barra con servicio asistido de café + venta directa en mostrador.',
      'recomendado_para', 'Cafeterías de especialidad de 30 a 60 tickets diarios.',
      'componentes_fisicos', jsonb_build_array(
        '1x Balde Gastronómico Miel Ulmo 5 kg',
        '12x Frasco Hexagonal Miel de Ulmo 300 g',
        '6x Frasco Hexagonal Miel de Tiaca 300 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '2x Cuchara mielera de madera de avellano chilote',
        '1x Dosificador antigoteo gastronómico de acero inoxidable'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Tótem de mostrador en roble recuperado con QR grabado a láser',
        '20x Folletos de maridaje café y bosque nativo'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Ficha digital de cata y maridaje para baristas',
        'QR con acceso a reseñas verificadas y lote en vivo'
      )
    ),
    jsonb_build_object(
      'id', 'kit-cafeteria-barista',
      'nombre', 'Experiencia Barista',
      'badge', 'Recomendado',
      'tier', 'growth',
      'tagline', 'Barra & Experiencia de Mesa Completa',
      'descripcion', 'Miel monofloral para maridajes con tuestes ligeros y medios, más servicio de mesa para elevar el ticket promedio.',
      'precio_neto_clp', 340000,
      'pvp_estimado_clp', 610000,
      'margen_estimado_pct', 44,
      'moq_summary', '1 kit · Reposición quincenal programada',
      'sales_strategy', 'Servicio de mesa premium y venta de impulso en mostrador asistida por baristas.',
      'recomendado_para', 'Cafeterías de especialidad de flujo medio-alto con foco en café de origen.',
      'componentes_fisicos', jsonb_build_array(
        '2x Balde Gastronómico Miel Ulmo 5 kg',
        '1x Balde Gastronómico Miel Tiaca 5 kg',
        '24x Frasco Hexagonal Miel de Ulmo 300 g',
        '12x Frasco Hexagonal Miel de Tiaca 300 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '4x Tablillas de servicio en roble para mesa con receptáculo para taza y miel',
        '4x Cucharas mieleras en avellano silvestre',
        '2x Dosificadores de barra antigoteo'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '2x Tótems de madera noble con código QR de trazabilidad de lote',
        '1x Rueda sensorial de maridaje café-miel en papel mineral para barra'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Módulo de trazabilidad interactiva para cartas digitales con QR',
        'Certificado digital de procedencia para el local'
      )
    ),
    jsonb_build_object(
      'id', 'kit-cafeteria-integral',
      'nombre', 'Alianza Integral Cafetería',
      'badge', 'Ecosistema',
      'tier', 'flagship',
      'tagline', 'Ecosistema Completo de Origen para Tostadurías',
      'descripcion', 'Solución total que abastece la barra, la carta de desayunos y la góndola completa para tostadurías con alta afluencia.',
      'precio_neto_clp', 580000,
      'pvp_estimado_clp', 1050000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit bimestral · Despacho bonificado prioritario',
      'sales_strategy', 'Ecosistema completo barra + repostería + venta directa con márgenes optimizados.',
      'recomendado_para', 'Tostadurías y cafeterías consolidadas con múltiples baristas.',
      'componentes_fisicos', jsonb_build_array(
        '3x Balde Gastronómico Miel Ulmo 5 kg',
        '2x Balde Gastronómico Miel Tiaca 5 kg',
        '48x Frasco Hexagonal Miel Ulmo 300 g',
        '24x Frasco Hexagonal Miel Tiaca 300 g',
        '12x Miel con Panal Virgen 500 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '6x Tablillas de servicio de mesa en maderas nativas seleccionadas',
        '6x Cucharas artesanales de avellano',
        '3x Dosificadores de barra de alta precisión'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Exhibidor modular de mesa en roble chilote para 12 frascos retail',
        '2x Tótems de barra grabados con QR y analíticas en vivo'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Página personalizada de cafetería aliada en el directorio territorial',
        'Acceso directo a pedidos mayoristas con reposición programada'
      )
    ),
    jsonb_build_object(
      'id', 'kit-cafeteria-obrador',
      'nombre', 'Obrador & Repostería',
      'badge', 'Producción',
      'tier', 'growth',
      'tagline', 'Insumo Puro para Cocina Dulce y Panadería',
      'descripcion', 'Miel cruda fluida y cremosa como reemplazo noble del azúcar refinada en preparaciones de pastelería y tostadas de autor.',
      'precio_neto_clp', 290000,
      'pvp_estimado_clp', 510000,
      'margen_estimado_pct', 43,
      'moq_summary', '1 kit · Reposición por balde según consumo',
      'sales_strategy', 'Reemplazo noble de azúcar en pastelería y panadería de autor, destacando el valor de origen en la carta.',
      'recomendado_para', 'Obradores, panaderías de masa madre y pastelerías de especialidad.',
      'componentes_fisicos', jsonb_build_array(
        '4x Balde Gastronómico Miel Ulmo 5 kg',
        '2x Balde Gastronómico Miel Bosque Nativo 5 kg',
        '12x Frasco Hexagonal Miel Ulmo 300 g para mostrador'
      ),
      'herramientas_servicio', jsonb_build_array(
        '2x Espátulas y paletas profesionales de madera de tepa para trasvasije',
        '2x Dosificadores de vertido rápido'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Sello de origen en madera para vitrina: Endulzado con Miel Virgen de Chiloé'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Recetario técnico de pastelería con miel cruda y coeficientes de hidratación',
        'Acceso a lotes por temporada con parámetros analíticos'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-sale-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Pasaporte Digital de Lote & QR de Mesa',
      'titulo_en', 'Batch Digital Passport & Table QR',
      'descripcion', 'Genera códigos QR dinámicos para los tótems de roble chilote. Los comensales escanean desde la mesa para descubrir el mapa de origen botánico, fecha de recolección y análisis de pureza de la miel que acompaña su café.',
      'descripcion_en', 'Generates dynamic batch QR codes for native oak table totems. Patrons scan from their table to explore botanical origin maps, collection dates, and laboratory purity metrics.',
      'badge', 'Trazabilidad Dinámica',
      'beneficio_comercial', 'Eleva la percepción de lujo en la mesa, justificando un recargo de +$1.500 CLP por taza servida y convirtiendo comensales en compradores de frascos para llevar.',
      'beneficio_comercial_en', 'Elevates table luxury perception, justifying a +$1,500 CLP premium per served cup and converting patrons into takeaway retail jar buyers.'
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
  'strategy_title', 'Estación de Miel Noble & Souvenir de Checkout',
  'strategy_summary', 'Transformación del desayuno buffet en una experiencia memorable y captación del huésped en el checkout: el 22% de los huéspedes que degustan la miel virgen en el desayuno compran un estuche de frascos al salir.',
  'strategy_ticket_boost', '+$18.000 CLP promedio por huésped comprador en checkout',
  'strategy_key_tool', 'Dispensador Noble en Vidrio Soplado & Tótems de Habitación',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Montar la estación de miel virgen en el buffet de desayuno con dispensador noble de roble y panal intacto.',
    'Paso 2: Colocar en habitaciones el tótem de madera con frasco de bienvenida y QR a la historia del apiario.',
    'Paso 3: El conserje ofrece en recepción el estuche de 3 frascos numerados como recuerdo territorial del viaje.',
    'Paso 4: Envío directo a domicilio para turistas que viajan sin equipaje de bodega.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Estación de Miel Noble & Souvenir de Checkout',
    'bajada', 'Transformación del desayuno buffet en una experiencia memorable y captación del huésped en el checkout: el 22% de los huéspedes que degustan la miel virgen en el desayuno compran un estuche de frascos al salir.',
    'aumento_ticket', '+$18.000 CLP promedio por huésped comprador en checkout',
    'herramienta_clave', 'Dispensador Noble en Vidrio Soplado & Tótems de Habitación',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Montar la estación de miel virgen en el buffet de desayuno con dispensador noble de roble y panal intacto.',
      'Paso 2: Colocar en habitaciones el tótem de madera con frasco de bienvenida y QR a la historia del apiario.',
      'Paso 3: El conserje ofrece en recepción el estuche de 3 frascos numerados como recuerdo territorial del viaje.',
      'Paso 4: Envío directo a domicilio para turistas que viajan sin equipaje de bodega.'
    )
  ),
  'tools', jsonb_build_array(
    jsonb_build_object(
      'nombre', 'Dispensador Noble para Buffet',
      'material', 'Roble chilote y vidrio soplado artesanal',
      'rol', 'Buffet',
      'descripcion', 'Dispensador de 3 litros con grifo antigoteo de latón pulido y base maciza de roble.',
      'impacto_ventas', 'Elimina mermas y proyecta máxima categoría gastronómica.'
    ),
    jsonb_build_object(
      'nombre', 'Set de Tótems para Habitación',
      'material', 'Madera de canelo curada',
      'rol', 'Habitación',
      'descripcion', 'Pieza de mesita de noche con tarjeta grabada de bienvenida y QR al apiario.',
      'impacto_ventas', 'Genera una tasa de lectura del 64% en huéspedes.'
    ),
    jsonb_build_object(
      'nombre', 'Estuches de Tepa para 3 Frascos',
      'material', 'Tepa chilota con tapa corrediza',
      'rol', 'Souvenir',
      'descripcion', 'Caja de madera pulida para 3 frascos de 150 g con grabado del lodge.',
      'impacto_ventas', 'Ticket de venta impulsiva de $28.000 CLP en recepción.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-hotel-bienvenida',
      'nombre', 'Bienvenida Boutique',
      'badge', 'Exclusivo',
      'tier', 'starter',
      'tagline', 'Amenities de Habitación & Regalo de Llegada',
      'descripcion', 'Frascos de bienvenida para habitaciones y suites boutique, acompañados de tarjetas de origen personalizadas.',
      'precio_neto_clp', 210000,
      'pvp_estimado_clp', 380000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit inicial · Reposición según ocupación hotelera',
      'sales_strategy', 'Amenity memorable que fideliza al huésped e impulsa la compra de recuerdos en el checkout.',
      'recomendado_para', 'Hoteles boutique y lodges de 5 a 15 habitaciones.',
      'componentes_fisicos', jsonb_build_array(
        '30x Frasco Miniatura Miel de Ulmo 50 g con sello de cera',
        '10x Frasco Miel de Ulmo 300 g para suites',
        '5x Miel con Panal Virgen 500 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '10x Cucharitas de avellano talladas a mano para servicio de bienvenida'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '10x Tótems de madera de canelo con tarjeta de origen para velador',
        '30x Tarjetas postales de flora de Chiloé en papel de algodón'
      ),
      'integraciones_digitales', jsonb_build_array(
        'QR personalizado con bienvenida digital del hotel y video del apiario',
        'Acceso preferencial a reservas de microlotes exclusivos'
      )
    ),
    jsonb_build_object(
      'id', 'kit-hotel-buffet',
      'nombre', 'Desayuno Buffet & Salón',
      'badge', 'Más Solicitado',
      'tier', 'growth',
      'tagline', 'Estación Central de Miel Austral para Salones',
      'descripcion', 'Experiencia visual y sensorial con panal virgen y miel cruda para salones y comedores de hospitalidad.',
      'precio_neto_clp', 380000,
      'pvp_estimado_clp', 690000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit · Reposición mensual de panales y miel',
      'sales_strategy', 'Experiencia sensorial en desayuno que eleva el rating del buffet y alimenta la tienda de recepción.',
      'recomendado_para', 'Lodges de naturaleza y hoteles de 15 a 40 habitaciones.',
      'componentes_fisicos', jsonb_build_array(
        '2x Marco de Panal Virgen Entero de Bosque Nativo (aprox. 2 kg c/u)',
        '2x Balde Gastronómico Miel Ulmo 5 kg',
        '12x Frasco Miel Ulmo 300 g para venta en recepción'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Soporte de exhibición para panal virgen en madera de roble y acero',
        '1x Cuchillo de corte de panal en acero templado',
        '2x Cucharas de servicio de miel en avellano'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Tótem de presentación para buffet con ficha botánica de floraciones',
        '1x Placa de mesa en madera nativa para la estación de desayunos'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Ficha explicativa de la miel virgen para el equipo de salón y cocina',
        'Registro del hotel como Embajada del Enjambre'
      )
    ),
    jsonb_build_object(
      'id', 'kit-hotel-hospitalidad',
      'nombre', 'Gran Hospitalidad & Recepción',
      'badge', 'Insignia',
      'tier', 'flagship',
      'tagline', 'Buffet + Amenity + Tienda de Recepción Completa',
      'descripcion', 'Solución integral de alto impacto para hoteles con tienda propia o vitrina de recuerdos en recepción.',
      'precio_neto_clp', 690000,
      'pvp_estimado_clp', 1250000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit bimestral · Despacho asegurado a regiones extremas',
      'sales_strategy', 'Traspaso directo de la experiencia del salón de desayuno a la tienda de recepción con alta conversión.',
      'recomendado_para', 'Hoteles boutique premium y cadenas de lujo.',
      'componentes_fisicos', jsonb_build_array(
        '3x Marco de Panal Virgen Entero',
        '3x Balde Gastronómico Miel Ulmo 5 kg',
        '36x Frasco Miel Ulmo 300 g',
        '24x Frasco Miel Tiaca 300 g',
        '12x Cofre de Regalo con 3 Variedades de Bosque'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Soporte de panal virgen de lujo en roble y bronce',
        '6x Cucharas mieleras en avellano silvestre',
        '1x Guillotina de corte limpio para panal'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Mueble exhibidor de recepción en madera nativa para 24 frascos',
        '2x Tótems de sobremesa para front desk con QR a tienda privada'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Integración con sistema de conciergerie para despacho a domicilio de turistas',
        'Reporte trimestral de impacto territorial para sostenibilidad del hotel'
      )
    ),
    jsonb_build_object(
      'id', 'kit-hotel-spa',
      'nombre', 'Spa & Ritual de Bienestar',
      'badge', 'Bienestar',
      'tier', 'growth',
      'tagline', 'Uso Tópico y Aromaterapia de Bosque Nativo',
      'descripcion', 'Miel pura sin filtrar para cabinas de masaje y salas de relajación con propiedades dérmicas reparadoras.',
      'precio_neto_clp', 280000,
      'pvp_estimado_clp', 490000,
      'margen_estimado_pct', 43,
      'moq_summary', '1 kit · Reposición trimestral de cabina',
      'sales_strategy', 'Tratamiento exclusivo de spa con miel cruda y cera virgen como valor agregado diferencial.',
      'recomendado_para', 'Spas de montaña, lodges termales y centros de bienestar.',
      'componentes_fisicos', jsonb_build_array(
        '2x Balde Miel Ulmo Cruda Pura 5 kg',
        '1x Balde Miel Bosque 5 kg',
        '5x Bloque de Cera Virgen de Abejas 500 g',
        '10x Miel con Panal 500 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '4x Cuencos de madera de tepa para aplicación térmica en cabina',
        '4x Pinceles de cerda natural para rituales corporales'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Menú de cabina grabado en madera nativa con protocolo de aplicación'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Protocolo terapéutico y propiedades dermatológicas de la miel de Ulmo',
        'Certificación de pureza biológica para cosmética natural'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-hotel-wallet',
      'package_name', '@enjambre/wallet',
      'titulo', 'Pase Digital de Huésped & Llave de Beneficios',
      'titulo_en', 'Guest Digital Pass & Hospitality Perks',
      'descripcion', 'Tarjeta para Apple Wallet y Google Wallet que el huésped activa al escanear el amenity de su habitación. Desbloquea la historia de la recolección estacional, cata guiada y descuento exclusivo en la boutique del lobby.',
      'descripcion_en', 'Digital pass for Apple Wallet and Google Wallet activated from the guest room amenity. Unlocks seasonal collection storytelling, guided tastings, and boutique discounts.',
      'badge', 'Hospitality Mobile',
      'beneficio_comercial', 'Convierte la cortesía de habitación en una venta de souvenir en recepción antes del checkout, con margen hotelero del 45%.',
      'beneficio_comercial_en', 'Converts bedside room amenities into high-margin souvenir checkout sales at the front desk (45% hotel margin).'
    ),
    jsonb_build_object(
      'id', 'modulo-impacto',
      'package_name', '@enjambre/impacto',
      'titulo', 'Certificados de Conservación Territorial & Reporte ESG',
      'titulo_en', 'Territorial Conservation Certificates & ESG Reporting',
      'descripcion', 'Módulo auditable que calcula y certifica los metros cuadrados de bosque nativo de Chiloé preservados y árboles censados gracias a los amenities y consumos de tu hotel.',
      'descripcion_en', 'Auditable reporting module computing and certifying the square meters of Chiloé native forest protected and geo-tagged trees preserved through your hotel purchases.',
      'badge', 'Métricas ESG Auditables',
      'beneficio_comercial', 'Entrega a tu cadena hotelera reportes oficiales de sostenibilidad y conservación para memorias anuales y certificaciones ambientales.',
      'beneficio_comercial_en', 'Provides official sustainability and conservation metrics for corporate annual reports and environmental hospitality badges.'
    ),
    jsonb_build_object(
      'id', 'modulo-hotel-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Tótems de Buffet Bilingües & Pasaporte Botánico',
      'titulo_en', 'Bilingual Buffet Totems & Botanical Passport',
      'descripcion', 'Códigos QR de alta resolución con detección automática de idioma (español/inglés) para la estación de desayuno, mostrando a turistas internacionales el origen de cada gota.',
      'descripcion_en', 'High-resolution QR codes with automatic language detection (Spanish/English) for breakfast buffet stations, showing international travelers the forest source.',
      'badge', 'Experiencia Bilingüe',
      'beneficio_comercial', 'Elimina los plásticos de un solo uso en el buffet y posiciona el desayuno del hotel como una experiencia gastronómica de nivel mundial.',
      'beneficio_comercial_en', 'Eliminates single-use plastics from the buffet line and elevates hotel breakfast into a world-class gastronomic experience.'
    ),
    jsonb_build_object(
      'id', 'modulo-fiscal',
      'package_name', '@enjambre/fiscal',
      'titulo', 'Facturación Electrónica DTE Automatizada con RUT Empresa',
      'titulo_en', 'Automated Electronic DTE Invoicing with Corporate Tax ID',
      'descripcion', 'Integración contable de emisión directa de facturas exentas y afectas a IVA 19%, órdenes de compra corporativas y despacho programado continuo.',
      'descripcion_en', 'Direct accounting integration issuing electronic tax invoices with Chilean 19% VAT, corporate purchase orders, and scheduled replenishment.',
      'badge', 'Operación Corporativa',
      'beneficio_comercial', 'Simplifica los procesos de compras y finanzas del hotel con conciliación bancaria instantánea y despacho prioritario sin demoras.',
      'beneficio_comercial_en', 'Streamlines procurement and hotel accounting with instant bank reconciliation and uninterrupted priority supply.'
    )
  )
)
WHERE section_key = 'b2b_hoteles';

-- 3. Tiendas Gourmet (b2b_tiendas_gourmet)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Rotación Acelerada & Maridaje Cruzado',
  'strategy_summary', 'Estrategia de exhibición escalonada y maridaje activo junto a quesos maduros y charcutería. La miel deja de ser un producto aislado en estante para convertirse en el acompañante obligado del ticket gourmet.',
  'strategy_ticket_boost', '+$8.500 CLP por ticket de quesos/charcutería',
  'strategy_key_tool', 'Exhibidor Escalonado en Roble & Muestrario de Degustación Activa',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Ubicar el exhibidor escalonado de roble junto a la vitrina de quesos artesanales o panadería noble.',
    'Paso 2: Mantener el muestrario de degustación activo con pequeñas dosis de Ulmo y Tiaca para cata al paso.',
    'Paso 3: Proponer a los clientes el maridaje directo: Miel de Tiaca con queso azul y Ulmo con quesos de cabra.',
    'Paso 4: Ofrecer las cajas de regalo de madera numeradas para regalos corporativos y fechas especiales.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Rotación Acelerada & Maridaje Cruzado',
    'bajada', 'Estrategia de exhibición escalonada y maridaje activo junto a quesos maduros y charcutería. La miel deja de ser un producto aislado en estante para convertirse en el acompañante obligado del ticket gourmet.',
    'aumento_ticket', '+$8.500 CLP por ticket de quesos/charcutería',
    'herramienta_clave', 'Exhibidor Escalonado en Roble & Muestrario de Degustación Activa',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Ubicar el exhibidor escalonado de roble junto a la vitrina de quesos artesanales o panadería noble.',
      'Paso 2: Mantener el muestrario de degustación activo con pequeñas dosis de Ulmo y Tiaca para cata al paso.',
      'Paso 3: Proponer a los clientes el maridaje directo: Miel de Tiaca con queso azul y Ulmo con quesos de cabra.',
      'Paso 4: Ofrecer las cajas de regalo de madera numeradas para regalos corporativos y fechas especiales.'
    )
  ),
  'tools', jsonb_build_array(
    jsonb_build_object(
      'nombre', 'Exhibidor Escalonado en Roble Recuperado',
      'material', 'Roble macizo',
      'rol', 'Góndola',
      'descripcion', 'Mueble de sobremesa de 3 niveles con espacio para 18 frascos y cartela superior grabada.',
      'impacto_ventas', 'Incrementa la visibilidad y triplica la rotación frente al estante común.'
    ),
    jsonb_build_object(
      'nombre', 'Muestrario de Degustación Activa',
      'material', 'Base de avellano con campana de vidrio',
      'rol', 'Mostrador',
      'descripcion', 'Estación higiénica de cata con pocillos de porcelana y palillos biodegradables.',
      'impacto_ventas', 'Convierte a 4 de cada 10 visitantes que prueban la miel.'
    ),
    jsonb_build_object(
      'nombre', 'Cajas de Madera de Tepa Numeradas',
      'material', 'Tepa chilota con serigrafía noble',
      'rol', 'Regalo',
      'descripcion', 'Cajas de embalaje de lujo para frascos de colección con sello lacrado.',
      'impacto_ventas', 'Aumenta el ticket promedio navideño y corporativo un 50%.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-gourmet-vitrina',
      'nombre', 'Vitrina de Autor',
      'badge', 'Rotación Rápida',
      'tier', 'starter',
      'tagline', 'Entrada para Tiendas de Especialidad & Queserías',
      'descripcion', 'Selección inicial equilibrada para emporios gourmet de alta gama que desean incorporar miel cruda chilota sin sobrestock.',
      'precio_neto_clp', 230000,
      'pvp_estimado_clp', 410000,
      'margen_estimado_pct', 44,
      'moq_summary', '1 kit · Reposición por caja cerrada de 12 unidades',
      'sales_strategy', 'Validación de público y rotación rápida en tienda gourmet con degustación dirigida.',
      'recomendado_para', 'Emporios gourmet, queserías y tiendas de vinos boutique.',
      'componentes_fisicos', jsonb_build_array(
        '12x Frasco Hexagonal Miel de Ulmo 300 g',
        '12x Frasco Hexagonal Miel de Tiaca 300 g',
        '6x Miel con Panal Virgen 500 g',
        '6x Frasco Miel de Bosque Nativo 500 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Cuchara mielera de madera de avellano para demostración'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Exhibidor compacto de mostrador en roble reciclado para 12 frascos',
        '20x Fichas botánicas con notas de cata para clientes'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Material gráfico digital para redes sociales de la tienda',
        'Ficha técnica de maridaje con quesos y frutos secos'
      )
    ),
    jsonb_build_object(
      'id', 'kit-gourmet-emporio',
      'nombre', 'Emporio Selecto',
      'badge', 'Más Vendido',
      'tier', 'growth',
      'tagline', 'Góndola Completa & Formatos Familiares',
      'descripcion', 'Variedad completa de floraciones y presentaciones para tiendas consolidadas que buscan posicionar la categoría.',
      'precio_neto_clp', 450000,
      'pvp_estimado_clp', 820000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit · Reposición programada cada 21 días',
      'sales_strategy', 'Maximización de margen con variedad de floraciones y formatos familiares de alto ticket.',
      'recomendado_para', 'Tiendas gourmet de flujo medio, vinotecas y charcuterías.',
      'componentes_fisicos', jsonb_build_array(
        '24x Frasco Hexagonal Miel Ulmo 300 g',
        '18x Frasco Hexagonal Miel Tiaca 300 g',
        '12x Frasco Miel Bosque 500 g',
        '12x Miel con Panal Virgen 500 g',
        '6x Frasco de Miel Reserva 900 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '2x Cucharas de degustación en maderas nativas para catas en tienda'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Exhibidor de sobremesa de 2 niveles en roble de demolición para 24 unidades',
        '1x Tótem de origen con código QR a trazabilidad de lote'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Capacitación express de producto para el equipo de ventas',
        'Inclusión destacada en el mapa de puntos de venta oficiales'
      )
    ),
    jsonb_build_object(
      'id', 'kit-gourmet-coleccion',
      'nombre', 'Colección Maestra de Chiloé',
      'badge', 'Insignia',
      'tier', 'flagship',
      'tagline', 'Exclusividad & Regalo Corporativo Todo el Año',
      'descripcion', 'Mieles de microlote con estuches de madera nativa para clientes exigentes y tiendas ubicadas en zonas turísticas de lujo.',
      'precio_neto_clp', 720000,
      'pvp_estimado_clp', 1350000,
      'margen_estimado_pct', 47,
      'moq_summary', '1 kit bimestral · Envíos asegurados y soporte comercial directo',
      'sales_strategy', 'Venta de lujo y regalos corporativos de fin de año con margen superior al 45%.',
      'recomendado_para', 'Tiendas de lujo, concept stores y aeropuertos.',
      'componentes_fisicos', jsonb_build_array(
        '36x Frasco Miel Ulmo 300 g',
        '24x Frasco Miel Tiaca 300 g',
        '18x Miel con Panal 500 g',
        '12x Frasco Reserva 900 g',
        '12x Cofre de Regalo en Tepa con 3 Variedades'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Set de cata profesional con 4 copas de degustación y tablilla en madera nativa'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Mueble exhibidor de piso modular en maderas nativas de Chiloé',
        '1x Placa de bronce grabada: Punto de Origen Oficial'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Prioridad absoluta en asignación de recolecciones de edición limitada',
        'Soporte directo para cotizaciones corporativas de fin de año'
      )
    ),
    jsonb_build_object(
      'id', 'kit-gourmet-corporativo',
      'nombre', 'Regalos Corporativos',
      'badge', 'Temporada',
      'tier', 'seasonal',
      'tagline', 'Obsequio Territorial Premium para Empresas',
      'descripcion', 'Cajas de regalo de madera nativa con personalización para empresas que buscan un obsequio sustentable y memorable.',
      'precio_neto_clp', 490000,
      'pvp_estimado_clp', 920000,
      'margen_estimado_pct', 47,
      'moq_summary', '1 kit · Tiempo de entrega de 5 a 7 días hábiles',
      'sales_strategy', 'Obsequio institucional memorable y libre de plástico para fechas corporativas clave.',
      'recomendado_para', 'Empresas, agencias, notarías y estudios de abogados.',
      'componentes_fisicos', jsonb_build_array(
        '15x Cofre de Madera de Tepa con 2 Frascos de 300 g + Cuchara de Avellano',
        '10x Cofre de 3 Variedades 150 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '25x Cucharas mieleras en madera de avellano grabadas'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '25x Tarjetas de origen personalizables con logotipo de la empresa aliada'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Opción de grabado láser de logotipo corporativo en la tapa de madera',
        'Enlace privado de seguimiento y trazabilidad para cada destinatario'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-directorio-mapa',
      'package_name', '@enjambre/shop-chrome',
      'titulo', 'Directorio Oficial de Embajadas & Geolocalización',
      'titulo_en', 'Official Partner Directory & Map Geolocation',
      'descripcion', 'Inclusión destacada de tu emporio o tienda en el mapa oficial de puntos de venta de Enjambre Legado. Los comensales que buscan miel cruda en tu ciudad son guiados a tu dirección física.',
      'descripcion_en', 'Featured listing on the official Enjambre Legado partner map. Discerning shoppers searching for raw honey in your city are directed straight to your doorstep.',
      'badge', 'Tráfico Cualificado',
      'beneficio_comercial', 'Canaliza clientes con alta intención de compra directamente a tu tienda física sin costos publicitarios adicionales.',
      'beneficio_comercial_en', 'Channels high-intent gourmet shoppers directly into your retail shop without extra advertising ad spend.'
    ),
    jsonb_build_object(
      'id', 'modulo-tienda-resenas',
      'package_name', '@enjambre/resenas',
      'titulo', 'QR de Reseñas de Mesón & Validación en Góndola',
      'titulo_en', 'Counter Review QR & Shelf Proof Validation',
      'descripcion', 'Material POP inteligente con código QR que muestra a los compradores notas de cata y calificaciones de clientes reales justo en el punto de decisión de compra.',
      'descripcion_en', 'Smart shelf display material linking directly to verified tasting notes and customer ratings right at the point of decision.',
      'badge', 'Conversión Retail',
      'beneficio_comercial', 'Multiplica la velocidad de rotación en estantería al eliminar dudas sobre el sabor o la pureza frente a marcas convencionales.',
      'beneficio_comercial_en', 'Accelerates shelf turnover by eliminating doubts regarding authenticity and taste versus conventional brands.'
    ),
    jsonb_build_object(
      'id', 'modulo-pricing',
      'package_name', '@enjambre/pricing',
      'titulo', 'Motor de Márgenes Escalonados (40%–45%) & Rebates Co-Op',
      'titulo_en', 'Tiered Wholesale Margins (40%–45%) & Co-Op Rebates',
      'descripcion', 'Algoritmo de precios mayoristas con cálculo dinámico de márgenes y asignación automática de fondos de co-marketing al mantener recompras regulares.',
      'descripcion_en', 'Wholesale pricing algorithm calculating real-time margins and allocating co-op marketing rebates for timely store restocks.',
      'badge', 'Rentabilidad Protegida',
      'beneficio_comercial', 'Garantiza un margen comercial protegido superior al 40% y financia degustaciones o publicidad local compartida para tu tienda.',
      'beneficio_comercial_en', 'Guarantees protected 40%+ margins while co-funding in-store tastings and shared local advertising.'
    ),
    jsonb_build_object(
      'id', 'modulo-tienda-sale-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Trazabilidad de Recolección & Certificado Botánico por Lote',
      'titulo_en', 'Harvest Provenance & Batch Botanical Certificate',
      'descripcion', 'Cada frasco en tu vitrina porta un sello de trazabilidad que conecta con los predios protegidos de Chiloé, fecha de recolección y análisis de laboratorio.',
      'descripcion_en', 'Each jar on your display carries a traceability seal linking to the Chiloé protected apiary, collection date, and lab tests.',
      'badge', 'Origen Auténtico',
      'beneficio_comercial', 'Justifica un PVP gourmet de alto valor frente a mieles industriales de supermercado, fidelizando a clientes de paladar exigente.',
      'beneficio_comercial_en', 'Justifies a premium gourmet retail price over supermarket industrial honeys, building loyalty with demanding food lovers.'
    )
  )
)
WHERE section_key = 'b2b_tiendas_gourmet';

-- 4. Ferias (b2b_ferias)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Impacto en Flujo Rápido & Conversión en 45 Segundos',
  'strategy_summary', 'Estructura de stand para ferias gourmet y mercados de productores con alto tráfico peatonal. El cliente degusta en cuchara de madera, visualiza el panal virgen y completa la compra por pack con QR o Transbank en menos de 1 minuto.',
  'strategy_ticket_boost', '+$12.000 CLP por ticket mediante packs de 3 frascos',
  'strategy_key_tool', 'Bandeja Flight de Degustación Portátil & Tótem Inclinado QR',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Colocar la bandeja flight con degustación abierta de Ulmo y Tiaca al borde del flujo peatonal.',
    'Paso 2: Invitar al transeúnte con el gesto: "Prueba una gota de miel cruda de Chiloé recién batida".',
    'Paso 3: Señalar el panal virgen intacto en el atril de roble como garantía irrebatible de pureza silvestre.',
    'Paso 4: Ofrecer la promoción de 3 frascos por $22.000 CLP con cobro inmediato mediante tótem QR.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Impacto en Flujo Rápido & Conversión en 45 Segundos',
    'bajada', 'Estructura de stand para ferias gourmet y mercados de productores con alto tráfico peatonal. El cliente degusta en cuchara de madera, visualiza el panal virgen y completa la compra por pack con QR o Transbank en menos de 1 minuto.',
    'aumento_ticket', '+$12.000 CLP por ticket mediante packs de 3 frascos',
    'herramienta_clave', 'Bandeja Flight de Degustación Portátil & Tótem Inclinado QR',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Colocar la bandeja flight con degustación abierta de Ulmo y Tiaca al borde del flujo peatonal.',
      'Paso 2: Invitar al transeúnte con el gesto: "Prueba una gota de miel cruda de Chiloé recién batida".',
      'Paso 3: Señalar el panal virgen intacto en el atril de roble como garantía irrebatible de pureza silvestre.',
      'Paso 4: Ofrecer la promoción de 3 frascos por $22.000 CLP con cobro inmediato mediante tótem QR.'
    )
  ),
  'tools', jsonb_build_array(
    jsonb_build_object(
      'nombre', 'Bandeja Flight de Degustación Portátil',
      'material', 'Avellano chilote con correa de cuero',
      'rol', 'Frente de stand',
      'descripcion', 'Bandeja suspendida para ofrecer catas al paso sin invadir el espacio.',
      'impacto_ventas', 'Duplica el alcance de degustación en pasillos concurridos.'
    ),
    jsonb_build_object(
      'nombre', 'Tótem Inclinado de Cobro QR',
      'material', 'Roble reciclado',
      'rol', 'Caja',
      'descripcion', 'Soporte ergonómico de mostrador con QR de cobro y reseñas en vivo.',
      'impacto_ventas', 'Agiliza el checkout a menos de 20 segundos.'
    ),
    jsonb_build_object(
      'nombre', 'Exhibidor Plegable de Feria',
      'material', 'Tepa ligera encastrable',
      'rol', 'Stand',
      'descripcion', 'Mueble de 3 niveles que se arma en 2 minutos sin herramientas.',
      'impacto_ventas', 'Optimiza el transporte y la exhibición de hasta 36 frascos.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-feria-stand',
      'nombre', 'Stand de Degustación',
      'badge', 'Fin de Semana',
      'tier', 'starter',
      'tagline', 'Montaje Ágil para Ferias de Fin de Semana',
      'descripcion', 'Todo lo necesario para operar un stand de 2 a 3 días con alta conversión de degustación en venta inmediata.',
      'precio_neto_clp', 280000,
      'pvp_estimado_clp', 520000,
      'margen_estimado_pct', 46,
      'moq_summary', '1 kit por evento · Despacho directo a la sede de la feria',
      'sales_strategy', 'Despliegue veloz y alta liquidez en eventos de 2-3 días.',
      'recomendado_para', 'Operadores de ferias de diseño, mercados gourmet y expos de fin de semana.',
      'componentes_fisicos', jsonb_build_array(
        '24x Frasco Miel Ulmo 300 g',
        '18x Frasco Miel Tiaca 300 g',
        '12x Frasco Miel Bosque 500 g',
        '6x Miel con Panal 500 g',
        '50x Sachets individuales para degustación'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Bandeja de degustación portátil en avellano',
        '100x Palillos biodegradables de bambú para cata'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Exhibidor plegable de mesón en tepa para 24 unidades',
        '1x Tótem de cobro rápido con QR integrado'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Guía de pitch de ventas de 45 segundos para ferias',
        'Material gráfico de soporte para cartelería'
      )
    ),
    jsonb_build_object(
      'id', 'kit-feria-gastronomica',
      'nombre', 'Encuentro Gastronómico',
      'badge', 'Volumen Alto',
      'tier', 'growth',
      'tagline', 'Alto Volumen para Festivales Culinarios y Costumbristas',
      'descripcion', 'Diseñado para eventos masivos con flujo continuo de público donde se requiere gran stock y degustaciones rápidas.',
      'precio_neto_clp', 520000,
      'pvp_estimado_clp', 980000,
      'margen_estimado_pct', 47,
      'moq_summary', '1 kit · Reposición express durante el fin de semana',
      'sales_strategy', 'Venta masiva con ticket promedio optimizado mediante promociones de 2 y 3 frascos.',
      'recomendado_para', 'Ferias gastronómicas mayores, festivales y fiestas costumbristas.',
      'componentes_fisicos', jsonb_build_array(
        '48x Frasco Miel Ulmo 300 g',
        '36x Frasco Miel Tiaca 300 g',
        '24x Miel con Panal 500 g',
        '12x Frasco Reserva 900 g',
        '1x Balde 5 kg para demostraciones'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Soporte de corte de panal en madera nativa',
        '2x Bandejas de degustación para 2 operadores en simultáneo'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '2x Exhibidores modulares de madera encastrables para 48 frascos',
        '2x Tótems de precio y cobro con QR'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Capacitación de cuadrilla de venta para eventos masivos',
        'Logística de reposición express durante el evento'
      )
    ),
    jsonb_build_object(
      'id', 'kit-feria-activacion',
      'nombre', 'Activación Masiva & Recolección',
      'badge', 'Gran Escala',
      'tier', 'flagship',
      'tagline', 'Escenografía Completa y Degustación Guiada',
      'descripcion', 'Montaje escénico con marco de panal real, atril de madera y experiencia inmersiva para ferias de alto impacto.',
      'precio_neto_clp', 890000,
      'pvp_estimado_clp', 1700000,
      'margen_estimado_pct', 48,
      'moq_summary', '1 evento · Montaje coordinado con el equipo técnico',
      'sales_strategy', 'Posicionamiento de marca y venta récord en grandes exposiciones.',
      'recomendado_para', 'Productoras de eventos, ferias internacionales y municipios.',
      'componentes_fisicos', jsonb_build_array(
        '72x Frasco Miel Ulmo 300 g',
        '48x Frasco Miel Tiaca 300 g',
        '36x Miel con Panal 500 g',
        '24x Frasco Reserva 900 g',
        '2x Marcos de Panal Entero'
      ),
      'herramientas_servicio', jsonb_build_array(
        '2x Soportes de panal virgen de exhibición en roble',
        '4x Bandejas de vuelo sensorial de cata'
      ),
      'materiales_exhibicion', jsonb_build_array(
        'Set completo de escenografía de feria en madera nativa',
        '4x Tótems de información botánica de Chiloé'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Acompañamiento en el diseño del espacio ferial',
        'Mención destacada en canales oficiales del Enjambre'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-campo-pos',
      'package_name', 'apps/campo',
      'titulo', 'Terminal POS 100% Offline-First (Dexie DB)',
      'titulo_en', '100% Offline-First POS Engine (Dexie DB)',
      'descripcion', 'Motor de punto de venta optimizado para ferias rurales y pabellones cerrados. Opera sin internet, registrando transacciones localmente con sincronización automática en cola cuando vuelve la red.',
      'descripcion_en', 'Point-of-sale engine engineered for remote rural fairs and enclosed exhibition pavilions. Operates 100% offline with auto-syncing queues.',
      'badge', 'Cero Caídas Offline',
      'beneficio_comercial', 'Nunca pierdes una venta por falta de señal móvil o caída de red en medio de un evento masivo.',
      'beneficio_comercial_en', 'Never lose a high-traffic sale due to poor mobile reception or network outages during crowded expo weekends.'
    ),
    jsonb_build_object(
      'id', 'modulo-sumup',
      'package_name', '@enjambre/sumup',
      'titulo', 'Cobro Rápido con Tarjeta & Pasarela Portátil',
      'titulo_en', 'Express Card Payments & Portable Gateway',
      'descripcion', 'Integración fluida con lectores móviles de tarjeta y soporte de débito/crédito chileno en segundos, reduciendo la fila del stand al mínimo.',
      'descripcion_en', 'Seamless integration with mobile card readers handling Chilean debit/credit in seconds, keeping stand queues ultra-short.',
      'badge', 'Cobro sin Fricción',
      'beneficio_comercial', 'Reduce el tiempo de atención a menos de 45 segundos por transacción, capturando todas las compras de impulso del pasillo.',
      'beneficio_comercial_en', 'Cuts service cycle to under 45 seconds per buyer, capturing every impulse purchase from the passing crowd.'
    ),
    jsonb_build_object(
      'id', 'modulo-ferias-qr',
      'package_name', '@enjambre/sale-qr',
      'titulo', 'Cobro Inmediato con QR & Catas Digitales en Stand',
      'titulo_en', 'Instant QR Payments & In-Booth Digital Tastings',
      'descripcion', 'Tótem inclinado con código QR para pagos directos y registro sensorial guiado mientras el visitante prueba las variedades en la bandeja flight.',
      'descripcion_en', 'Angled totem displaying direct QR payments alongside guided sensory feedback while visitors sample from the tasting flight.',
      'badge', 'Interacción Interactiva',
      'beneficio_comercial', 'Multiplica por 4 las degustaciones efectivas y captura el contacto digital de cada comprador para ventas posteriores.',
      'beneficio_comercial_en', 'Quadruples successful tastings and captures digital contact info from every buyer for post-event reorders.'
    ),
    jsonb_build_object(
      'id', 'modulo-logistica',
      'package_name', '@enjambre/logistica',
      'titulo', 'Reposición Express para Eventos & Alerta de Stock Crítico',
      'titulo_en', 'Event Restock Automation & Stock-Out Alerts',
      'descripcion', 'Monitoreo de inventario con despacho preferente en 24-48 horas para ferias de múltiples días con alta demanda no planificada.',
      'descripcion_en', 'Inventory monitoring with 24-48h rush replenishment for multi-day fairs with unexpected high demand.',
      'badge', 'Respaldo Ininterrumpido',
      'beneficio_comercial', 'Garantiza no quedarse sin producto en el día de mayor asistencia, maximizando la facturación neta de todo el fin de semana.',
      'beneficio_comercial_en', 'Ensures you never run out of inventory during peak foot-traffic days, maximizing gross revenue.'
    )
  )
)
WHERE section_key = 'b2b_ferias';

-- 5. Revendedores (b2b_revendedores)
UPDATE site_content
SET content = content || jsonb_build_object(
  'strategy_title', 'Venta por Recomendación & Micro-Catas Privadas',
  'strategy_summary', 'Estrategia para embajadores territoriales y distribuidores independientes basada en demostración en círculos de confianza, oficinas y pedidos recurrentes quincenales.',
  'ticket_boost', '+$24.000 CLP de utilidad neta por cliente recurrente mensual',
  'strategy_key_tool', 'Maletín de Muestras en Lino y Madera & Catálogo de Bolsillo',
  'strategy_steps', jsonb_build_array(
    'Paso 1: Organizar micro-catas de 15 minutos en reuniones familiares, grupos de trabajo o clubes deportivos.',
    'Paso 2: Mostrar el maletín artesanal con los 3 perfiles de floración y la miel con panal virgen intacto.',
    'Paso 3: Tomar el pedido directo en mano o compartir el link personalizado de revendedor con cobro digital.',
    'Paso 4: Coordinar la entrega quincenal acumulada con despacho bonificado a domicilio.'
  ),
  'commercial_strategy', jsonb_build_object(
    'titulo', 'Venta por Recomendación & Micro-Catas Privadas',
    'bajada', 'Estrategia para embajadores territoriales y distribuidores independientes basada en demostración en círculos de confianza, oficinas y pedidos recurrentes quincenales.',
    'aumento_ticket', '+$24.000 CLP de utilidad neta por cliente recurrente mensual',
    'herramienta_clave', 'Maletín de Muestras en Lino y Madera & Catálogo de Bolsillo',
    'mecanica_ventas', jsonb_build_array(
      'Paso 1: Organizar micro-catas de 15 minutos en reuniones familiares, grupos de trabajo o clubes deportivos.',
      'Paso 2: Mostrar el maletín artesanal con los 3 perfiles de floración y la miel con panal virgen intacto.',
      'Paso 3: Tomar el pedido directo en mano o compartir el link personalizado de revendedor con cobro digital.',
      'Paso 4: Coordinar la entrega quincenal acumulada con despacho bonificado a domicilio.'
    )
  ),
  'tools', jsonb_build_array(
    jsonb_build_object(
      'nombre', 'Maletín de Muestras en Lino y Madera',
      'material', 'Madera de avellano y lino crudo',
      'rol', 'Demostración',
      'descripcion', 'Estuche rígido compacto con 4 frascos de muestra y cucharitas de madera.',
      'impacto_ventas', 'Otorga porte profesional y elegancia en visitas privadas.'
    ),
    jsonb_build_object(
      'nombre', '100 Tarjetas de Presentación QR Personalizadas',
      'material', 'Papel kraft 350g con relieve',
      'rol', 'Contacto',
      'descripcion', 'Tarjetas con código QR vinculado al catálogo digital del revendedor.',
      'impacto_ventas', 'Permite compras recurrentes sin intermediación.'
    ),
    jsonb_build_object(
      'nombre', 'Catálogo de Lujo de Bolsillo',
      'material', 'Impresión editorial en papel mate',
      'rol', 'Presentación',
      'descripcion', 'Folleto desplegable con fotografías de apiarios y fichas botánicas.',
      'impacto_ventas', 'Facilita el cierre de ventas en frío.'
    )
  ),
  'kits', jsonb_build_array(
    jsonb_build_object(
      'id', 'kit-revendedor-inicial',
      'nombre', 'Maletín Inicial de Distribución',
      'badge', 'Primer Paso',
      'tier', 'starter',
      'tagline', 'Kit de Arranque con Material Demostrativo',
      'descripcion', 'El punto de partida perfecto para comenzar a distribuir miel cruda de Chiloé con rentabilidad inmediata entre familiares y conocidos.',
      'precio_neto_clp', 160000,
      'pvp_estimado_clp', 290000,
      'margen_estimado_pct', 45,
      'moq_summary', '1 kit inicial · Retorno de inversión en los primeros 10 días',
      'sales_strategy', 'Retorno de inversión en los primeros 10 días mediante micro-catas con conocidos.',
      'recomendado_para', 'Nuevos embajadores, venta directa y emprendedores gastronómicos.',
      'componentes_fisicos', jsonb_build_array(
        '12x Frasco Miel Ulmo 300 g',
        '6x Frasco Miel Tiaca 300 g',
        '4x Miel con Panal 500 g',
        '3x Frasco Reserva 900 g'
      ),
      'herramientas_servicio', jsonb_build_array(
        '1x Maletín compacto de presentación en madera y lino',
        '3x Cucharas de avellano para catas privadas'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '100x Tarjetas de presentación con QR para pedidos directos',
        '20x Catálogos impresos de bolsillo'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Enlace personal de revendedor en la plataforma',
        'Acceso a grupo de coordinación y material gráfico'
      )
    ),
    jsonb_build_object(
      'id', 'kit-revendedor-rotacion',
      'nombre', 'Stock de Rotación Mensual',
      'badge', 'Más Rentable',
      'tier', 'growth',
      'tagline', 'Reabastecimiento con Margen Creciente',
      'descripcion', 'Paquete de reposición para revendedores activos con clientes fidelizados que compran de forma quincenal o mensual.',
      'precio_neto_clp', 320000,
      'pvp_estimado_clp', 610000,
      'margen_estimado_pct', 48,
      'moq_summary', '1 kit mensual · Despacho bonificado a domicilio',
      'sales_strategy', 'Consolidación de cartera y maximización de margen con recompra fija.',
      'recomendado_para', 'Revendedores con cartera de 15 a 30 clientes regulares.',
      'componentes_fisicos', jsonb_build_array(
        '24x Frasco Miel Ulmo 300 g',
        '18x Frasco Miel Tiaca 300 g',
        '8x Miel con Panal 500 g',
        '6x Frasco Reserva 900 g',
        '12x Sachets 25g muestra'
      ),
      'herramientas_servicio', jsonb_build_array(
        '6x Cucharas mieleras en avellano para obsequiar a mejores clientes'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '1x Mini-exhibidor de sobremesa para colocar en oficinas o locales amigos',
        '50x Catálogos actualizados'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Prioridad en stock en temporadas de alta demanda',
        'Facturación flexible según conveniencia'
      )
    ),
    jsonb_build_object(
      'id', 'kit-revendedor-zonal',
      'nombre', 'Distribuidor Zonal',
      'badge', 'Exclusivo',
      'tier', 'flagship',
      'tagline', 'Escala Regional con Máximo Descuento',
      'descripcion', 'Para líderes de distribución y compras coordinadas con tarifa mayorista preferente y acompañamiento directo.',
      'precio_neto_clp', 650000,
      'pvp_estimado_clp', 1300000,
      'margen_estimado_pct', 50,
      'moq_summary', '1 kit bimestral · Soporte prioritario y zona acordada',
      'sales_strategy', 'Distribución regional con el mayor margen del catálogo y sub-distribuidores.',
      'recomendado_para', 'Distribuidores regionales y líderes de comunidades de consumo.',
      'componentes_fisicos', jsonb_build_array(
        '60x Frasco Miel Ulmo 300 g',
        '36x Frasco Miel Tiaca 300 g',
        '16x Miel con Panal 500 g',
        '12x Frasco Reserva 900 g',
        '24x Cofres de Regalo en Madera'
      ),
      'herramientas_servicio', jsonb_build_array(
        '3x Maletines de presentación para sub-distribuidores o vendedores asociados'
      ),
      'materiales_exhibicion', jsonb_build_array(
        '200x Tarjetas de presentación personalizadas',
        '100x Catálogos de lujo',
        '2x Tótems de mesa'
      ),
      'integraciones_digitales', jsonb_build_array(
        'Exclusividad de zona geográfica acordada',
        'Asistencia comercial directa de la dirección del Enjambre'
      )
    )
  ),
  'code_modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'modulo-portal-embajador',
      'package_name', '@enjambre/auth',
      'titulo', 'Portal Privado de Embajador & Código de Atribución',
      'titulo_en', 'Private Ambassador Portal & Attribution Codes',
      'descripcion', 'Panel digital personal con código único de representación. Cada frasco o tarjeta que entregas enlaza a tu perfil, asegurando comisiones transparentes por cada recompra de tus contactos.',
      'descripcion_en', 'Personal digital portal with dedicated reseller code. Every jar or card you hand out links to your account, securing commissions on every downstream reorder.',
      'badge', 'Comisión Garantizada',
      'beneficio_comercial', 'Construye un ingreso recurrente sin depender de volver a cobrar manualmente: tus clientes recompran en la tienda y la comisión es tuya.',
      'beneficio_comercial_en', 'Builds recurring income without manual debt chasing: your contacts repurchase online and you earn your commission.'
    ),
    jsonb_build_object(
      'id', 'modulo-revendedor-wallet',
      'package_name', '@enjambre/wallet',
      'titulo', 'Pase de Membresía Móvil & Fidelización Automatizada',
      'titulo_en', 'Mobile Membership Pass & Automated Retention',
      'descripcion', 'Tus clientes agregan su tarjeta a Apple Wallet o Google Wallet y acumulan sellos por cada compra que te hacen, motivando la recompra periódica del formato de 500g.',
      'descripcion_en', 'Your clients save their pass to Apple Wallet or Google Wallet, earning reward stamps on every purchase to drive steady 500g reorders.',
      'badge', 'Retención sin Fricción',
      'beneficio_comercial', 'Fideliza a tu círculo cercano con incentivos digitales reales que generan una tasa de recompra cada 3 semanas.',
      'beneficio_comercial_en', 'Retains your network with digital incentives that generate recurring orders every 3 weeks.'
    ),
    jsonb_build_object(
      'id', 'modulo-revendedor-pricing',
      'package_name', '@enjambre/pricing',
      'titulo', 'Bonus de Recompra Rápida & Escala de Márgenes (41%–45%)',
      'titulo_en', 'Rapid Restock Bonus & Margin Scale (41%–45%)',
      'descripcion', 'Sistema que premia la velocidad de rotación: al reponer inventario en menos de 30 días, el motor desbloquea unidades de cortesía y descuentos crecientes.',
      'descripcion_en', 'Turnover incentive system: restock within 30 days and unlock complimentary bonus jars plus progressive volume discounts.',
      'badge', 'Rentabilidad Creciente',
      'beneficio_comercial', 'Aumenta tu ganancia neta por frasco a medida que construyes una base fiel de consumidores en tu comuna.',
      'beneficio_comercial_en', 'Boosts your net profit per jar as you grow a steady customer base in your neighborhood.'
    ),
    jsonb_build_object(
      'id', 'modulo-contable',
      'package_name', '@enjambre/contable',
      'titulo', 'Liquidación Transparente & Respaldo Tributario Inmediato',
      'titulo_en', 'Transparent Settlement & Instant Tax Invoicing',
      'descripcion', 'Módulo contable que genera resúmenes claros de ventas, márgenes obtenidos y emisión de boletas o facturas con un clic.',
      'descripcion_en', 'Accounting module providing clear summaries of sales, realized margins, and one-click receipt and invoice generation.',
      'badge', 'Control Financiero Total',
      'beneficio_comercial', 'Maneja tu negocio independiente con orden financiero impecable, cero enredos y total certeza de tus márgenes de ganancia.',
      'beneficio_comercial_en', 'Run your independent venture with pristine bookkeeping, zero accounting hassles, and complete margin transparency.'
    )
  )
)
WHERE section_key = 'b2b_revendedores';

