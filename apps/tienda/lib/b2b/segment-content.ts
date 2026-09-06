export const B2B_SEGMENTS = [
  "cafeterias",
  "hoteles",
  "tiendas-gourmet",
  "ferias",
  "revendedores",
] as const;

export type B2BSegmentSlug = (typeof B2B_SEGMENTS)[number];

export const SEGMENT_TO_TIPO: Record<B2BSegmentSlug, string> = {
  cafeterias: "cafeteria",
  hoteles: "hotel",
  "tiendas-gourmet": "tienda_gourmet",
  ferias: "feria_evento",
  revendedores: "otro",
};

interface ValueProp {
  icon: string;
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface SegmentSeo {
  title: string;
  description: string;
}

interface Stat {
  value: string;
  label: string;
}

interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

export type B2BSectionId =
  | 'proof'
  | 'value'
  | 'stats'
  | 'process'
  | 'formats'
  | 'leadMagnet'
  | 'products'
  | 'faq'
  | 'form';

export interface SocialProofItem {
  name: string;
  line: string;
  href?: string;
}

export interface SocialProof {
  kicker: string;
  title: string;
  /** Named public points of sale / distributors — only when verified. */
  items?: SocialProofItem[];
  /** Soft brand-presence line (not claiming hotel/café clients). */
  softLine?: string;
}

export interface LeadMagnet {
  fichaTitle: string;
  fichaBlurb: string;
  /** Prefill for wa.me — encode at link time. */
  whatsappText: string;
}

export interface FormatFrame {
  src: string;
  alt: string;
  label: string;
}

export interface B2BSegmentContent {
  slug: B2BSegmentSlug;
  tipo: string;
  kicker: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  valuePropsTitle: string;
  valueProps: ValueProp[];
  stats: Stat[];
  processTitle: string;
  process: ProcessStep[];
  suggestedProductsCopy: string;
  /** Hero CTA label */
  ctaText: string;
  ctaHref: string;
  /** Registration block */
  formKicker: string;
  formTitle: string;
  formIntro: string;
  submitLabel: string;
  faq: FaqItem[];
  seo: SegmentSeo;
  socialProof: SocialProof;
  leadMagnet: LeadMagnet;
  /** Retail public anchor only — never invented wholesale. */
  priceAnchor: string;
  formatImages: FormatFrame[];
  /** After hero; defaults to classic order if omitted. */
  sectionsOrder?: B2BSectionId[];
}


const PRICE_ANCHOR =
  'En tienda, piezas desde $1.290. Precio mayorista / amenities / mix de barra: te lo enviamos al cotizar (<24 h hábiles).';

const FORMAT_IMAGES: FormatFrame[] = [
  {
    src: '/assets/editorial/sachets.png',
    alt: 'Sachets de crema de miel',
    label: '25 g · impulso / amenity',
  },
  {
    src: '/assets/editorial/honey-jar.png',
    alt: 'Frasco de miel cruda',
    label: '150 g · mesa / barra',
  },
  {
    src: '/assets/editorial/immersion.png',
    alt: 'Reserva del bosque',
    label: '500 g · reserva / uso interno',
  },
];

const SOFT_PROOF_LINE =
  'Origen: Pureo, Queilén, Chiloé · +20 años de oficio · Operado con Cristina Miranda';

const GONDOLA_SOFT =
  'También en góndola con aliados como Cabrita Alegre y Mundo Rural — presencia de marca en retail, no un listado de hoteles o cafés.';

export const SEGMENT_CONTENT: Record<B2BSegmentSlug, B2BSegmentContent> = {
  cafeterias: {
    slug: "cafeterias",
    tipo: "cafeteria",
    kicker: "PARA CAFETERÍAS DE ESPECIALIDAD",
    headline: "Pequeñas creaciones para una gran taza.",
    subheadline:
      "Cuatro cremas de miel cruda de Chiloé, batidas en frío y servidas en frascos de 25 g. Bosque, colmena, cacao y avellana en una pieza de mesa que transforma una infusión en un gesto de origen.",
    heroImage: "/images/b2b/hero-cafeterias.jpg",
    valuePropsTitle: "Cuatro creaciones para tu barra",
    processTitle: "Formatos que tu barra puede rotar",
    valueProps: [
      {
        icon: "Package",
        title: "Crema de Miel Cruda",
        description:
          "Floral, delicada y profunda; hecha para abrirse junto a una taza y dejar que el bosque hable primero. Ideal para: té negro, infusiones florales, mantequilla, croissants y tostadas.",
      },
      {
        icon: "Coffee",
        title: "Crema de Miel + Avellana",
        description:
          "Miel cruda de Chiloé y avellana chilena tostada. Dulzor floral y calidez terrosa. No es una crema dulce convencional. Ideal para: capuccino, chai, bollería de mantequilla, tostadas y yogurt.",
      },
      {
        icon: "Droplets",
        title: "Crema de Miel + Cacao",
        description:
          "Miel cruda de bosque nativo y nibs de cacao molidos de Santander. Una crema de profundidad limpia, sin azúcar añadida. Ideal para: espresso, mocaccino, café filtrado, pan brioche.",
      },
      {
        icon: "Flower2",
        title: "Crema de Miel + Polen",
        description:
          "La suavidad cremosa encuentra pequeños granos dorados de la colmena de Pureo: una textura viva, floral y terrosa. Ideal para: té verde, infusiones herbales, yogurt, granola.",
      },
    ],
    stats: [
      { value: "25 g", label: "Pieza de mesa" },
      { value: "150 g", label: "Reserva para llevar" },
      { value: "500 g", label: "Uso interno de barra" },
      { value: "Mix", label: "Trazabilidad y origen" },
    ],
    process: [
      {
        step: "01",
        title: "25 g — Pieza de mesa",
        desc: "Para una infusión, croissant o regalo de salida. El cliente lo abre en el local; el frasco mantiene valor visual y puede llevarse.",
      },
      {
        step: "02",
        title: "150 g — Reserva para llevar",
        desc: "Para vender desde la barra. Es la continuidad doméstica de una experiencia que comenzó con una taza.",
      },
      {
        step: "03",
        title: "500 g — Uso interno de barra",
        desc: "Cocina, repostería y degustación del staff para que conozcan la base del producto y recomienden cada creación con propiedad.",
      },
    ],
    suggestedProductsCopy:
      "CREACIONES PARA LA BARRA. Cada creación comienza con crema de miel cruda de Chiloé y se abre hacia un segundo ingrediente cuidadosamente elegido. No son sabores añadidos para distraer: son encuentros de textura, origen y tiempo.",
    ctaText: "Cotizar mix para mi barra",
    ctaHref: "#registro",
    formKicker: "Cotización",
    formTitle: "Armemos el mix de tu barra",
    formIntro:
      "Cuéntanos de tu cafetería. Te respondemos en menos de 24 horas hábiles con una propuesta de formatos y rotación — sin compromiso de antemano.",
    submitLabel: "Pedir propuesta",
    faq: [
      {
        question: "Ingredientes y Alérgenos",
        answer:
          "Las preparaciones se formulan y etiquetan bajo el Reglamento Sanitario (ej: 'Crema de miel cruda de bosque nativo, avellana chilena tostada y molida'). Las variantes Avellana y Polen contienen alérgenos. La variante Cacao puede contener trazas. No son aptas para menores de 12 meses.",
      },
      {
        question: "Vida útil y Almacenamiento",
        answer:
          "A diferencia de una miel genérica, cada crema tiene una condición de almacenamiento y fecha de vencimiento validada por su estabilidad física, previniendo alteraciones por humedad y oxidación de sus adiciones naturales.",
      },
      {
        question: "¿Cómo definimos el mix?",
        answer:
          "Una barra no necesita más productos, necesita mejores gestos. En la cotización afinamos contigo formatos (25 g / 150 g / 500 g), frecuencia de abastecimiento y, si aplica, una edición de casa o trazabilidad QR.",
      },
    ],
    socialProof: {
      kicker: "Origen",
      title: "Del bosque a la taza",
      softLine: `${SOFT_PROOF_LINE}. ${GONDOLA_SOFT}`,
    },
    leadMagnet: {
      fichaTitle: "Ficha 1 página · Cafeterías",
      fichaBlurb:
        "Mix de barra en 25 g / 150 g / 500 g, cuatro cremas de miel cruda y propuesta en menos de 24 h hábiles.",
      whatsappText:
        "Hola OyZ — soy de una cafetería. Quisiera cotizar mix/precios de cremas de miel (25/150/500 g) para barra.",
    },
    priceAnchor: PRICE_ANCHOR,
    formatImages: FORMAT_IMAGES,
    sectionsOrder: ['value', 'formats', 'stats', 'process', 'leadMagnet', 'proof', 'products', 'faq', 'form'],
    seo: {
      title: "Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano",
      description:
        "Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen.",
    },
  },

  hoteles: {
    slug: "hoteles",
    tipo: "hotel",
    kicker: "PARA HOTELES Y HOSPEDAJES",
    headline: "Un detalle de bosque en la mesa del huésped",
    subheadline:
      "Mini frascos de 25 g con tapa dorada para welcome pack, desayuno o room service. Un gesto de origen que se lleva a casa — no un amenity genérico.",
    heroImage: "/images/b2b/hero-hoteles.jpg",
    valuePropsTitle: "Amenities de 25 g con historia de origen",
    processTitle: "Del welcome pack a la reposición",
    valueProps: [
      {
        icon: "Hotel",
        title: "Amenity con historia",
        description:
          "Pequeños frascos de 25 g que elevan la percepción del desayuno, el room service o el welcome pack. El huésped prueba el bosque nativo de Chiloé.",
      },
      {
        icon: "Palette",
        title: "Marca conjunta (opcional)",
        description:
          "Si tu operación lo pide, evaluamos integrar la insignia del hotel en un área dedicada de la etiqueta. Se cotiza aparte; no es requisito para empezar.",
      },
      {
        icon: "BarChart3",
        title: "Cata digital en el QR",
        description:
          "Cuando el lote lo incluye, el huésped puede escanear un QR y registrar aroma, sabor y notas. Es una capa opcional de experiencia, no un sistema obligatorio.",
      },
      {
        icon: "Leaf",
        title: "Conservación en marcha",
        description:
          "Tu compra sostiene un proyecto de trazabilidad forestal en desarrollo en Pureo. Hoy no entregamos reportes de impacto cerrados; sí te contamos el avance con honestidad.",
      },
    ],
    stats: [
      { value: "25 g", label: "Formato amenity" },
      { value: "QR", label: "Cata opcional" },
      { value: "Co-brand", label: "Upgrade a cotizar" },
      { value: "Bosque", label: "Origen Chiloé" },
    ],
    process: [
      {
        step: "01",
        title: "Volumen y uso",
        desc: "Definimos si el frasco va a welcome pack, desayuno buffet o habitación, y el ritmo mensual realista para tu ocupación.",
      },
      {
        step: "02",
        title: "Personalización (opcional)",
        desc: "Si quieres co-branding, lo evaluamos y cotizamos aparte. Puedes empezar con la etiqueta estándar.",
      },
      {
        step: "03",
        title: "Despacho recurrente",
        desc: "Coordinamos reposición según tu calendario. Sin umbrales inventados: te explicamos condiciones al cotizar.",
      },
    ],
    suggestedProductsCopy:
      "El formato ideal como amenity es el frasco de 25 g con tapa dorada. También proveemos formatos mayores para cocina o buffet, según el servicio del hotel.",
    ctaText: "Pedir propuesta para amenities",
    ctaHref: "#registro",
    formKicker: "Propuesta",
    formTitle: "Cotiza amenities para tu hotel",
    formIntro:
      "Indica ciudad, tipo de hospedaje y uso previsto (welcome / desayuno / habitación). Te respondemos en menos de 24 horas hábiles.",
    submitLabel: "Pedir propuesta",
    faq: [
      {
        question: "¿Es posible personalizar los frascos de 25 g con nuestra marca?",
        answer:
          "Sí, como servicio opcional. Por un coste adicional integramos tu logo en un área dedicada de la etiqueta. No es requisito: mucha operación empieza con la etiqueta estándar.",
      },
      {
        question: "¿Qué es la cata digital?",
        answer:
          "Cuando el lote lo incluye, el huésped escanea un código y registra su percepción (textura, notas, etc.). Es una capa de experiencia turística; te contamos disponibilidad al cotizar.",
      },
      {
        question: "¿Tienen reportes de impacto ambiental?",
        answer:
          "La trazabilidad forestal está en construcción. No prometemos huella de carbono cerrada hoy. Tu compra ayuda a financiar el desarrollo; compartimos avances con aliados cuando hay datos reales.",
      },
    ],
    socialProof: {
      kicker: "Origen",
      title: "Un gesto de Chiloé en la habitación",
      softLine: SOFT_PROOF_LINE,
    },
    leadMagnet: {
      fichaTitle: "Ficha 1 página · Hoteles",
      fichaBlurb:
        "Amenity 25 g con tapa dorada, co-branding opcional y propuesta según ocupación — respuesta <24 h hábiles.",
      whatsappText:
        "Hola OyZ — soy de un hotel/hospedaje. Quisiera cotizar amenities 25 g y mix/precios para welcome o desayuno.",
    },
    priceAnchor: PRICE_ANCHOR,
    formatImages: FORMAT_IMAGES,
    sectionsOrder: ['value', 'formats', 'stats', 'process', 'leadMagnet', 'products', 'proof', 'faq', 'form'],
    seo: {
      title: "Amenities de Miel para Hoteles · La Obrera y el Zángano",
      description:
        "Mini frascos de 25 g de miel cruda como amenity premium para hoteles. Origen Chiloé, co-branding opcional y propuesta a medida.",
    },
  },

  "tiendas-gourmet": {
    slug: "tiendas-gourmet",
    tipo: "tienda_gourmet",
    kicker: "PARA TIENDAS GOURMET Y ESPECIALIDAD",
    headline: "El frasco que tus clientes buscan en góndola",
    subheadline:
      "Miel cruda de bosque nativo con lote y origen visibles. Formatos de impulso, mesa y reserva — y material de apoyo para que la historia se cuente sola.",
    heroImage: "/images/b2b/hero-tiendas-gourmet.jpg",
    valuePropsTitle: "Lo que tu góndola necesita contar",
    processTitle: "De surtido inicial a reposición con criterio",
    valueProps: [
      {
        icon: "Shield",
        title: "Trazabilidad de lote",
        description:
          "Cada frasco lleva número de lote y origen. Tu cliente sabe qué está comprando; tú demuestras cuidado en el estante.",
      },
      {
        icon: "Award",
        title: "Apoyo comercial según rotación",
        description:
          "Según volumen y rotación, podemos conversar apoyo de activación local (degustación, material, difusión). Te explicamos umbrales al cotizar — sin fondos inventados ni letras chicas.",
      },
      {
        icon: "Users",
        title: "Set de entrada y pack digital",
        description:
          "El primer pedido puede incluir material impreso y un pack digital listo para redes y góndola. Lo armamos contigo según el espacio.",
      },
      {
        icon: "Package",
        title: "Línea completa en anaquel",
        description:
          "Mini 25 g para regalo e impulso, 150 g para la mesa diaria y 500 g Reserva del Bosque para quienes ya conocen la marca.",
      },
    ],
    stats: [
      { value: "25 g", label: "Impulso / regalo" },
      { value: "150 g", label: "Mesa diaria" },
      { value: "500 g", label: "Reserva" },
      { value: "Pack", label: "Apoyo digital" },
    ],
    process: [
      {
        step: "01",
        title: "Surtido inicial",
        desc: "Proponemos un mix pensado para rotar en tu tipología de tienda, con pack digital de apoyo.",
      },
      {
        step: "02",
        title: "Puesta en góndola",
        desc: "Material y copy listos para estante y redes. Si hay QR de cata en el lote, lo activamos contigo.",
      },
      {
        step: "03",
        title: "Reposición con criterio",
        desc: "Según cómo rote, afinamos surtido y eventual apoyo comercial. Umbrales claros al cotizar, no promesas abiertas.",
      },
    ],
    suggestedProductsCopy:
      "Para retail gourmet recomendamos el espectro completo: mini 25 g para impulso/regalos, 150 g para mesa y 500 g para quienes ya buscan Reserva del Bosque.",
    ctaText: "Cotizar surtido para góndola",
    ctaHref: "#registro",
    formKicker: "Cotización",
    formTitle: "Propuesta para tu tienda",
    formIntro:
      "Cuéntanos ciudad, tamaño de góndola y si ya trabajas mieles de origen. Te respondemos en menos de 24 horas hábiles.",
    submitLabel: "Cotizar mix",
    faq: [
      {
        question: "¿Hay apoyo de co-marketing?",
        answer:
          "Según volumen y rotación, podemos conversar apoyo concreto (degustación, material, difusión local). No hay un fondo automático ni un porcentaje mágico: te explicamos umbrales al cotizar.",
      },
      {
        question: "¿Qué incluye el pack digital?",
        answer:
          "Fotografías, piezas cortas e historias del bosque listas para redes. Lo enviamos con el set de entrada o al activar la cuenta, según lo acordado.",
      },
      {
        question: "¿Ofrecen exclusividad territorial?",
        answer:
          "En zonas donde tiene sentido, podemos conversar exclusividad acotada para aliados con compromiso sostenido. No es un default: se define caso a caso en la propuesta.",
      },
    ],
    socialProof: {
      kicker: "En góndola hoy",
      title: "Aliados que ya venden OyZ",
      items: [
        {
          name: "Cabrita Alegre",
          line: "Ñuñoa / Placilla — sachets de La Obrera y el Zángano en góndola.",
          href: "https://cabritaalegre.cl",
        },
        {
          name: "Mundo Rural MEM",
          line: "Escuela Militar / Las Condes — distribución y punto de venta.",
          href: "https://mundoruralmem.cl",
        },
      ],
      softLine: SOFT_PROOF_LINE,
    },
    leadMagnet: {
      fichaTitle: "Ficha 1 página · Tiendas gourmet",
      fichaBlurb:
        "Surtido 25 / 150 / 500 g, trazabilidad de lote y apoyo digital según rotación.",
      whatsappText:
        "Hola OyZ — tengo una tienda gourmet. Quisiera cotizar surtido/mix y precios mayoristas para góndola.",
    },
    priceAnchor: PRICE_ANCHOR,
    formatImages: FORMAT_IMAGES,
    sectionsOrder: ['proof', 'value', 'formats', 'stats', 'process', 'leadMagnet', 'products', 'faq', 'form'],
    seo: {
      title: "Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano",
      description:
        "Miel cruda para tiendas gourmet. Trazabilidad de lote, formatos 25 g, 150 g y 500 g, y apoyo comercial según rotación.",
    },
  },

  ferias: {
    slug: "ferias",
    tipo: "feria_evento",
    kicker: "PARA FERIAS, MERCADOS Y EVENTOS",
    headline: "Del bosque al encuentro — listo para el stand",
    subheadline:
      "Mini frascos de 25 g que se venden a primera vista, más material de mesa para que el origen se explique solo entre visitas y degustaciones.",
    heroImage: "/images/b2b/hero-ferias.jpg",
    valuePropsTitle: "Kit de stand que se explica solo",
    processTitle: "De la fecha del evento al encuentro",
    valueProps: [
      {
        icon: "Package",
        title: "Magneto de miradas",
        description:
          "Los mini frascos de 25 g con tapa dorada son la compra por impulso natural en ferias: precio accesible, regalo fácil, historia visible.",
      },
      {
        icon: "TrendingUp",
        title: "Mix por tipo de evento",
        description:
          "No es el mismo surtido para una feria rural de un día que para un mercado de fin de semana. Armamos cantidades según aforo y duración.",
      },
      {
        icon: "BarChart3",
        title: "QR de cata en stand (si aplica)",
        description:
          "Cuando el lote lo incluye, los visitantes pueden escanear, opinar y dejarte un rastro de interés. Útil; no obligatorio para vender bien.",
      },
      {
        icon: "ShoppingBag",
        title: "Material de stand",
        description:
          "Displays, tarjetas y piezas gráficas para que el stand cuente Pureo y el bosque nativo sin que tengas que repetir el mismo discurso todo el día.",
      },
    ],
    stats: [
      { value: "25 g", label: "Compra de impulso" },
      { value: "Mix", label: "Por tipo de evento" },
      { value: "Stand", label: "Material de apoyo" },
      { value: "QR", label: "Cata opcional" },
    ],
    process: [
      {
        step: "01",
        title: "Fecha y escala",
        desc: "Nos cuentas fecha, lugar y tamaño estimado del evento. Proponemos mix y cantidades realistas.",
      },
      {
        step: "02",
        title: "Equipo de stand",
        desc: "Despachamos frascos y material de exhibición a tiempo para montaje.",
      },
      {
        step: "03",
        title: "En el encuentro",
        desc: "Vendes, degustas y — si hay QR en el lote — capturas interés. Después afinamos el próximo evento.",
      },
    ],
    suggestedProductsCopy:
      "Para eventos priorizamos mini frascos de 25 g (impulso y regalo). Sumamos 150 g si el público busca llevarse a casa, según el perfil de la feria.",
    ctaText: "Pedir propuesta para mi feria",
    ctaHref: "#registro",
    formKicker: "Evento",
    formTitle: "Arma el kit de tu próxima feria",
    formIntro:
      "Indica fecha, ciudad y tipo de evento. Te respondemos en menos de 24 horas hábiles con mix y cantidades sugeridas.",
    submitLabel: "Pedir propuesta",
    faq: [
      {
        question: "¿Qué recomiendan para una feria?",
        answer:
          "En la mayoría de stands, los mini 25 g con tapa dorada. Llaman la atención, tienen precio de impulso y permiten probar o regalar. El resto del mix depende del público.",
      },
      {
        question: "¿Cómo uso el QR en una feria?",
        answer:
          "Si el lote incluye QR de cata, lo colocas visible en el stand. Quienes prueban pueden registrar opinión. No sustituye la conversación en mesa; la complementa.",
      },
      {
        question: "¿Hay stock bonificado por evento?",
        answer:
          "Según volumen y rotación entre eventos, podemos conversar condiciones de reposición. Te explicamos umbrales al cotizar; no hay un contador automático opaco.",
      },
    ],
    socialProof: {
      kicker: "Origen",
      title: "Listo para el encuentro",
      softLine: `${SOFT_PROOF_LINE}. ${GONDOLA_SOFT}`,
    },
    leadMagnet: {
      fichaTitle: "Ficha 1 página · Ferias y eventos",
      fichaBlurb:
        "Mini 25 g de impulso, material de stand y mix según aforo — propuesta <24 h hábiles.",
      whatsappText:
        "Hola OyZ — armo stand en feria/evento. Quisiera cotizar kit, mix 25 g y precios para el próximo encuentro.",
    },
    priceAnchor: PRICE_ANCHOR,
    formatImages: FORMAT_IMAGES,
    sectionsOrder: ['products', 'formats', 'value', 'stats', 'process', 'leadMagnet', 'proof', 'faq', 'form'],
    seo: {
      title: "Miel para Ferias y Eventos · La Obrera y el Zángano",
      description:
        "Venta directa de miel cruda en ferias. Mini frascos de 25 g para impulso, material de stand y propuesta según el evento.",
    },
  },

  revendedores: {
    slug: "revendedores",
    tipo: "otro",
    kicker: "PARA REVENDEDORES Y MICROCANALES",
    headline: "Lleva el bosque a tu propia red",
    subheadline:
      "Distribuye miel cruda de Chiloé desde tu espacio — feria, frutería, tienda o canal digital — con pack de apoyo y condiciones claras según cómo rotes.",
    heroImage: "/images/b2b/hero-revendedores.jpg",
    valuePropsTitle: "Tu canal, con material y condiciones claras",
    processTitle: "Del registro a la primera reposición",
    valueProps: [
      {
        icon: "TrendingUp",
        title: "Condiciones según rotación",
        description:
          "Si agotas y repones con buen ritmo, conversamos mejores condiciones. Según volumen y rotación, te explicamos umbrales al cotizar — sin plazos inventados ni letras X.",
      },
      {
        icon: "Users",
        title: "Fidelización de tus clientes",
        description:
          "Cuando activamos el canal, tus clientes pueden vincularse a tu código y acumular sellos. El software lo proveemos nosotros; el vínculo queda contigo.",
      },
      {
        icon: "Package",
        title: "Set de entrada y pack digital",
        description:
          "Tu primera orden puede incluir fotos y textos listos para WhatsApp o Instagram. Empiezas a vender con material de marca, no con capturas improvisadas.",
      },
      {
        icon: "Award",
        title: "Escala con transparencia",
        description:
          "A mayor volumen y constancia, mejores condiciones. Te las contamos en la propuesta, con umbrales claros — sin cajas negras ni promesas vacías.",
      },
    ],
    stats: [
      { value: "25 g", label: "Packs de regalo" },
      { value: "150 g", label: "Mesa diaria" },
      { value: "500 g", label: "Hogar / reserva" },
      { value: "Pack", label: "Apoyo digital" },
    ],
    process: [
      {
        step: "01",
        title: "Cuéntanos tu canal",
        desc: "Registro breve: quién eres, dónde vendes y cómo llegas a tus clientes. Sin inversión mínima obligatoria para conversar.",
      },
      {
        step: "02",
        title: "Propuesta y set",
        desc: "Te enviamos mix sugerido, condiciones y — al activar — pack digital de ventas.",
      },
      {
        step: "03",
        title: "Vende y repón",
        desc: "Ofreces los frascos; si hay código de canal, tus clientes se vinculan a ti. Repones según tu ritmo real.",
      },
    ],
    suggestedProductsCopy:
      "Quienes revenden suelen armar packs de regalo con mini 25 g y abastecer hogares con 150 g y 500 g. Afinamos el mix a tu canal.",
    ctaText: "Pedir propuesta de inicio",
    ctaHref: "#registro",
    formKicker: "Inicio",
    formTitle: "Empieza a distribuir con nosotros",
    formIntro:
      "Déjanos tu nombre, canal y WhatsApp. Te respondemos en menos de 24 horas hábiles con una propuesta clara — sin compromiso de antemano.",
    submitLabel: "Pedir propuesta",
    faq: [
      {
        question: "¿Hay beneficio por reponer rápido?",
        answer:
          "Sí, podemos reconocer buena rotación. Según volumen y ritmo de reposición, te explicamos umbrales al cotizar. No hay un contador oculto ni plazos genéricos inventados.",
      },
      {
        question: "¿Cómo mis clientes se vinculan a mí?",
        answer:
          "Al activar el canal te damos un código (QR). Cuando entregas un frasco, el cliente puede escanearlo, evaluar la miel y acumular sellos asociados a ti. Te detallamos el flujo al activar.",
      },
      {
        question: "¿Qué incluye el pack digital?",
        answer:
          "Fotografías de producto, textos de venta e historias del bosque listas para WhatsApp, Instagram o Facebook. Llega con la activación o el set de entrada, según lo acordado.",
      },
    ],
    socialProof: {
      kicker: "Origen",
      title: "Red de microcanales con oficio",
      softLine: `${SOFT_PROOF_LINE}. ${GONDOLA_SOFT}`,
    },
    leadMagnet: {
      fichaTitle: "Ficha 1 página · Revendedores",
      fichaBlurb:
        "Pack de entrada, mix 25/150/500 g y condiciones según rotación — sin letras inventadas.",
      whatsappText:
        "Hola OyZ — quiero revender. Quisiera cotizar mix/precios y condiciones de inicio para mi canal.",
    },
    priceAnchor: PRICE_ANCHOR,
    formatImages: FORMAT_IMAGES,
    sectionsOrder: ['value', 'formats', 'stats', 'process', 'leadMagnet', 'products', 'proof', 'faq', 'form'],
    seo: {
      title: "Programa de Revendedores · La Obrera y el Zángano",
      description:
        "Revende miel cruda de Chiloé. Pack digital, condiciones según rotación y propuesta clara en menos de 24 horas hábiles.",
    },
  },
};

export function isValidSegment(slug: string): slug is B2BSegmentSlug {
  return (B2B_SEGMENTS as readonly string[]).includes(slug);
}

export function getSegmentContent(
  slug: string,
): B2BSegmentContent | undefined {
  if (!isValidSegment(slug)) return undefined;
  return SEGMENT_CONTENT[slug];
}
