export interface MovementStep {
  step: string;
  title: string;
  description: string;
  elements: string[];
}

export interface ExperienceFormat {
  id: 'corporativo' | 'intimo' | 'estacion_origen';
  title: string;
  kicker: string;
  capacity: string;
  duration: string;
  context: string;
  includes: string[];
  summary: string;
  ctaLabel?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ExperienceContent {
  kicker: string;
  title: string;
  subtitle: string;
  editionNote: string;
  heroImage: string;
  biography: {
    name: string;
    location: string;
    trajectoryYears: number;
    paragraphs: string[];
    metrics: Array<{ label: string; value: string }>;
  };
  movements: MovementStep[];
  formats: ExperienceFormat[];
  deferredPurchaseProtocol: {
    headline: string;
    description: string;
    takeawayArtifact: string;
  };
  faq: FaqItem[];
}

export const FLORACIONES_EXPERIENCE: ExperienceContent = {
  kicker: 'Cata Sensorial & Degustación de Autor',
  title: 'Cata y Degustación: Floraciones del Bosque Austral',
  subtitle:
    'Análisis sensorial guiado de mieles nativas y relato de origen sobre la supervivencia de la colmena en el archipiélago de Chiloé. Encuentros para directorios, círculos privados y estaciones territoriales en eventos.',
  editionNote:
    'Edición actual: selección de floraciones nativas de temporada en copas y cucharillas técnicas.',
  heroImage: '/assets/editorial/experiencias.jpg',
  biography: {
    name: 'Cristina Miranda & Equipo Territorial OYZ',
    location: 'Pureo, Queilén · Archipiélago de Chiloé (km 8560)',
    trajectoryYears: 22,
    paragraphs: [
      'Nacida y radicada en la localidad rural de Pureo, comuna de Queilén. Tras años dedicados a la pesca artesanal en los canales chilotes, inició en 2005 la transición hacia la apicultura tras sucesivas crisis en el sector pesquero de la zona.',
      'Sostiene apiarios en un territorio caracterizado por 9 a 10 meses de lluvia al año, humedad constante y vientos del Pacífico sur. Estas condiciones exigen un manejo apícola riguroso y han favorecido la adaptación de abejas con alta resistencia climática, que pecorean en ventanas acotadas de floración en bosque nativo.',
      'Su trabajo con mieles de ulmo, tiaca, melí y bosque templado lluvioso es el pilar de origen del enjambre. La conducción de los encuentros corporativos e íntimos está a cargo de Cristina en persona. Para los módulos de eventos externos, la conducción la lideran miembros del equipo OYZ con dominio territorial directo del bosque y manejo apícola, garantizando precisión técnica sin intermediarios.',
    ],
    metrics: [
      { value: '22 años', label: 'De maestría apícola en Chiloé' },
      { value: '9-10 meses', label: 'Lluvia anual en Pureo' },
      { value: 'km 8560', label: 'Ruta W-855, Queilén' },
      { value: '48–72 h', label: 'Despacho de pedidos diferidos' },
    ],
  },
  movements: [
    {
      step: 'I',
      title: 'Cartografía de Floraciones',
      description:
        'Degustación metódica de mieles monoflorales y de bosque nativo. Examen de color en escala visual, comportamiento de fluidez y textura de cristalización.',
      elements: [
        'Copas y cucharillas técnicas de cata',
        'Floraciones nativas de temporada (Ulmo, Tiaca, Melí, Tineo, bosque templado)',
        'Análisis de acidez, aroma y notas botánicas',
      ],
    },
    {
      step: 'II',
      title: 'Invierno Austral en Pureo',
      description:
        'Relato técnico sobre el ciclo biológico de la colmena bajo precipitaciones continuas. Decisiones de reserva de miel, control de humedad y termorregulación en el nido.',
      elements: [
        'Pecoreo en ventanas climáticas reducidas',
        'Adaptación de abejas en el bosque insular',
        'Diferencias entre miel cruda recolectada en origen y miel procesada industrial',
      ],
    },
    {
      step: 'III',
      title: 'Contrapunto Gastronómico',
      description:
        'Maridaje estructurado para contrarrestar la carga de azúcares y evaluar el comportamiento de la miel en presencia de grasas, sal y acidez.',
      elements: [
        'Quesos maduros de guarda de pequeña producción',
        'Pan de masa madre de fermentación prolongada',
        'Chocolate 85% de origen definido',
        'Agua purificada para limpieza sensorial entre muestras',
      ],
    },
    {
      step: 'IV',
      title: 'Registro y Salida Diferida',
      description:
        'Cierre de la sesión mediante registro individual. Cada participante conserva un artefacto físico con el perfil botánico y notas de la sesión.',
      elements: [
        'Tarjeta de registro sensorial en papel de alta gramaje',
        'Código de sesión único para acceso a catálogo de reserva',
        'Despacho diferido en 48–72 horas a domicilio o empresa',
      ],
    },
  ],
  formats: [
    {
      id: 'corporativo',
      title: 'Encuentro Corporativo & Directorios',
      kicker: 'Empresas, retiros de liderazgo y clientes institucionales',
      capacity: '10 a 20 asistentes',
      duration: '90 a 120 minutos',
      context: 'En dependencias del cliente o sala privada seleccionada (Santiago y regiones).',
      summary:
        'Diseñado para directorios, equipos de liderazgo y recepción de clientes. Una sesión rigurosa de apreciación botánica y conversación sobre sistemas vivos y resiliencia territorial.',
      includes: [
        'Conducción completa a cargo de Cristina Miranda y soporte técnico de OYZ',
        'Set completo de copas, cucharillas y vajilla de cata',
        'Floraciones nativas seleccionadas de la edición',
        'Maridaje de contrapunto (quesos de guarda, masa madre, chocolate 85%)',
        'Tarjetas de registro sensorial para cada asistente',
        'Montaje y desmontaje previo y posterior al encuentro',
      ],
      ctaLabel: 'Cotizar esta modalidad',
    },
    {
      id: 'intimo',
      title: 'Encuentro Íntimo & Residencia',
      kicker: 'Círculos privados y celebraciones de autor',
      capacity: '6 a 10 asistentes',
      duration: '90 minutos',
      context: 'En residencia particular o espacio gastronómico privado en Santiago.',
      summary:
        'Formato acotado para grupos reducidos interesados en análisis sensorial, gastronomía y origen apícola sin intermediarios ni protocolos masivos.',
      includes: [
        'Conducción directa y cercana de Cristina Miranda',
        'Materiales individuales de cata sensorial',
        'Floraciones nativas de temporada',
        'Maridaje de contrapunto seleccionado',
        'Tarjetas de registro sensorial impresas',
        'Protocolo de encargo diferido para asistentes',
      ],
      ctaLabel: 'Cotizar esta modalidad',
    },
    {
      id: 'estacion_origen',
      title: 'Estación de Origen',
      kicker: 'Presencia en tu evento · Módulos externos',
      capacity: 'Abierto · Flujo variable (8 a 12 min por persona)',
      duration: 'Bloque de 2 a 8 horas según agenda anfitriona',
      context: 'Mesa lineal de 180 cm con acceso logístico 90 min antes',
      summary:
        'Para wine clubs, cenas de autor, retiros y eventos donde la miel de bosque chilote opera como contrapunto territorial a lo que ya está en mesa.',
      includes: [
        'Curaduría de 5 a 8 floraciones de contraste sensorial máximo (claras fluidas, densas oscuras, silvestres y cristalizadas)',
        'Conducción técnica por equipo OYZ con dominio territorial (o Cristina Miranda según agenda y traslado)',
        'Maridaje austero de contrapunto (pan de masa madre de fermentación prolongada o queso duro de guarda con sal en escamas; sin chocolate)',
        'Menaje técnico: copas de cata, cucharillas y display de origen',
        'Tarjeta física reducida de alta gramaje con las 5–8 floraciones de la edición y QR al catálogo privado',
        'Protocolo de adquisición diferida sin transacciones comerciales en sala',
      ],
      ctaLabel: 'Consultar disponibilidad',
    },
  ],
  deferredPurchaseProtocol: {
    headline: 'Principio de no-comercialización en sala',
    description:
      'Durante la experiencia no se exhiben precios, no se ofrecen frascos ni se realizan transacciones comerciales. El valor del encuentro radica en la atención y la conversación técnica. Quienes deseen adquirir las mieles catadas disponen de un código de sesión en su tarjeta para encargo diferido con entrega en 48 a 72 horas.',
    takeawayArtifact:
      'Tarjeta física de registro sensorial en papel de alta gramaje con sello de edición y acceso a catálogo privado.',
  },
  faq: [
    {
      question: '¿Por qué no se venden frascos de miel durante la sesión?',
      answer:
        'Para preservar el rigor del encuentro como un espacio de análisis sensorial y aprendizaje, evitando convertir la sesión en una dinámica de venta comercial. La adquisición se canaliza al cierre mediante la tarjeta de registro con entrega coordinada posterior.',
    },
    {
      question: '¿Qué requerimientos espaciales y técnicos se necesitan en el lugar?',
      answer:
        'Únicamente una mesa amplia o mesón donde los asistentes puedan disponer de sus copas, fichas y maridajes con comodidad y buena iluminación. Todo el menaje, vajilla, mantelería neutra e insumos son provistos por el equipo de La Obrera y el Zángano.',
    },
    {
      question: '¿Qué superficie y condiciones de espacio requiere la Estación de Origen?',
      answer:
        'Requiere una mesa lineal o mesón de al menos 180 cm de largo en una zona de buena circulación, con iluminación adecuada y acceso logístico con 90 minutos de anticipación para montaje y atemperado de las 5 a 8 floraciones. OYZ provee el display, copas, cucharillas y mantelería neutra.',
    },
    {
      question: '¿El módulo de Estación de Origen incluye conducción o solo la provisión de muestras?',
      answer:
        'Incluye siempre conducción activa por miembros del equipo OYZ con dominio territorial real del bosque y del manejo apícola, capaces de guiar el recorrido de 8 a 12 minutos por persona y responder consultas botánicas. En fechas coordinadas con su agenda en Santiago o mediante traslado directo desde Pureo, la conducción puede ser realizada personalmente por Cristina Miranda.',
    },
    {
      question: '¿Cuál es la política de disponibilidad y fechas en Santiago?',
      answer:
        'Para resguardar el estándar de origen y el tiempo de dedicación en el apiario de Pureo, la disponibilidad se abre por cupos limitados por temporada en Santiago y no por demanda abierta. Se recomienda consultar disponibilidad con anticipación para reservar dentro de las semanas con presencia en la capital.',
    },
    {
      question: '¿Se produce saturación del paladar al catar múltiples mieles?',
      answer:
        'El diseño del encuentro incluye porciones de mililitros acotadas, tiempos de pausa y maridaje de contrapunto con elementos grasos, fermentados y amargos, además de agua para limpieza sensorial entre cada floración.',
    },
    {
      question: '¿Con cuánta anticipación debe reservarse una fecha?',
      answer:
        'Dado que las sesiones con Cristina Miranda están sujetas a un calendario mensual limitado para resguardar la calidad del encuentro, se recomienda solicitar fecha con al menos 10 a 15 días de antelación.',
    },
  ],
};
