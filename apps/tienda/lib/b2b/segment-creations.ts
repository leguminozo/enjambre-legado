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
      'Contenido visual y pedagógico listo para las redes y mesas de tu cafetería. Explica el ritual Botanical Sidecar y la cata secuencial en microespátula sin disolver en taza.',
    socialCarousel: {
      title: 'Carrusel de 6 Láminas: Barismo & Ritual Botanical Sidecar',
      description: 'Secuencia editorial lista para publicar en el feed de Instagram de tu cafetería.',
      slides: [
        {
          badge: 'RITUAL BOTANICAL SIDECAR // ALTA GAMA',
          kickerLeft: 'CAFÉ DE ESPECIALIDAD',
          kickerRight: 'RITUAL SIDECAR',
          title: 'El café de especialidad no se endulza en taza. Se acompaña en mesa.',
          subtitle:
            'Una extracción calibrada merece un maridaje botánico secuencial que dialogue con su perfil, sin alterar el pH ni enturbiar la bebida.',
          quote: '«La cata secuencial en microespátula preserva las enzimas vivas (<40°C) y respeta al 100% la extracción del barista.»',
          footerLeft: 'obrerayzangano.cl/alianzas/cafeterias',
          footerRight: 'CHILOÉ · 42°S',
        },
        {
          badge: 'MATRIZ BOTÁNICA // 4 CREMAS BATIDAS EN FRÍO',
          kickerLeft: 'CARTA DE MESA',
          kickerRight: 'MARIDAJE MOLECULAR',
          title: 'Cuatro formulaciones botánicas en 25 g y 150 g.',
          subtitle:
            'Cada variedad responde a un método de extracción y perfil de tueste específico:',
          highlights: [
            { label: 'MIEL VIRGEN CRUDA DE ULMO', value: 'Par exacto para filtrados limpios (V60, Chemex) y procesos Lavados' },
            { label: 'AVELLANA CHILENA GEVUINA', value: 'Sinergia lipídica con microespuma de Flat White y Cappuccino' },
            { label: 'NIBS CACAO CRUDO SANTANDER', value: 'Puente de metilxantinas y crunch para Espresso y Cold Brew' },
            { label: 'POLEN FLORAL NATIVO', value: 'Resonancia de ácido clorogénico con Matcha Bar y tuestes claros' },
          ],
          footerLeft: 'MICROCRISTALIZACIÓN CONTROLADA',
          footerRight: 'BATIDO EN FRÍO < 20°C',
        },
        {
          badge: 'TERMODINÁMICA DE CATA // SERVICIO TÉCNICO',
          kickerLeft: 'TEMPERATURA & TEXTURA',
          kickerRight: 'SERVICIO EN SALA',
          title: 'Preservación enzimática y contraste térmico.',
          subtitle:
            'Protocolo de degustación secuencial para baristas y comensales:',
          highlights: [
            { label: 'TEMPERATURA < 40°C', value: 'Degustar la crema fría en paladar antes del sorbo caliente de café' },
            { label: 'INTEGRIDAD ENZIMÁTICA', value: 'Diastasa 23,1 Schade y glucosa oxidasa 100% activas' },
            { label: 'CLARIDAD EN TAZA', value: 'Cero sedimentación de partículas insolubles ni colapso de crema' },
            { label: 'UPSELL EN MESA', value: 'Pieza de 25 g para servicio que el cliente se lleva consigo a casa' },
          ],
          footerLeft: 'ESTÁNDAR DE ALTA GAMA',
          footerRight: 'BOTANICAL SIDECAR',
        },
        {
          badge: 'ARQUITECTURA COMERCIAL // FORMATOS DE SERVICIO',
          kickerLeft: 'ROTACIÓN COMERCIAL',
          kickerRight: 'ESPECIALIDAD',
          title: 'Dos formatos exactos: Mesa (25 g) y Vitrina (150 g).',
          subtitle:
            'Diseñado para la mesa de servicio y la venta retail de alto margen:',
          highlights: [
            { label: '25 G PIEZA DE MESA', value: 'Formato cilíndrico en bandeja con microespátula de cata' },
            { label: '150 G RESERVA VITRINA', value: 'PVP $9.500 que iguala el ticket de una bolsa de café de 250 g' },
            { label: 'TESTER BONIFICADO', value: 'Frascos de 150 g sin costo para microcatas de 5s en caja' },
            { label: 'CONVERSIÓN CRUZADA', value: 'La degustación en mesa activa la compra por impulso en mesón' },
          ],
          footerLeft: 'DISPONIBILIDAD INMEDIATA',
          footerRight: 'FACTURACIÓN ELECTRÓNICA',
        },
        {
          badge: 'TRAZABILIDAD ANALÍTICA // QR POR LOTE',
          kickerLeft: 'FIDELIZACIÓN DIGITAL',
          kickerRight: 'ORIGEN COMPROBABLE',
          title: 'Trazabilidad analítica QR en cada frasco.',
          subtitle:
            'Cada pieza de 25 g y 150 g integra acceso digital al apiario de origen en Pureo (Queilén, Chiloé), curva melisopalinológica y protocolo de maridaje.',
          footerLeft: 'puro.obrerayzangano.cl',
          footerRight: 'CHILOÉ 42°S',
        },
        {
          badge: 'FIRMA DE ORIGEN // ALIANZA DIRECTA',
          kickerLeft: 'TRAZABILIDAD TOTAL',
          kickerRight: 'BOSQUE NATIVO',
          title: 'La Obrera y el Zángano · Enjambre Legado.',
          subtitle:
            'Miel cruda de bosque templado lluvioso, recolectada por pecoreadoras en ecosistemas prístinos de Chiloé (42°S). Respaldo analítico y entrega garantizada.',
          footerLeft: 'obrerayzangano.cl/alianzas/cafeterias',
          footerRight: 'CHILOÉ INSULAR',
        },
      ],
      suggestedCaption: `Una extracción de origen no se endulza en taza: se acompaña en contrapunto botánico. ☕🌱

Presentamos en barra el ritual «Botanical Sidecar» junto a @enjambrelegado: miel cruda monofloral de bosque valdiviano y chilote (42°S), microcristalizada en frío y servida en frasco de 25 g con microespátula de bambú para cata secuencial alterna.

✨ 4 cremas botánicas para descubrir junto a tu café:
1. Miel Virgen Cruda de Ulmo (23,1 Schade · filtrados lavados, Kenia y Etiopía)
2. Avellana Chilena Gevuina (perfil lípido tostado · flat white y cortado)
3. Nibs de Cacao Crudo Santander (amargor terroso · espresso doble y cold brew)
4. Polen Floral Nativo (grano crujiente y aminoácidos · pour over geisha y matcha)

Pruébala en mesa en formato sidecar (25 g) o lleva tu frasco de vitrina (150 g).

📍 Disponible a partir de hoy en barra.`,
      suggestedHashtags: [
        '#CafeDeEspecialidad',
        '#BotanicalSidecar',
        '#MielCruda',
        '#BarismoDeTerceraOla',
        '#OrigenChiloe',
        '#AltaGama',
      ],
      suggestedFirstComment:
        'Cada pieza de mesa incluye trazabilidad QR al lote botánico, análisis de laboratorio y perfil aromático en el protocolo ST-CATA.',
    },
    tabletopKit: {
      title: 'Tarjeta de Mesa: Protocolo Botanical Sidecar',
      subtitle: 'Guía de cata secuencial en 3 tiempos para disfrutar tu café de especialidad.',
      dimensions: [
        { label: 'ACTIVIDAD ENZIMÁTICA', value: '23,1 Schade' },
        { label: 'TEMPERATURA DE CATA', value: '< 40 °C (Sidecar)' },
        { label: 'REOLOGÍA', value: 'Untable en frío' },
        { label: 'FLORACIÓN CLAVE', value: 'Ulmo & Tiaca (Chiloé 42°S)' },
      ],
      instruction:
        'Toma una microdosis con la espátula, colócala en el paladar y luego bebe tu café para apreciar el contrapunto aromático sin alterar la taza.',
      qrActionUrl: 'https://nucleo.obrerayzangano.cl/punto-de-venta/K7X9P2',
      qrLabel: 'ORIGEN DEL LOTE & TRAZABILIDAD',
    },
    staffBriefing: {
      title: 'Guía Rápida para Baristas & Personal de Barra',
      serviceTips: [
        {
          title: 'Regla de Oro: Jamás dentro de la taza',
          detail:
            'El café se entrega limpio. El frasco de 25 g se sirve en la bandeja junto a la microespátula como «Botanical Sidecar» para cata alterna.',
        },
        {
          title: 'Preservación Enzimática (< 40 °C)',
          detail:
            'Por encima de 40 °C las enzimas bioactivas (diastasa e invertasa) se degradan. El consumo secuencial mantiene las propiedades crudas intactas.',
        },
        {
          title: 'El pitch de 5 segundos al entregar',
          detail:
            '«Te dejamos este Botanical Sidecar de Chiloé: prueba una pizca en la espátula y luego un sorbo de café para sentir el contrapunto floral».',
        },
      ],
      faqForStaff: [
        {
          question: '¿Por qué la textura es cremosa y no líquida?',
          answer:
            'Es miel cruda batida en frío a menos de 20 °C mediante microcristalización mecánica controlada, sin pasteurización ni aditivos.',
        },
        {
          question: '¿Altera la microespuma o la acidez del café?',
          answer:
            'Al consumirse en sidecar fuera de la taza, no altera la acidez titulable ni rompe la tensión superficial de la leche en bebidas lácteas.',
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
          title: 'Miel viva recolectada con respeto biológico.',
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
