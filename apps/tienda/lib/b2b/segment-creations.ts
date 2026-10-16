import type { B2BSegmentSlug } from './segment-content';

export interface SegmentCreationSlide {
  badge: string;
  kickerLeft: string;
  kickerRight: string;
  title: string;
  subtitle: string;
  quote?: string;
  highlights?: Array<{ label: string; value: string }>;
  footerLeft: string;
  footerRight: string;
}

export interface SegmentRecommendedContent {
  segmentSlug: B2BSegmentSlug;
  segmentName: string;
  headline: string;
  subheadline: string;
  socialCarousel: {
    title: string;
    description: string;
    slides: SegmentCreationSlide[];
    suggestedCaption: string;
    suggestedHashtags: string[];
    suggestedFirstComment: string;
  };
  tabletopKit: {
    title: string;
    subtitle: string;
    dimensions: Array<{ label: string; value: string }>;
    instruction: string;
    qrActionUrl: string;
    qrLabel: string;
  };
  staffBriefing: {
    title: string;
    serviceTips: Array<{ title: string; detail: string }>;
    faqForStaff: Array<{ question: string; answer: string }>;
  };
}

export const SEGMENT_RECOMMENDED_CREATIONS: Record<B2BSegmentSlug, SegmentRecommendedContent> = {
  cafeterias: {
    segmentSlug: 'cafeterias',
    segmentName: 'Cafeterías de Especialidad',
    headline: 'Kit Editorial de Barismo & Material de Servicio',
    subheadline:
      'Contenido visual y pedagógico listo para las redes y mesas de tu cafetería. Explica la armonización entre espresso, cold brew y miel cruda batida en frío sin fricción.',
    socialCarousel: {
      title: 'Carrusel de 6 Láminas: Barismo & Maridaje Sensorial',
      description: 'Secuencia editorial lista para publicar en el feed de Instagram de tu cafetería.',
      slides: [
        {
          badge: 'MARIDAJE SENSORIAL // BARISMO & ALTA GAMA',
          kickerLeft: 'CAFÉ DE ESPECIALIDAD',
          kickerRight: 'MIEL CRUDA VIVA',
          title: 'El café no necesita azúcar refinada. Requiere armonización botánica.',
          subtitle:
            'Una taza con notas cítricas, florales o achocolatadas merece un endulzante vivo que dialogue con su perfil, no un residuo que lo apague.',
          quote: '«La miel no es azúcar: es el concentrado aromático de una floración nativa.»',
          footerLeft: 'obrerayzangano.cl/alianzas/cafeterias',
          footerRight: 'CHILOÉ · 42°S',
        },
        {
          badge: 'ALINEACIÓN DE SERVICIO // 4 CREMAS BATIDAS EN FRÍO',
          kickerLeft: 'CARTA DE MESA',
          kickerRight: 'EXTRACCIÓN LIMPIA',
          title: 'Cuatro perfiles de autor para barra y salón.',
          subtitle:
            'Cada variedad responde a un método de extracción y maridaje específico:',
          highlights: [
            { label: 'MIEL VIRGEN CON PANAL', value: 'Armoniza con té negro, infusiones y bollería de mantequilla' },
            { label: 'AVELLANA TOSTADA Y MOLIDA', value: 'Realza capuccinos, chai latte y tostadas de masa madre' },
            { label: 'NIBS CACAO CRUDO SANTANDER', value: 'Contraste perfecto para espresso doble y flat white' },
            { label: 'POLEN FLORAL', value: 'Potencia yogurt griego, cold brew y bowls matutinos' },
          ],
          footerLeft: 'TALLER APÍCOLA DE CHILOÉ',
          footerRight: 'BATIDO EN FRÍO < 20°C',
        },
        {
          badge: 'PROTOCOLO DE BARRA // SERVICIO TÉCNICO',
          kickerLeft: 'TEMPERATURA & TEXTURA',
          kickerRight: 'SERVICIO EN SALA',
          title: 'Preservar las enzimas vivas en cada preparación.',
          subtitle:
            'Reglas maestras para baristas y equipo de servicio:',
          highlights: [
            { label: 'TEMPERATURA', value: 'Incorporar bajo 40°C para resguardar invertasa y diastasa vivas' },
            { label: 'SERVICIO EN TAZA', value: 'Frasco individual 25g al plato para dosificación libre' },
            { label: 'EMULSIÓN FRÍA', value: 'Diluir con poca agua tibia antes de añadir hielo en cold brew' },
            { label: 'CONSERVACIÓN', value: 'Mantener entre 15°C y 22°C al resguardo de luz directa' },
          ],
          footerLeft: 'ESTÁNDAR DE SERVICIO',
          footerRight: 'ALTA GASTRONOMÍA',
        },
        {
          badge: 'ESCALAS DE OPERACIÓN // FORMATOS DE SERVICIO',
          kickerLeft: 'ROTACIÓN COMERCIAL',
          kickerRight: 'ESPECIALIDAD',
          title: 'Diseñado para la barra, la vitrina y el obrador.',
          subtitle:
            'Formatos adaptados al flujo diario de tu establecimiento:',
          highlights: [
            { label: '25G INDIVIDUAL', value: 'Experiencia de mesa que acompaña la taza servida' },
            { label: '150G VITRINA', value: 'Venta para llevar al comensal que disfrutó la cata' },
            { label: '500G BARRA', value: 'Formato de trabajo continuo para preparación y barismo' },
            { label: 'BALDE 5KG', value: 'Para obradores y repostería de autor con análisis de lote' },
          ],
          footerLeft: 'DISPONIBILIDAD INMEDIATA',
          footerRight: 'FACTURACIÓN ELECTRÓNICA',
        },
        {
          badge: 'VALIDACIÓN EN MESA // PROTOCOLO ST-CATA',
          kickerLeft: 'FIDELIZACIÓN DIGITAL',
          kickerRight: 'PUNTOS DE ORIGEN',
          title: 'Tus comensales califican el maridaje con su teléfono.',
          subtitle:
            'Cada mesa cuenta con un código QR que abre la evaluación sensorial guiada en 30 segundos, acreditando puntos y timbres de bienvenida sin descargar aplicaciones.',
          footerLeft: 'st-cata.obrerayzangano.cl',
          footerRight: 'CATA EN MESA',
        },
        {
          badge: 'ORIGEN SOBERANO // ALIANZA DIRECTA',
          kickerLeft: 'TRAZABILIDAD TOTAL',
          kickerRight: 'CHILOÉ INSULAR',
          title: 'Conexión directa entre la selva fría y tu taza.',
          subtitle:
            'Miel cruda de bosque nativo, sin intermediarios industriales ni mezclas de origen ambiguo. Respaldo analítico y entrega garantizada.',
          footerLeft: 'obrerayzangano.cl/alianzas/cafeterias',
          footerRight: 'ENJAMBRE LEGADO',
        },
      ],
      suggestedCaption: `El café de especialidad no necesita azúcar: merece armonización botánica. ☕🍯

Incorporamos a nuestra barra la selección de miel cruda batida en frío de @enjambrelegado, recolectada en los fiordos de Chiloé por abejas vírgenes en bosque nativo maduro.

✨ 4 cremas de textura sedosa listas para acompañar tu taza:
1. Miel Virgen con Trocito de Panal (infusiones y filtrados limpios)
2. Avellana Chilena Tostada y Molida (capuccino y flat white)
3. Nibs de Cacao Crudo de Santander (espresso y cold brew)
4. Polen Floral (té verde y bowls)

Pruébalas en mesa en su formato de 25g o llévate tu frasco de 150g directo de nuestra vitrina.

📍 Disponible a partir de hoy en nuestra barra.`,
      suggestedHashtags: [
        '#CafeDeEspecialidad',
        '#MaridajeSensorial',
        '#MielCruda',
        '#BarismoChileno',
        '#ChiloeNativo',
        '#AltaGama',
      ],
      suggestedFirstComment:
        'Cada frasco de mesa incluye código QR para evaluar el perfil aromático en el protocolo ST-CATA y acumular puntos en el Club Legado.',
    },
    tabletopKit: {
      title: 'Tarjeta de Mesa: Maridaje de Barismo',
      subtitle: 'Apunta la cámara de tu teléfono para calificar el aroma, notas y cuerpo en 30 segundos.',
      dimensions: [
        { label: 'DULZOR FLORAL', value: '4 / 5' },
        { label: 'ACIDEZ SILVESTRE', value: '3 / 5' },
        { label: 'DENSIDAD EN BOCA', value: '4 / 5' },
        { label: 'FLORACIÓN CLAVE', value: 'Ulmo & Tiaca' },
      ],
      instruction: 'Escanea en mesa para calificar tu degustación, registrar tu paladar y desbloquear beneficios exclusivos.',
      qrActionUrl: 'https://nucleo.obrerayzangano.cl/punto-de-venta/K7X9P2',
      qrLabel: 'CATA EN MESA & BENEFICIOS',
    },
    staffBriefing: {
      title: 'Guía Rápida para Baristas & Personal de Sala',
      serviceTips: [
        {
          title: 'Temperatura máxima 40°C',
          detail: 'Nunca disolver la miel con agua hirviendo. El calor excesivo desnaturaliza las enzimas diastasa e invertasa.',
        },
        {
          title: 'Presentación en bandeja',
          detail: 'Servir el frasco de 25g junto a la cuchara de degustación en el plato de la taza, permitiendo que el cliente dosifique.',
        },
        {
          title: 'Maridaje sugerido con cafés lavados',
          detail: 'Los cafés de tueste medio y origen africano o colombiano potencian la acidez floral brillante de la miel de Tiaca.',
        },
      ],
      faqForStaff: [
        {
          question: '¿Por qué la textura es cremosa y no líquida?',
          answer: 'Es miel cruda batida en frío a menos de 20°C mediante microcristalización mecánica controlada, sin aditivos ni cocción.',
        },
        {
          question: '¿Requiere refrigeración el frasco abierto?',
          answer: 'No. Se conserva a temperatura ambiente (15°C a 22°C) en lugar seco. El frío excesivo endurece la textura untable.',
        },
      ],
    },
  },

  hoteles: {
    segmentSlug: 'hoteles',
    segmentName: 'Hotelería Boutique & Lodges',
    headline: 'Kit Editorial de Bienvenida & Experiencia Huésped',
    subheadline:
      'Láminas visuales y piezas de habitación para posicionar tu servicio de desayuno y amenities en el más alto estándar de conservación territorial.',
    socialCarousel: {
      title: 'Carrusel de 4 Láminas: El Ritual del Bosque en la Habitación',
      description: 'Secuencia editorial para exhibir la propuesta gastronómica y de sustentabilidad de tu hotel.',
      slides: [
        {
          badge: 'HOSPITALITY PATAGÓNICO // RITUAL DE BIENVENIDA',
          kickerLeft: 'AMENITIES DE ORIGEN',
          kickerRight: 'BIENVENIDA DE AUTOR',
          title: 'El lujo territorial se expresa en lo que no está industrializado.',
          subtitle:
            'Recibe a tus huéspedes con miel cruda virgen de la selva fría de Chiloé en su bandeja de llegada y desayuno de autor.',
          quote: '«Una bienvenida auténtica conecta los sentidos con el paisaje que se contempla.»',
          footerLeft: 'obrerayzangano.cl/alianzas/hoteles',
          footerRight: 'CHILOÉ · 42°S',
        },
        {
          badge: 'DESAYUNO DE AUTOR // MONODOSIS DE VIDRIO 25G',
          kickerLeft: 'CARTA MATUTINA',
          kickerRight: 'GASTRONOMÍA LOCAL',
          title: 'Monodosis de vidrio que elevan la mesa.',
          subtitle:
            'Porciones individuales selladas al vacío para acompañar quesos de campo, bollería de masa madre e infusiones nativas.',
          highlights: [
            { label: 'HIGIENE & CONTROL', value: 'Frasco individual hermético con apertura garantizada' },
            { label: 'SOSTENIBILIDAD', value: 'Cero plásticos de un solo uso en el salón de desayuno' },
            { label: 'TEXTURA CREMADA', value: 'Untable perfecto para panes tostados sin escurrir' },
          ],
          footerLeft: 'DESAYUNO DE ORIGEN',
          footerRight: 'HOTEL BOUTIQUE',
        },
        {
          badge: 'BIOMASA AUDITADA // HUELLA TERRITORIAL POSITIVA',
          kickerLeft: 'CONSERVACIÓN ACTIVA',
          kickerRight: 'IMPACTO AUDITABLE',
          title: 'Cada estadía respalda cuencas nativas protegidas.',
          subtitle:
            'Tus huéspedes participan de una apicultura que cuida el dosel maduro de Ulmo y Tiaca, resguardando el agua y la biodiversidad insular.',
          highlights: [
            { label: 'CENSO FORESTAL', value: 'Árboles nativos identificados en cuencas de conservación' },
            { label: 'HUELLA DE CARBONO', value: '2.4 kg CO₂e evitado por cada kilogramo producido' },
          ],
          footerLeft: 'IMPACTO AUDITABLE',
          footerRight: 'SELVA VALDIVIANA',
        },
        {
          badge: 'PASAPORTE DIGITAL // QR EN HABITACIÓN',
          kickerLeft: 'EXPERIENCIA HUÉSPED',
          kickerRight: 'CONEXIÓN DIGITAL',
          title: 'Tus visitantes descubren la historia de su colmena.',
          subtitle:
            'Un código QR discreto en la tarjeta de habitación permite ver el análisis melisopalinológico y el registro geográfico del lote degustado.',
          footerLeft: 'obrerayzangano.cl/trazabilidad',
          footerRight: 'ENJAMBRE LEGADO',
        },
      ],
      suggestedCaption: `En nuestro lodge, el despertar tiene el sabor del bosque lluvioso de Chiloé. 🌿

Presentamos en nuestro desayuno de autor la miel cruda de @enjambrelegado, recolectada en cuencas vírgenes mediante apicultura no trashumante. 

Cada monodosis de vidrio de 25g preserva intactas las enzimas vivas de la floración estival de Ulmo y Tiaca, acompañando nuestros quesos maduros y pan recién horneado.

Un detalle de origen que cuida el territorio. ✨`,
      suggestedHashtags: [
        '#HoteleriaBoutique',
        '#DesayunoDeAutor',
        '#HospitalityChileno',
        '#TurismoSustentable',
        '#MielCruda',
        '#Chiloe',
      ],
      suggestedFirstComment:
        'Monodosis de vidrio 100% reciclables y reutilizables, libres de plásticos de un solo uso.',
    },
    tabletopKit: {
      title: 'Tarjeta de Habitación & Desayuno',
      subtitle: 'Bienvenido a un territorio vivo. Conoce el origen de la miel que acompaña tu mañana.',
      dimensions: [
        { label: 'ORIGEN APÍCOLA', value: 'Cuenca Río Chepu' },
        { label: 'CERTIFICACIÓN', value: 'Miel Cruda Viva' },
        { label: 'FLORACIÓN', value: 'Ulmo & Tiaca' },
        { label: 'HUELLA POSITIVA', value: 'Bosque Nativo' },
      ],
      instruction: 'Apunta la cámara para acceder al pasaporte botánico y certificar la cuenca de recolección.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/trazabilidad?ref=amenity_hotel',
      qrLabel: 'PASAPORTE DE BIENVENIDA',
    },
    staffBriefing: {
      title: 'Protocolo de Servicio para Mucamas & Garzones',
      serviceTips: [
        {
          title: 'Montaje de bandeja matutina',
          detail: 'Disponer el frasco de 25g cerrado junto a la servilleta de lino y la cuchara de madera en la mesa de desayuno.',
        },
        {
          title: 'Explicación al huésped extranjero',
          detail: 'Enfatizar que es "Raw native rainforest honey from Chiloé Island", sin pasteurizar y con alta pureza botánica.',
        },
      ],
      faqForStaff: [
        {
          question: '¿Qué hacer si un huésped desea comprar frascos para llevar?',
          answer: 'Mantener frascos de 150g embalados en recepción para venta directa como souvenir de lujo.',
        },
      ],
    },
  },

  'tiendas-gourmet': {
    segmentSlug: 'tiendas-gourmet',
    segmentName: 'Tiendas Gourmet & Emporios',
    headline: 'Kit Editorial de Vitrina & Criterio Gastronómico',
    subheadline:
      'Material de comunicación visual para atraer al consumidor consciente y educar a tus clientes sobre la miel cruda y la densidad botánica.',
    socialCarousel: {
      title: 'Carrusel de 4 Láminas: Criterio de Cata para Tu Vitrina',
      description: 'Láminas para comunicar por qué una miel cruda de origen certificado tiene mayor valor que una miel industrial.',
      slides: [
        {
          badge: 'CRITERIO DE SELECCIÓN // GASTRONOMÍA CONSCIENTE',
          kickerLeft: 'ALTA DENSIDAD BOTÁNICA',
          kickerRight: 'VITRINA GOURMET',
          title: 'La diferencia entre miel comercial y miel cruda viva.',
          subtitle:
            'Un producto gastronómico noble debe responder a tres principios irrenunciables: origen monofloral, cero pasteurización y análisis de laboratorio accesible.',
          quote: '«El consumidor informado no busca endulzar: busca la medicina y el aroma del bosque.»',
          footerLeft: 'obrerayzangano.cl/alianzas/tiendas-gourmet',
          footerRight: 'CHILOÉ · 42°S',
        },
        {
          badge: 'POR QUÉ CRISTALIZA // LA PRUEBA BIOLÓGICA',
          kickerLeft: 'CRISTALIZACIÓN NATURAL',
          kickerRight: 'ENZIMAS VIVAS',
          title: 'La cristalización no es un defecto: es la firma de pureza.',
          subtitle:
            'Las mieles pasteurizadas a alta temperatura permanecen líquidas porque sus enzimas fueron destruidas. Nuestra miel cristaliza según el balance natural de azúcares de cada flor.',
          highlights: [
            { label: 'ULMO', value: 'Cristalización fina cremosa como mantequilla vegetal' },
            { label: 'TIACA', value: 'Sedosa y de acidez brillante que no apelmaza' },
            { label: 'MELÍ', value: 'Notas balsámicas y resinosas de bosque profundo' },
          ],
          footerLeft: 'ANÁLISIS CERTIFICADO',
          footerRight: 'MIEL VIVA',
        },
        {
          badge: 'FORMATOS DE ALTA ROTACIÓN // 150G Y 500G',
          kickerLeft: 'ESTÁNDAR DE TIENDA',
          kickerRight: 'PACKAGING SOSTENIBLE',
          title: 'Piezas diseñadas para destacar en tu estantería.',
          subtitle:
            'Envase de vidrio pesado con etiqueta de tacto orgánico y lacre vegetal que protege el contenido de la luz.',
          highlights: [
            { label: '150G GOURMET', value: 'Ticket accesible para regalo y degustación personal' },
            { label: '500G FAMILIAR', value: 'Para el consumidor habitual que busca consumo diario consciente' },
          ],
          footerLeft: 'DISTRIBUCIÓN INMEDIATA',
          footerRight: 'TALLER APÍCOLA',
        },
        {
          badge: 'TRAZABILIDAD EN MOSTRADOR // QR EN CADA ETIQUETA',
          kickerLeft: 'SELLO DIGITAL',
          kickerRight: 'CONFIANZA TOTAL',
          title: 'Tu cliente comprueba los análisis con su cámara.',
          subtitle:
            'Al escanear el frasco en tu tienda, el comprador accede al análisis de humedad, porcentaje de polen y cuenca de recolección.',
          footerLeft: 'obrerayzangano.cl/catalogo',
          footerRight: 'ENJAMBRE LEGADO',
        },
      ],
      suggestedCaption: `¿Sabías que una miel que nunca se cristaliza probablemente fue pasteurizada y perdió todas sus enzimas activas? 🐝

Llegó a nuestras estanterías la miel cruda de @enjambrelegado, recolectada en los fiordos de Chiloé sin procesos térmicos que alteren su naturaleza.

🌿 Textura cremosa natural, aroma floral intenso y certificación de análisis físico-químico en cada frasco.

Pruébala en nuestro mesón de degustación y descubre la diferencia de una miel viva.

📍 Te esperamos en nuestra tienda.`,
      suggestedHashtags: [
        '#TiendaGourmet',
        '#MielCruda',
        '#EmporioNacional',
        '#AlimentacionConsciente',
        '#ProductoChileno',
        '#Chiloe',
      ],
      suggestedFirstComment:
        'Disponible en formatos de 150g para regalo y 500g para tu despensa.',
    },
    tabletopKit: {
      title: 'Expositor de Mostrador & Degustación',
      subtitle: 'Miel cruda de bosque nativo. Prueba la textura con una cucharilla limpia.',
      dimensions: [
        { label: 'PROCESO', value: 'Centrifugado en frío' },
        { label: 'PASTEURIZACIÓN', value: '0% (Miel cruda viva)' },
        { label: 'HMEDAD', value: '16.8% (Alta densidad)' },
        { label: 'FLORACIÓN', value: 'Ulmo / Tiaca / Melí' },
      ],
      instruction: 'Escanea el código para conocer los análisis de laboratorio de esta partida.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/catalogo?ref=expositor_tienda',
      qrLabel: 'ANALÍTICA DE LABORATORIO',
    },
    staffBriefing: {
      title: 'Argumentario de Venta para Vendedores de Tienda',
      serviceTips: [
        {
          title: 'Invitar a probar con cucharilla',
          detail: 'El 80% de los clientes que prueban la textura cremada en frío deciden llevar el frasco inmediatamente.',
        },
        {
          title: 'Enfocar en la pureza de origen',
          detail: 'Explicar que las abejas viven en apiarios fijos de bosque nativo en Chiloé, sin trashumancia forzada ni jarabes de azúcar.',
        },
      ],
      faqForStaff: [
        {
          question: '¿Por qué su precio es mayor al supermercado?',
          answer: 'Es miel pura de bosque templado lluvioso madurada naturalmente en colmena, no un jarabe homogeneizado de producción masiva.',
        },
      ],
    },
  },

  ferias: {
    segmentSlug: 'ferias',
    segmentName: 'Ferias & Eventos de Autor',
    headline: 'Kit Editorial de Stand & Venta Presencial',
    subheadline:
      'Piezas visuales de alto impacto para stands de diseño, mercados campesinos y ferias gastronómicas.',
    socialCarousel: {
      title: 'Carrusel de 3 Láminas: Encuentro Directo en Feria',
      description: 'Láminas para anunciar tu participación en ferias y eventos de autor.',
      slides: [
        {
          badge: 'ENCUENTRO EN EL BOSQUE // VENTA DIRECTA',
          kickerLeft: 'FERIAS & EVENTOS',
          kickerRight: 'CHILOÉ DIRECTO',
          title: 'De la colmena nativa a tu mesa sin intermediarios.',
          subtitle:
            'Acompáñanos este fin de semana para degustar las floraciones de la temporada y conocer a quienes resguardan el bosque nativo.',
          footerLeft: 'obrerayzangano.cl/experiencias',
          footerRight: 'PRODUCTOR DIRECTO',
        },
        {
          badge: 'CATA EN VIVO // PROBEMOS JUNTOS',
          kickerLeft: 'DEGUSTACIÓN',
          kickerRight: 'SENSORIAL',
          title: 'Descubre los matices del Ulmo, la Tiaca y el Melí.',
          subtitle:
            'Aprende a reconocer la acidez, el aroma resinoso y el dulzor templado de una miel recolectada en su cenit botánico.',
          footerLeft: 'CATA GUIADA',
          footerRight: 'STAND DE AUTOR',
        },
        {
          badge: 'BENEFICIOS DE FERIA // LLEVA TU SELECCIÓN',
          kickerLeft: 'PROMOCIÓN EXCLUSIVA',
          kickerRight: 'PACKS DE CATA',
          title: 'Kits especiales de degustación por tiempo limitado.',
          subtitle:
            'Lleva tus tríos botánicos y únete al Club Legado para recibir reposición directa en tu puerta.',
          footerLeft: 'obrerayzangano.cl/club',
          footerRight: 'ENJAMBRE LEGADO',
        },
      ],
      suggestedCaption: `¡Nos vemos este fin de semana en la feria! 🍯🌿

Estaremos con el mesón de cata abierto para que pruebes las floraciones estivales de miel cruda batida en frío de @enjambrelegado.

✨ Pasa a saludarnos, prueba las texturas de Ulmo y Tiaca y llévate tu pack con precio preferencial de feria.

📍 Te esperamos en nuestro stand.`,
      suggestedHashtags: ['#FeriaGastronomica', '#MielNativa', '#HechoEnChile', '#Chiloe', '#CataEnVivo'],
      suggestedFirstComment: 'Aceptamos tarjetas de débito/crédito y transferencias al instante.',
    },
    tabletopKit: {
      title: 'Cartel de Stand & Degustación Rápida',
      subtitle: 'Prueba la miel cruda de Chiloé. Escanea para pagar rápido o inscribirte al Club.',
      dimensions: [
        { label: 'RECOLECCIÓN', value: 'Temporada Actual' },
        { label: 'ORIGEN', value: 'Chiloé Insular' },
        { label: 'TRATAMIENTO', value: 'Sin Calor' },
        { label: 'ESTÁNDAR', value: 'Comercio Soberano' },
      ],
      instruction: 'Apunta tu cámara para revisar el catálogo y pagar con Transbank o Flow al instante.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/catalogo?ref=feria_stand',
      qrLabel: 'CATÁLOGO & PAGO RÁPIDO',
    },
    staffBriefing: {
      title: 'Técnica de Atención en Mostrador de Feria',
      serviceTips: [
        {
          title: 'Ofrecer degustación proactivamente',
          detail: 'Acercar una paleta de madera limpia diciendo: "¿Has probado la miel cruda cremada en frío de Chiloé?".',
        },
      ],
      faqForStaff: [
        {
          question: '¿Tienen medios de pago electrónicos?',
          answer: 'Sí, cobro con tarjeta mediante terminal móvil y transferencia directa.',
        },
      ],
    },
  },

  revendedores: {
    segmentSlug: 'revendedores',
    segmentName: 'Embajadores de Marca & Red Comercial',
    headline: 'Kit Editorial de Representación & Escala',
    subheadline:
      'Herramientas de venta, argumentarios y piezas gráficas para representantes comerciales y distribuidores independientes.',
    socialCarousel: {
      title: 'Carrusel de 3 Láminas: Distribución Soberana & Alianza',
      description: 'Láminas para dar a conocer tu rol como distribuidor oficial de origen.',
      slides: [
        {
          badge: 'DISTRIBUCIÓN SOBERANA // ALIANZA COMERCIAL',
          kickerLeft: 'REPRESENTANTE OFICIAL',
          kickerRight: 'CALIDAD GARANTIZADA',
          title: 'Llevamos la miel cruda de Chiloé directo a tu comunidad.',
          subtitle:
            'Como embajador autorizado, acerco productos de recolección limpia con garantía analítica de lote y factura electrónica.',
          footerLeft: 'obrerayzangano.cl/alianzas',
          footerRight: 'RED TERRITORIAL',
        },
        {
          badge: 'GARANTÍA DE ORIGEN // TRAZABILIDAD',
          kickerLeft: 'ANÁLISIS CERTIFICADO',
          kickerRight: '0% INTERMEDIARIOS',
          title: 'Miel viva cosechada con respeto biológico.',
          subtitle:
            'Cada partida que distribuyo cuenta con análisis de laboratorio de humedad, pH, conductividad y polen dominante.',
          footerLeft: 'PASAPORTE AUDITABLE',
          footerRight: 'SELVA FRÍA',
        },
        {
          badge: 'PEDIDOS & REPOSICIÓN // CONTACTO DIRECTO',
          kickerLeft: 'ATENCIÓN PERSONALIZADA',
          kickerRight: 'DESPACHO ÁGIL',
          title: 'Coordina tu pedido familiar o institucional conmigo.',
          subtitle:
            'Formatos de 150g, 500g y cajas surtidas con entrega coordinada y asesoría de consumo.',
          footerLeft: 'obrerayzangano.cl/catalogo',
          footerRight: 'ENJAMBRE LEGADO',
        },
      ],
      suggestedCaption: `Como representante oficial de @enjambrelegado, tengo disponible la nueva partida de miel cruda batida en frío de Chiloé. 🍯

🌿 Sin pasteurizar, con todas sus enzimas activas y análisis botánico certificado.

Escríbeme por mensaje directo para coordinar tu entrega o conocer las opciones de cajas para regalo y consumo familiar. 📦✨`,
      suggestedHashtags: ['#DistribucionOficial', '#MielCruda', '#Chiloe', '#EmprendimientoSoberano', '#GourmetChileno'],
      suggestedFirstComment: 'Entregas coordinadas en tu comuna con empaque seguro y sustentable.',
    },
    tabletopKit: {
      title: 'Ficha de Presentación de Embajador',
      subtitle: 'Representante oficial de La Obrera y el Zángano. Catálogo disponible.',
      dimensions: [
        { label: 'ROL', value: 'Embajador Autorizado' },
        { label: 'STOCK', value: 'Partidas Frescas' },
        { label: 'FACTURA', value: 'Boleta o Factura' },
        { label: 'RESPALDO', value: 'Chiloé Nativo' },
      ],
      instruction: 'Escanea el código para revisar el catálogo y coordinar tu pedido de reposición.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/catalogo?ref=rep_oficial',
      qrLabel: 'CATÁLOGO DE EMBAJADOR',
    },
    staffBriefing: {
      title: 'Estrategia de Cierre y Reposición',
      serviceTips: [
        {
          title: 'Seguimiento a los 30 días',
          detail: 'Contactar a los clientes que compraron un pote de 500g para preguntar cómo estuvo su experiencia y ofrecer reposición.',
        },
      ],
      faqForStaff: [
        {
          question: '¿Cómo gestiono una compra mayorista de empresa?',
          answer: 'Derivar los datos al portal institucional o emitir la cotización desde el portal mayorista con Factura Electrónica.',
        },
      ],
    },
  },
};

export function getSegmentRecommendedCreations(slug: string): SegmentRecommendedContent {
  const normalized = (slug in SEGMENT_RECOMMENDED_CREATIONS ? slug : 'cafeterias') as B2BSegmentSlug;
  return SEGMENT_RECOMMENDED_CREATIONS[normalized];
}
