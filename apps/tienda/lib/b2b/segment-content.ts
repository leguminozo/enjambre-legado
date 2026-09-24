import {
  B2B_SEGMENT_SLUGS,
  type B2BSegmentSlug,
  type B2BKitItem,
  type B2BToolItem,
  type B2BCommercialStrategy,
  type B2BCodeModule,
} from '@enjambre/shop-chrome';

export const B2B_SEGMENTS = B2B_SEGMENT_SLUGS;
export type { B2BSegmentSlug, B2BKitItem, B2BToolItem, B2BCommercialStrategy, B2BCodeModule };

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

export interface B2BSegmentContent {
  slug: B2BSegmentSlug;
  tipo: string;
  kicker: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  valueProps: ValueProp[];
  stats: Stat[];
  process: ProcessStep[];
  suggestedProductsCopy: string;
  ctaText: string;
  ctaHref: string;
  faq: FaqItem[];
  seo: SegmentSeo;
}

export interface SegmentKitComponent {
  cantidad: string;
  item: string;
  detalle?: string;
}

export interface SegmentKitIntegration {
  titulo: string;
  descripcion: string;
  tag: 'resenas' | 'trazabilidad' | 'fidelizacion' | 'pricing' | 'marketing';
}

export interface SegmentKit {
  id: string;
  nombre: string;
  badge: string;
  tier: 'entrada' | 'medio' | 'avanzado' | 'especialidad' | string;
  tagline: string;
  descripcion: string;
  precioNetoClp: number;
  pvpEstimadoClp: number;
  margenEstimadoPct: number;
  moqSummary: string;
  salesStrategy?: string;
  herramientasServicio?: string[];
  componentesFisicos: SegmentKitComponent[];
  materialesExhibicion: string[];
  integracionesDigitales: SegmentKitIntegration[];
  recomendadoPara: string;
}

export function normalizeCmsKit(kit: B2BKitItem): SegmentKit {
  return {
    id: kit.id,
    nombre: kit.nombre,
    badge: kit.badge || 'Recomendado',
    tier: kit.tier,
    tagline: kit.tagline,
    descripcion: kit.descripcion,
    precioNetoClp: kit.precio_neto_clp,
    pvpEstimadoClp: kit.pvp_estimado_clp,
    margenEstimadoPct: kit.margen_estimado_pct,
    moqSummary: kit.moq_summary,
    salesStrategy: kit.sales_strategy,
    herramientasServicio: kit.herramientas_servicio || [],
    componentesFisicos: (kit.componentes_fisicos || []).map((c) => {
      if (typeof c === 'string') {
        const parts = c.trim().split(' ');
        const cantidad = parts[0] || '1 un.';
        const item = parts.slice(1).join(' ') || c;
        return { cantidad, item };
      }
      return { cantidad: c.cantidad, item: c.item, detalle: c.detalle };
    }),
    materialesExhibicion: kit.materiales_exhibicion || [],
    integracionesDigitales: (kit.integraciones_digitales || []).map((i) => {
      if (typeof i === 'string') {
        return { titulo: i, descripcion: '', tag: 'trazabilidad' as const };
      }
      return { titulo: i.titulo, descripcion: i.descripcion, tag: (i.tag as any) || 'trazabilidad' };
    }),
    recomendadoPara: kit.recomendado_para || '',
  };
}

export interface SegmentQuestionOption {
  value: string;
  label: string;
}

export interface SegmentQuestion {
  id: string;
  label: string;
  placeholder?: string;
  type: 'select' | 'text' | 'number';
  options?: SegmentQuestionOption[];
  required: boolean;
  helpText?: string;
}

export const SEGMENT_CONTENT: Record<B2BSegmentSlug, B2BSegmentContent> = {
  cafeterias: {
    slug: "cafeterias",
    tipo: "cafeteria",
    kicker: "PARA CAFETERÍAS DE ESPECIALIDAD",
    headline: "Pequeñas creaciones para una gran taza.",
    subheadline:
      "Cuatro cremas de miel cruda de Chiloé, batidas en frío y servidas en frascos de 25 g. Bosque, colmena, cacao y avellana en una pieza de mesa que transforma una infusión en un gesto de origen.",
    heroImage: "/images/b2b/hero-cafeterias.jpg",
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
        icon: "Flower",
        title: "Crema de Miel + Polen",
        description:
          "La suavidad cremosa encuentra pequeños granos dorados de la colmena de Pureo: una textura viva, floral y terrosa. Ideal para: té verde, infusiones herbales, yogurt, granola.",
      },
    ],
    stats: [
      { value: '25 g', label: 'Pieza de mesa' },
      { value: '150 g', label: 'Reserva para llevar' },
      { value: '500 g', label: 'Uso interno de barra' },
      { value: '<18%', label: 'Humedad controlada por lote' },
    ],
    process: [
      { step: '01', title: '25 g — Pieza de mesa', desc: 'Para una infusión, croissant o regalo de salida. El cliente lo abre en el local; el frasco mantiene valor visual y puede llevarse.' },
      { step: '02', title: '150 g — Reserva para llevar', desc: 'Para vender desde la barra. Es la continuidad doméstica de una experiencia que comenzó con una taza.' },
      { step: '03', title: '500 g — Uso interno de barra', desc: 'Cocina, repostería y degustación del staff para que conozcan la base del producto y recomienden cada creación con propiedad.' },
    ],
    suggestedProductsCopy: 'CREACIONES PARA LA BARRA. Cada creación comienza con crema de miel cruda de Chiloé y se abre hacia un segundo ingrediente cuidadosamente elegido. No son sabores añadidos para distraer: son encuentros de textura, origen y tiempo.',
    ctaText: "SOLICITAR PROPUESTA PARA MI CAFETERÍA",
    ctaHref: "#registro",
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
        question: "Mix recomendado y trazabilidad",
        answer:
          "Una barra no necesita más productos, necesita mejores gestos. Definimos contigo el mix, la frecuencia de abastecimiento y la trazabilidad por lote respaldada en los análisis físico-químicos y botánicos de nuestra sección de ciencia.",
      },
    ],
    seo: {
      title: "Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano",
      description:
        "Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen.",
    },
  },

  hoteles: {
    slug: "hoteles",
    tipo: "hotel",
    kicker: "Para Hoteles",
    headline: "Amenities que cuentan la historia del bosque",
    subheadline:
      "Mini frascos de 25g con tapa dorada como amenity premium. Un detalle inolvidable que diferencia la experiencia de hospedaje en tu hotel.",
    heroImage: "/images/b2b/hero-hoteles.jpg",
    valueProps: [
      {
        icon: "Hotel",
        title: "Amenity de lujo",
        description:
          "Pequeños frascos de 25g con tapa dorada que elevan la percepción del desayuno, el room service o el welcome pack.",
      },
      {
        icon: "Palette",
        title: "Marca conjunta (Co-branding Opcional)",
        description:
          "Como upgrade premium, integramos la insignia de tu hotel en la etiqueta dedicada. El huésped se lleva un recuerdo donde tu marca y el bosque son uno solo.",
      },
      {
        icon: "BarChart3",
        title: "Experiencia Sensorial Digital",
        description:
          "Tus huéspedes pueden escanear un QR incluido en el amenity y registrar su percepción (aroma, sabor, notas de bosque) en nuestra plataforma, llevándose una experiencia inmersiva.",
      },
      {
        icon: "Leaf",
        title: "Compromiso territorial demostrable",
        description:
          "Tu compra apoya un proyecto real de restauración en Chiloé. Mantenemos el censo georreferenciado de árboles nativos y apiarios en expansión continua.",
      },
    ],
    stats: [
      { value: '25 g', label: 'Amenity de origen' },
      { value: 'Nativo', label: 'Origen botánico de Chiloé (NCh2981)' },
      { value: 'Planificado', label: 'Suministro anual reservado' },
      { value: '1 QR', label: 'Cata sensorial guiada' },
    ],
    process: [
      { step: '01', title: 'Evaluación', desc: 'Definimos el volumen mensual ideal para tus operaciones de desayuno o welcome packs.' },
      { step: '02', title: 'Personalización (Opcional)', desc: 'Opcionalmente, y por un coste adicional, añadimos el logo de tu hotel al diseño de los mini frascos.' },
      { step: '03', title: 'Preservación conjunta', desc: 'Despachos recurrentes con suministro planificado. Tu hotel se convierte en un aliado clave sosteniendo el censo forestal y la apicultura viva en Chiloé.' },
    ],
    suggestedProductsCopy: 'El formato ideal como amenity es el frasco de 25g con tapa dorada. También proveemos frascos de gran formato para cocinas o buffets.',
    ctaText: "Solicitar cotización",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Es posible personalizar los frascos de 25g con nuestra marca?",
        answer:
          "Sí, ofrecemos co-branding como un servicio opcional de plusvalía. Por un coste adicional, integramos tu logo en un área dedicada de nuestra etiqueta para mantener ambas identidades en armonía.",
      },
      {
        question: "¿Qué es la Experiencia Sensorial Digital?",
        answer:
          "El huésped escanea un código y entra a una interfaz móvil donde registra su percepción de cata (textura, notas, etc.). Convierte el simple acto de desayunar en una experiencia turística y de conexión con el origen.",
      },
      {
        question: "¿Tienen reportes de impacto ambiental o trazabilidad forestal?",
        answer:
          "Nuestra trazabilidad forestal avanza progresivamente mediante el censo georreferenciado de ejemplares nativos en Predio Pureo y sectores asociados. Compartimos esta evidencia metodológica con nuestros aliados institucionales.",
      },
    ],
    seo: {
      title: "Amenities de Miel para Hoteles · La Obrera y el Zángano",
      description:
        "Mini frascos de 25g de miel cruda como amenity premium para hoteles. Catas digitales, co-branding opcional y protección activa del bosque nativo.",
    },
  },

  "tiendas-gourmet": {
    slug: "tiendas-gourmet",
    tipo: "tienda_gourmet",
    kicker: "Para Tiendas Gourmet",
    headline: "El frasco que tus clientes buscan",
    subheadline:
      "Miel cruda de bosque nativo con un ecosistema completo para retail: trazabilidad desde la colmena, fondos de co-marketing y lealtad digital encadenada.",
    heroImage: "/images/b2b/hero-tiendas-gourmet.jpg",
    valueProps: [
      {
        icon: "Shield",
        title: "Trazabilidad verificable por lote",
        description:
          "Cada frasco lleva número de lote y origen botánico verificado. Tu cliente accede a la trazabilidad y respalda una economía de preservación.",
      },
      {
        icon: "Award",
        title: "Fondos de Co-Marketing (Co-op)",
        description:
          "Nuestra relación es bidireccional. Las recompras rápidas y altos volúmenes generan fondos de co-marketing y rebates porcentuales que invertimos juntos en activar ventas en tu tienda.",
      },
      {
        icon: "Users",
        title: "Kit de Entrada y Pack Digital",
        description:
          "Tu primer pedido viene como un 'Set de Entrada'. Incluye material impreso y un pack digital listo para desplegar en tus redes sociales y góndola.",
      },
      {
        icon: "Package",
        title: "Línea completa",
        description:
          "Mini frascos de 25g para regalo/impulso, frascos de 150g y frascos mayores de 500g Reserva del Bosque.",
      },
    ],
    stats: [
      { value: '3 formatos', label: 'Presentaciones 25g, 150g y 500g' },
      { value: '35–45%', label: 'Margen comercial proyectado' },
      { value: 'SAG', label: 'Certificación sanitaria oficial' },
      { value: 'Alta', label: 'Recompra documentada en retail' },
    ],
    process: [
      { step: '01', title: 'Set de Entrada', desc: 'Inicia con una selección equilibrada de rotación probada, acompañada de tu kit digital de presentación.' },
      { step: '02', title: 'Onboarding de Clientes', desc: 'A través de un código QR, tus consumidores se unen a nuestro programa de fidelidad, ganando su primer sello solo por visitar tu local.' },
      { step: '03', title: 'Crecimiento de Tier', desc: 'Tus recompras rápidas desbloquean rebates, fondos de co-marketing y el status Guardián de exclusividad territorial.' },
    ],
    suggestedProductsCopy: 'Para retail gourmet recomendamos el espectro completo: mini frascos de 25g para compra de impulso/regalos, y los formatos de 150g y 500g para los entusiastas de la gastronomía.',
    ctaText: "Solicitar catálogo",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo funcionan los fondos de co-marketing (Co-op)?",
        answer:
          "Premiamos tu velocidad y volumen. Ciertos umbrales de compra activan fondos que La Obrera y el Zángano re-invierte en publicidad local, eventos en tu tienda o degustaciones para ayudarte a rotar el inventario aún más rápido.",
      },
      {
        question: "¿Qué es el Pack Digital del Set de Entrada?",
        answer:
          "Junto a tus primeros frascos, te enviamos material fotográfico profesional, videos cortos e historias del bosque optimizadas para que alimentes las redes sociales de tu tienda inmediatamente.",
      },
      {
        question: "¿Cómo funciona la exclusividad territorial?",
        answer:
          "Al alcanzar el tier de 'Guardián' en nuestro programa de Aliados del Bosque, te otorgamos exclusividad de radio (ej. única tienda autorizada en 5km a la redonda). Protegemos a los negocios que más se comprometen con nuestra marca.",
      },
    ],
    seo: {
      title: "Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano",
      description:
        "Miel cruda para tiendas gourmet. Trazabilidad completa, formatos de 25g, 150g y 500g, y un programa de fidelidad y referidos.",
    },
  },

  ferias: {
    slug: "ferias",
    tipo: "feria_evento",
    kicker: "Para Ferias y Eventos",
    headline: "Del bosque al encuentro",
    subheadline:
      "Formatos ideales para venta directa e impulso: destácate con nuestros mini frascos de 25g y gana beneficios inmediatos al rotar inventario.",
    heroImage: "/images/b2b/hero-ferias.jpg",
    valueProps: [
      {
        icon: "Package",
        title: "El magneto de miradas",
        description:
          "Los mini frascos de 25g con tapa dorada son la compra por impulso perfecta para visitantes de ferias y eventos.",
      },
      {
        icon: "TrendingUp",
        title: "Retorno Inmediato",
        description:
          "Cada frasco individualizado que adquieres para la feria te acerca a bonificaciones de stock gratuito (Dividendo Apícola) para tu próximo evento.",
      },
      {
        icon: "BarChart3",
        title: "Vínculo Territorial",
        description:
          "Durante el evento, los visitantes escanean tu QR para participar en la cata guiada y conocer el origen. Mantienes el contacto directo con quienes valoran el producto.",
      },
      {
        icon: "ShoppingBag",
        title: "Set de Entrada Físico",
        description:
          "Material gráfico, displays y tarjetas de producto. Todo lo que necesitas para que el stand cuente la historia del bosque por ti.",
      },
    ],
    stats: [
      { value: '25 g', label: 'Degustación y regalo' },
      { value: '3 formatos', label: 'Mix completo para stand' },
      { value: 'Alta', label: 'Conversión comprobada en cata guiada' },
      { value: '24–48h', label: 'Respuesta y coordinación para eventos' },
    ],
    process: [
      { step: '01', title: 'Planifica', desc: 'Cuéntanos la fecha y magnitud de tu evento para sugerir el mix adecuado de inventario.' },
      { step: '02', title: 'Equípate', desc: 'Recibe tu Set de Entrada con los frascos y el material de exhibición físico y digital.' },
      { step: '03', title: 'Interactúa', desc: 'Usa el sistema de Catas de Origen en tu stand. Atrae visitantes, genera vínculos duraderos y fortalece la preferencia de marca.' },
    ],
    suggestedProductsCopy: 'Para eventos sugerimos una fuerte presencia de mini frascos de 25g, son altamente atractivos y tienen excelente margen en formato de regalo.',
    ctaText: "Pedir kit de feria",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Qué recomiendan para una feria?",
        answer:
          "Sin duda los mini frascos de 25g con tapa dorada. Llaman la atención inmediatamente, tienen un precio accesible para la compra por impulso y permiten a la gente probar y regalar la marca.",
      },
      {
        question: "¿Cómo uso el sistema QR en una feria?",
        answer:
          "Colocas el QR de tu local en el stand. Quienes prueban la miel lo escanean para registrar su opinión y conocer el pasaporte de lote. Convierte cada degustación en una experiencia memorable y en una relación comercial recurrente.",
      },
    ],
    seo: {
      title: "Miel para Ferias y Eventos · La Obrera y el Zángano",
      description:
        "Venta directa de miel cruda en ferias. Mini frascos de 25g ideales para impulso, catas digitales en stand y bonificaciones de stock.",
    },
  },

  revendedores: {
    slug: "revendedores",
    tipo: "otro",
    kicker: "Programa Revendedores",
    headline: "Distribución independiente y representación territorial",
    subheadline:
      "Distribuye miel cruda de Chiloé con catálogo directo y trazabilidad de origen. Sin barreras de entrada obligatorias, con reposición preferente y respaldo de marca en cada entrega.",
    heroImage: "/images/b2b/hero-revendedores.jpg",
    valueProps: [
      {
        icon: "TrendingUp",
        title: "Bonus de Recompra Rápida",
        description:
          "Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de 30 días, desbloqueas rebajas automáticas y producto bonificado.",
      },
      {
        icon: "Shield",
        title: "Respaldo analítico y de marca",
        description:
          "Vendes un producto con identidad territorial genuina, pureza comprobada y análisis de laboratorio certificados documentados en nuestra sección de ciencia.",
      },
      {
        icon: "Package",
        title: "Set de Entrada y Kit Digital",
        description:
          "Tu primera orden es un 'Set de Entrada' que incluye un kit de activos fotográficos y de relato listos para presentar la miel de Chiloé a tu red de clientes.",
      },
      {
        icon: "Award",
        title: "Programa de tiers",
        description:
          "Avanza en la red de guardianes según tu volumen y regularidad de reposición. Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas.",
      },
    ],
    stats: [
      { value: '30 días', label: 'Ciclo preferente de reposición' },
      { value: '0 costo', label: 'Sin cobro de incorporación' },
      { value: 'Escalable', label: 'Margen comercial según volumen' },
      { value: 'Kit digital', label: 'Activos fotográficos de apoyo' },
    ],
    process: [
      { step: '01', title: 'Únete', desc: 'Regístrate sin costo, obtén tu código de revendedor y descarga tu Pack Digital de ventas.' },
      { step: '02', title: 'Distribuye', desc: 'Ofrece los formatos disponibles (25g, 150g, 500g) e invita a tus clientes a escanear tu QR para acceder a la cata y trazabilidad de origen.' },
      { step: '03', title: 'Acelera', desc: 'Haz pedidos de reposición rápidos para cobrar el "Bonus de Recompra Rápida" y multiplicar tu margen.' },
    ],
    suggestedProductsCopy: 'Nuestros revendedores suelen tener gran éxito armando packs de regalo con los mini frascos de 25g, además de abastecer hogares con los frascos de 500g.',
    ctaText: "Comenzar ahora",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo funciona el 'Bonus de Recompra Rápida'?",
        answer:
          "El sistema mide la cadencia entre tus pedidos. Si mantienes reposición continua dentro del plazo establecido, se aplica automáticamente una bonificación comercial o unidades de cortesía.",
      },
      {
        question: "¿Cómo mis clientes registran su experiencia conmigo?",
        answer:
          "Te asignamos un código único de representación (QR). Al entregar un frasco, el cliente lo escanea para acceder al pasaporte de lote y registrar sus impresiones sensoriales, consolidando su preferencia por tu atención.",
      },
      {
        question: "¿Qué incluye el Pack Digital?",
        answer:
          "Al registrarte, descargas un archivo con fotografías profesionales de los frascos, textos de venta probados, y gráficos para dar a conocer el producto.",
      },
    ],
    seo: {
      title: "Programa de Revendedores · La Obrera y el Zángano",
      description:
        "Revende miel cruda premium. Accede a bonus de recompra rápida, pack digital de ventas y un programa de fidelidad en app para retener a tus propios clientes.",
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

export const SEGMENT_KITS: Record<B2BSegmentSlug, SegmentKit[]> = {
  cafeterias: [
    {
      id: "barra-esencial",
      nombre: "Barra Esencial & Monodosis",
      badge: "Iniciación y Barra",
      tier: "entrada",
      tagline: "El primer gesto de origen en la mesa de café",
      descripcion:
        "Orientado a cafeterías de especialidad que desean incorporar una pieza de mesa memorable para infusiones y bollería sin sobrecargar stock inicial.",
      precioNetoClp: 89000,
      pvpEstimadoClp: 145000,
      margenEstimadoPct: 39,
      moqSummary: "48 frascos 25g + 6 frascos 150g",
      componentesFisicos: [
        {
          cantidad: "48 un.",
          item: "Crema de Miel 25g (mesa)",
          detalle: "12 Cruda Floral, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Pureo",
        },
        {
          cantidad: "6 un.",
          item: "Frascos 150g vitrina",
          detalle: "Ediciones de venta directa para llevar a casa",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Trazabilidad por Lote",
          descripcion: "Certificado de pureza botánica y humedad <18% escaneable en mesa",
          tag: "trazabilidad",
        },
        {
          titulo: "Ficha Barista Digital",
          descripcion: "Guía de maridaje con cafés lavados, naturales y métodos filtrados",
          tag: "marketing",
        },
      ],
      recomendadoPara:
        "Cafeterías boutique o barras de especialidad iniciando experiencia con miel nativa",
    },
    {
      id: "experiencia-barista",
      nombre: "Experiencia Barista & Maridaje",
      badge: "Más Elegido · Recomendado",
      tier: "medio",
      tagline: "Integración completa entre barra, cocina y vitrina de venta",
      descripcion:
        "El mix equilibrado para dotar la barra de producto de servicio, repostería con miel cruda y vitrina de alta rotación para los clientes del café.",
      precioNetoClp: 189000,
      pvpEstimadoClp: 310000,
      margenEstimadoPct: 40,
      moqSummary: "96 frascos 25g + 18 frascos 150g + 2 potes 500g",
      componentesFisicos: [
        {
          cantidad: "96 un.",
          item: "Crema de Miel 25g (mesa)",
          detalle: "24 de c/u: Cruda, Avellana, Cacao, Polen",
        },
        {
          cantidad: "18 un.",
          item: "Frascos 150g vitrina",
          detalle: "Surtido completo para venta directa en barra",
        },
        {
          cantidad: "2 un.",
          item: "Potes 500g uso barra",
          detalle: "Miel cruda de bosque nativo para bebidas y obrador",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Reseñas Verificadas de Cata",
          descripcion:
            "Los comensales califican su experiencia y dejan notas de maridaje visibles para nuevos clientes",
          tag: "resenas",
        },
        {
          titulo: "Sellos de Fidelización Digital",
          descripcion:
            "Tus clientes acumulan sellos por cada café con miel de autor servido en tu local",
          tag: "fidelizacion",
        },
        {
          titulo: "Pack de Contenidos Digitales",
          descripcion:
            "Fotografías en alta resolución y gráficas para cartas o redes del local",
          tag: "marketing",
        },
      ],
      recomendadoPara:
        "Cafeterías con flujo constante que buscan diferenciar su propuesta gastronómica y fidelizar comensales",
    },
    {
      id: "alianza-integral",
      nombre: "Alianza Integral & Barra de Autor",
      badge: "Escala & Alta Rotación",
      tier: "avanzado",
      tagline: "El estándar máximo de presencia y volumen preferente",
      descripcion:
        "Diseñado para cafeterías de alto volumen, tostadurías con salón o múltiples locales que buscan la máxima rentabilidad y soporte continuo.",
      precioNetoClp: 349000,
      pvpEstimadoClp: 590000,
      margenEstimadoPct: 42,
      moqSummary: "192 frascos 25g + 36 frascos 150g + 6 potes 500g",
      componentesFisicos: [
        {
          cantidad: "192 un.",
          item: "Crema de Miel 25g monodosis",
          detalle: "48 de c/u: Cruda, Avellana, Cacao, Polen",
        },
        {
          cantidad: "36 un.",
          item: "Frascos 150g de vitrina",
          detalle: "Lotes numerados con sello de recolección de bosque",
        },
        {
          cantidad: "6 un.",
          item: "Potes 500g barista/cocina",
          detalle: "Para carta de bebidas de temporada y repostería interna",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Reseñas Verificadas y Sello de Origen",
          descripcion:
            "Presencia prioritaria en el mapa digital de cafeterías aliadas",
          tag: "resenas",
        },
        {
          titulo: "Capacitación Virtual para Baristas",
          descripcion:
            "Sesión de 30 min con el equipo apícola para el staff de atención",
          tag: "marketing",
        },
        {
          titulo: "Reposición Prioritaria con Descuento Mayorista",
          descripcion:
            "Acceso automático al tramo de descuento preferente por volumen",
          tag: "pricing",
        },
      ],
      recomendadoPara:
        "Tostadurías, cafeterías con alto tránsito y espacios gastronómicos consolidados",
    },
    {
      id: "obrador-reposteria",
      nombre: "Obrador & Creaciones Dulces",
      badge: "Especialidad Culinaria",
      tier: "especialidad",
      tagline: "Abastecimiento noble para cocina, repostería y coctelería",
      descripcion:
        "Formatos a granel de miel cruda pura y cremas botánicas para elaboración de bollería, almíbares de autor y cocina de vanguardia.",
      precioNetoClp: 165000,
      pvpEstimadoClp: 260000,
      margenEstimadoPct: 37,
      moqSummary: "12 potes 500g + 1 balde 5kg miel cruda",
      componentesFisicos: [
        {
          cantidad: "12 un.",
          item: "Potes 500g Miel Cruda de Bosque",
          detalle: "Pureza botánica garantizada sin pasteurizar",
        },
        {
          cantidad: "1 un.",
          item: "Balde 5kg Miel Cruda a Granel",
          detalle: "Envase grado alimentario con precinto de seguridad",
        },
        {
          cantidad: "1 un.",
          item: "Certificado de análisis físico-químico",
          detalle: "Humedad <18% y trazabilidad botánica por lote",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Ficha Técnica de Inocuidad y Laboratorio",
          descripcion:
            "Respaldo sanitario oficial y parámetros Codex para manipulación culinaria",
          tag: "trazabilidad",
        },
        {
          titulo: "Contrato de Suministro Continuo",
          descripcion:
            "Garantía de precio congelado por temporada de recolección",
          tag: "pricing",
        },
      ],
      recomendadoPara:
        "Talleres de panadería de masa madre, reposterías finas y cocinas de autor",
    },
  ],

  hoteles: [
    {
      id: "bienvenida-boutique",
      nombre: "Kit Bienvenida Boutique",
      badge: "Hospitalidad & Amenities",
      tier: "entrada",
      tagline: "Amenities de 25g que elevan la bienvenida del huésped",
      descripcion:
        "Mini frascos de crema de miel cruda con tapa dorada y tarjeta de bienvenida que introduce al huésped en el bosque chilote.",
      precioNetoClp: 99000,
      pvpEstimadoClp: 165000,
      margenEstimadoPct: 40,
      moqSummary: "72 frascos 25g + 72 tarjetas",
      componentesFisicos: [
        {
          cantidad: "72 un.",
          item: "Mini frascos 25g cortesía",
          detalle: "Tapa dorada y sello de garantía botánica",
        },
        {
          cantidad: "72 un.",
          item: "Tarjetas de bienvenida con relato de bosque",
          detalle: "Papel mineral impreso con QR de cata guiada",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Experiencia Sensorial Digital",
          descripcion:
            "El huésped escanea el QR del frasco y realiza una cata guiada desde su teléfono",
          tag: "trazabilidad",
        },
      ],
      recomendadoPara: "Lodges boutique, hoteles de autor y bed & breakfast premium",
    },
    {
      id: "desayuno-buffet",
      nombre: "Kit Desayuno & Buffet Austral",
      badge: "Gastronomía · Recomendado",
      tier: "medio",
      tagline: "Servicio distinguido en el desayuno con formatos para sala y cortesía",
      descripcion:
        "Dotación completa para el salón de desayuno, con formatos de 500g para reposición fluida y piezas de 25g que eliminan el plástico y dignifican el origen.",
      precioNetoClp: 219000,
      pvpEstimadoClp: 350000,
      margenEstimadoPct: 37,
      moqSummary: "12 frascos 500g + 36 frascos 25g",
      componentesFisicos: [
        {
          cantidad: "12 un.",
          item: "Frascos 500g miel cruda buffet",
          detalle: "Miel líquida tradicional sin filtrar para reposición de servicio",
        },
        {
          cantidad: "36 un.",
          item: "Mini frascos 25g para room service",
          detalle: "Cortesía para desayuno en habitación",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Ficha Botánica y Reseñas de Huéspedes",
          descripcion:
            "Respaldo analítico visible en inglés y español para visitantes internacionales",
          tag: "resenas",
        },
      ],
      recomendadoPara: "Hoteles con servicio de desayuno buffet y restaurantes de hotel",
    },
    {
      id: "gran-hospitalidad",
      nombre: "Kit Gran Hospitalidad & Boutique Lobby",
      badge: "Escala & Retail Hotelero",
      tier: "avanzado",
      tagline: "Amenities de suite, salón de desayuno y vitrina de venta para souvenirs",
      descripcion:
        "Integración integral que cubre amenities en habitación, servicio de desayuno y selección de frascos para que los huéspedes adquieran miel como recuerdo de viaje.",
      precioNetoClp: 385000,
      pvpEstimadoClp: 660000,
      margenEstimadoPct: 42,
      moqSummary: "144 frascos 25g + 24 frascos 150g + 12 frascos 500g",
      componentesFisicos: [
        {
          cantidad: "144 un.",
          item: "Mini frascos 25g amenities",
          detalle: "Para suites y habitaciones preferentes",
        },
        {
          cantidad: "24 un.",
          item: "Frascos 150g para tienda del lobby",
          detalle: "Lotes numerados para souvenirs de alto valor",
        },
        {
          cantidad: "12 un.",
          item: "Frascos 500g para salón de desayuno",
          detalle: "Servicio continuo de desayuno",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Catálogo de Regalos Corporativos",
          descripcion:
            "Acceso para coordinar obsequios para eventos de empresas en el hotel",
          tag: "pricing",
        },
      ],
      recomendadoPara: "Hoteles 5 estrellas, resorts patrimoniales y cadenas de hospitalidad",
    },
  ],

  "tiendas-gourmet": [
    {
      id: "vitrina-autor",
      nombre: "Kit Vitrina de Autor",
      badge: "Iniciación Gourmet",
      tier: "entrada",
      tagline: "Presencia selecta de alta rotación para emporios",
      descripcion:
        "Selección de frascos de 150g en las variedades más apreciadas para mesón de venta y rotación ágil.",
      precioNetoClp: 75000,
      pvpEstimadoClp: 130000,
      margenEstimadoPct: 42,
      moqSummary: "24 frascos 150g surtidos",
      componentesFisicos: [
        {
          cantidad: "24 un.",
          item: "Frascos 150g surtidos",
          detalle: "8 Miel Cruda, 8 Avellana Chilena, 4 Cacao Santander, 4 Polen Pureo",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Reseñas Verificadas de Cata",
          descripcion:
            "Los clientes de la tienda escanean y comprueban las opiniones reales de otros compradores",
          tag: "resenas",
        },
      ],
      recomendadoPara: "Tiendas gourmet, emporios barriales y panaderías artesanales",
    },
    {
      id: "emporio-selecto",
      nombre: "Kit Emporio Selecto",
      badge: "Más Vendido · Recomendado",
      tier: "medio",
      tagline: "El catálogo completo para tiendas con clientela fidelizada",
      descripcion:
        "Surtido balanceado de frascos de 150g y frascos de 500g Reserva del Bosque para abastecer consumo de mesa y amantes de la miel tradicional.",
      precioNetoClp: 195000,
      pvpEstimadoClp: 345000,
      margenEstimadoPct: 43,
      moqSummary: "48 frascos 150g + 12 frascos 500g",
      componentesFisicos: [
        {
          cantidad: "48 un.",
          item: "Frascos 150g surtidos",
          detalle: "Crema de miel pura y cremas botánicas",
        },
        {
          cantidad: "12 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Edición mayor con origen botánico protegido",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Trazabilidad Analítica y Reseñas",
          descripcion:
            "Acceso directo a fichas de ciencia y pureza de laboratorio para clientes informados",
          tag: "trazabilidad",
        },
        {
          titulo: "Reposición Ágil con Factura Inmediata",
          descripcion:
            "Reordenamiento en 1 clic desde el portal con RUT empresa",
          tag: "pricing",
        },
      ],
      recomendadoPara: "Emporios consolidados, tiendas de vinos y quesos, y locales de autor",
    },
    {
      id: "coleccion-maestra",
      nombre: "Kit Colección Maestra & Reserva Familiar",
      badge: "Alta Gama & Rotación",
      tier: "avanzado",
      tagline: "Volumen preferente de frascos de 150g y 500g",
      descripcion:
        "Volumen para temporadas altas y tiendas de destino, combinando frascos de 150g para compra directa y frascos de 500g Reserva del Bosque.",
      precioNetoClp: 420000,
      pvpEstimadoClp: 750000,
      margenEstimadoPct: 44,
      moqSummary: "96 frascos 150g + 24 frascos 500g",
      componentesFisicos: [
        {
          cantidad: "96 un.",
          item: "Frascos 150g de autor",
          detalle: "Surtido balanceado de alta rotación",
        },
        {
          cantidad: "24 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Miel tradicional de recolección estacional",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Márgenes Comerciales Protegidos (44%+)",
          descripcion:
            "Condiciones mayoristas blindadas para tiendas exclusivas de ciudad",
          tag: "pricing",
        },
        {
          titulo: "Despacho Prioritario Asegurado",
          descripcion: "Envíos directos con seguro total contra rotura",
          tag: "trazabilidad",
        },
      ],
      recomendadoPara:
        "Cadenas gourmet, tiendas de aeropuertos, concept stores y tiendas de diseño",
    },
  ],

  ferias: [
    {
      id: "stand-degustacion",
      nombre: "Kit Stand Degustación & Activación",
      badge: "Presencia en Eventos",
      tier: "entrada",
      tagline: "Montaje ágil para ferias gastronómicas y mercados de diseño",
      descripcion:
        "Diseñado para montajes temporales con formatos de degustación y stock listo para venta inmediata al paso.",
      precioNetoClp: 95000,
      pvpEstimadoClp: 160000,
      margenEstimadoPct: 41,
      moqSummary: "72 mini frascos 25g + 18 frascos 150g",
      componentesFisicos: [
        {
          cantidad: "72 un.",
          item: "Mini frascos 25g de impulso",
          detalle: "Surtido de 4 variedades para degustación y venta ágil",
        },
        {
          cantidad: "18 un.",
          item: "Frascos 150g de autor",
          detalle: "Variedades surtidas para venta directa",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "QR de Pago y Registro Rápido",
          descripcion:
            "Cobro ágil y captura de comensales para el programa de fidelización",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara: "Productores, feriantes gourmet y activaciones de fin de semana",
    },
    {
      id: "encuentro-gastronomico",
      nombre: "Kit Encuentro Gastronómico",
      badge: "Activación · Recomendado",
      tier: "medio",
      tagline: "Para festivales gastronómicos y pabellones de autor",
      descripcion:
        "Capacidad para atender degustaciones continuas y ofrecer frascos de mesa y familiares con excelente margen.",
      precioNetoClp: 220000,
      pvpEstimadoClp: 385000,
      margenEstimadoPct: 43,
      moqSummary: "144 mini frascos 25g + 36 frascos 150g + 12 frascos 500g",
      componentesFisicos: [
        {
          cantidad: "144 un.",
          item: "Mini frascos 25g de impulso",
          detalle: "Para degustación y venta ágil en eventos masivos",
        },
        {
          cantidad: "36 un.",
          item: "Frascos 150g de autor",
          detalle: "Surtido completo de bosque nativo",
        },
        {
          cantidad: "12 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Para compradores exigentes de ferias",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Reseñas de Evento en Vivo",
          descripcion:
            "Los asistentes dejan comentarios en vivo durante el evento",
          tag: "resenas",
        },
      ],
      recomendadoPara: "Participantes en ferias como Echinuco, Mercado Paula, festivales de café",
    },
    {
      id: "activacion-corporativa",
      nombre: "Kit Activación Masiva & Corporativa",
      badge: "Gran Escala",
      tier: "avanzado",
      tagline: "Presencia imponente para congresos y eventos de marca",
      descripcion:
        "Solución a gran escala para regalar piezas de origen conmemorativas en congresos, lanzamientos y encuentros de negocios.",
      precioNetoClp: 480000,
      pvpEstimadoClp: 850000,
      margenEstimadoPct: 44,
      moqSummary: "150 frascos 150g con sello de origen",
      componentesFisicos: [
        {
          cantidad: "150 un.",
          item: "Frascos 150g con sello conmemorativo",
          detalle: "Lote de recolección certificado con pasaporte botánico",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Certificado de Huella y Origen Territorial",
          descripcion:
            "Reporte digital de impacto del lote para la memoria del evento",
          tag: "trazabilidad",
        },
      ],
      recomendadoPara:
        "Productoras de eventos, agencias de activaciones y congresos institucionales",
    },
  ],

  revendedores: [
    {
      id: "maletin-embajador",
      nombre: "Kit Embajador Inicial",
      badge: "Iniciación de Representante",
      tier: "entrada",
      tagline: "El set esencial de formatos de mano para iniciar tu red personal",
      descripcion:
        "Stock inicial de 18 frascos de 150g para entrega inmediata y código de revendedor asignado en la plataforma.",
      precioNetoClp: 65000,
      pvpEstimadoClp: 110000,
      margenEstimadoPct: 41,
      moqSummary: "18 frascos 150g surtidos",
      componentesFisicos: [
        {
          cantidad: "18 un.",
          item: "Frascos 150g de autor",
          detalle: "Variedades de mayor demanda para entrega inmediata",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Código de Retribución Mayorista",
          descripcion:
            "Tus ventas y reposiciones acumulan retribución directa en el sistema",
          tag: "pricing",
        },
        {
          titulo: "Pack Digital de Ventas",
          descripcion:
            "Fotos, videos y textos probados para compartir por WhatsApp e Instagram",
          tag: "marketing",
        },
      ],
      recomendadoPara: "Nuevos representantes territoriales, distribuidores independientes",
    },
    {
      id: "stock-rotacion",
      nombre: "Kit Stock de Distribución & Rotación",
      badge: "Más Rentable · Recomendado",
      tier: "medio",
      tagline: "Volumen para abastecer clientes frecuentes y ventas directas",
      descripcion:
        "El balance perfecto de frascos de 150g, 500g y piezas de 25g para cerrar ventas con clientes directos.",
      precioNetoClp: 185000,
      pvpEstimadoClp: 330000,
      margenEstimadoPct: 44,
      moqSummary: "48 frascos 150g + 12 frascos 500g + 50 minis 25g",
      componentesFisicos: [
        {
          cantidad: "48 un.",
          item: "Frascos 150g surtidos",
          detalle: "Miel pura y cremas botánicas",
        },
        {
          cantidad: "12 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Edición mayor para compras familiares",
        },
        {
          cantidad: "50 un.",
          item: "Mini frascos 25g cortesía",
          detalle: "Para degustación y apertura de nuevos clientes",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Bonus de Recompra Rápida",
          descripcion:
            "Bonificación adicional por reposición continua en menos de 30 días",
          tag: "pricing",
        },
        {
          titulo: "Herramienta de Reposición Móvil",
          descripcion: "Gestión ágil de pedidos desde tu teléfono",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara: "Revendedores activos con cartera de clientes y rutas semanales",
    },
    {
      id: "distribuidor-zonal",
      nombre: "Kit Distribuidor Zonal",
      badge: "Distribución Mayorista",
      tier: "avanzado",
      tagline: "Abastecimiento mayorista para liderar distribución en tu zona",
      descripcion:
        "Volumen mayorista de frascos de 150g, 500g y unidades de degustación de 25g para abastecer tu red comercial.",
      precioNetoClp: 460000,
      pvpEstimadoClp: 820000,
      margenEstimadoPct: 44,
      moqSummary: "120 frascos 150g + 36 frascos 500g + 100 minis 25g",
      componentesFisicos: [
        {
          cantidad: "120 un.",
          item: "Frascos 150g surtidos",
          detalle: "Stock de distribución para reposición inmediata",
        },
        {
          cantidad: "36 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Stock mayor de miel tradicional",
        },
        {
          cantidad: "100 un.",
          item: "Mini frascos 25g cortesía",
          detalle: "Para activación de nuevos clientes y degustación",
        },
      ],
      materialesExhibicion: [],
      integracionesDigitales: [
        {
          titulo: "Condiciones de Distribuidor Mayorista",
          descripcion:
            "Margen escalado protegido y soporte logístico prioritario",
          tag: "pricing",
        },
      ],
      recomendadoPara:
        "Distribuidores gastronómicos regionales y representantes con red de locales",
    },
  ],
};

export const SEGMENT_QUESTIONS: Record<B2BSegmentSlug, SegmentQuestion[]> = {
  cafeterias: [
    {
      id: "formato_prioritario",
      label: "Formato de interés para tu espacio (opcional)",
      type: "select",
      required: false,
      options: [
        { value: "mesa_25g", label: "Servicio de mesa con piezas individuales de 25g" },
        { value: "vitrina_150g", label: "Vitrina de retail para llevar a casa (frascos 150g)" },
        { value: "barra_granel", label: "Uso interno de barra y repostería (500g / granel)" },
        { value: "integral", label: "Kit integral: mesa + barra + vitrina de exhibición" },
      ],
    },
  ],

  hoteles: [
    {
      id: "capacidad_habitaciones",
      label: "Escala de hospitalidad",
      type: "select",
      required: true,
      options: [
        { value: "hasta_15", label: "Hasta 15 habitaciones (Lodge boutique / Exclusivo)" },
        { value: "16_50", label: "16 a 50 habitaciones (Hotel de autor / Patrimonial)" },
        { value: "mas_50", label: "Más de 50 habitaciones (Gran hotel / Resort)" },
      ],
    },
    {
      id: "enfoque_servicio",
      label: "Enfoque prioritario de servicio",
      type: "select",
      required: true,
      options: [
        { value: "amenities_habitacion", label: "Amenities en habitación (frascos 25g de bienvenida)" },
        { value: "buffet_desayuno", label: "Buffet de desayuno & gastronomía austral" },
        { value: "tienda_lobby", label: "Boutique de recepción & regalos de cortesía" },
        { value: "integral", label: "Experiencia completa: habitación, buffet y tienda" },
      ],
    },
    {
      id: "area_contacto",
      label: "Área o departamento de contacto",
      type: "select",
      required: false,
      options: [
        { value: "alimentos_bebidas", label: "Alimentos & Bebidas (A&B)" },
        { value: "operaciones_gerencia", label: "Operaciones / Gerencia de Hospitalidad" },
        { value: "adquisiciones_compras", label: "Adquisiciones & Compras" },
      ],
    },
  ],

  "tiendas-gourmet": [
    {
      id: "tipo_espacio",
      label: "Espacio de exhibición disponible",
      type: "select",
      required: true,
      options: [
        { value: "meson_caja", label: "Mesón de caja / Punto de cobro" },
        { value: "estante_dedicado", label: "Estante dedicado de productos de autor" },
        { value: "gondola_gourmet", label: "Góndola principal de especialidad" },
      ],
    },
    {
      id: "volumen_proyectado",
      label: "Volumen mensual proyectado de reposición",
      type: "select",
      required: true,
      options: [
        { value: "12_24", label: "12 a 24 frascos / mes (Rotación boutique)" },
        { value: "25_60", label: "25 a 60 frascos / mes (Emporio consolidado)" },
        { value: "mas_60", label: "Más de 60 frascos / mes (Múltiples sucursales)" },
      ],
    },
    {
      id: "enfoque_producto",
      label: "Interés prioritario de catálogo",
      type: "select",
      required: false,
      options: [
        { value: "cremas_botanicas", label: "Cremas botánicas (Avellana, Cacao, Polen)" },
        { value: "miel_reserva", label: "Miel Cruda Tradicional & Reserva 500g" },
        { value: "cajas_regalo", label: "Estuches de presentación y regalo" },
        { value: "catalogo_completo", label: "Línea completa de frascos y cremas" },
      ],
    },
  ],

  ferias: [
    {
      id: "tipo_evento",
      label: "Tipo de encuentro o presentación",
      type: "select",
      required: true,
      options: [
        { value: "feria_gastronomica", label: "Feria gastronómica de autor o festival de café" },
        { value: "mercado_diseno", label: "Mercado de diseño / Colectivo artesanal" },
        { value: "activacion_privada", label: "Activación privada, congreso o evento corporativo" },
      ],
    },
    {
      id: "afluencia_estimada",
      label: "Afluencia o asistentes proyectados",
      type: "select",
      required: true,
      options: [
        { value: "menos_200", label: "Hasta 200 asistentes" },
        { value: "200_1000", label: "200 a 1.000 asistentes" },
        { value: "mas_1000", label: "Más de 1.000 asistentes" },
      ],
    },
    {
      id: "modalidad_degustacion",
      label: "Modalidad de experiencia requerida",
      type: "select",
      required: false,
      options: [
        { value: "degustacion_guiada", label: "Muestras de degustación sensorial guiada" },
        { value: "venta_directa", label: "Stand de venta directa al público con terminal POS" },
        { value: "regalos_conmemorativos", label: "Regalos de salida conmemorativos" },
      ],
    },
  ],

  revendedores: [
    {
      id: "zona_distribucion",
      label: "Área o región principal de distribución",
      type: "text",
      placeholder: "Ej. Región de Los Lagos / Puerto Varas / Castro",
      required: true,
      helpText: "Indica tu zona geográfica de actuación para proteger tu territorio.",
    },
    {
      id: "canal_venta",
      label: "Canal preferente de difusión",
      type: "select",
      required: true,
      options: [
        { value: "venta_directa", label: "Venta directa y personalizada a clientes finales" },
        { value: "tienda_colaborativa", label: "Espacio colaborativo o tienda propia" },
        { value: "eventos_ferias", label: "Mercados, ferias locales y pop-ups" },
        { value: "red_gastronomica", label: "Abastecimiento a cafeterías o restaurantes locales" },
      ],
    },
    {
      id: "proyeccion_reposicion",
      label: "Cadencia de reposición estimada",
      type: "select",
      required: false,
      options: [
        { value: "inicial_prueba", label: "Pedido inicial de validación" },
        { value: "mensual", label: "Reposición mensual activa" },
        { value: "quincenal", label: "Reposición quincenal / Alto movimiento" },
      ],
    },
  ],
};

export function getSegmentKits(slug: string, cmsKits?: B2BKitItem[]): SegmentKit[] {
  if (cmsKits && cmsKits.length > 0) {
    return cmsKits.map(normalizeCmsKit);
  }
  if (!isValidSegment(slug)) return [];
  return SEGMENT_KITS[slug] ?? [];
}

export function getSegmentQuestions(slug: string): SegmentQuestion[] {
  if (!isValidSegment(slug)) return [];
  return SEGMENT_QUESTIONS[slug] ?? [];
}

export function getSegmentKitById(slug: string, kitId: string, cmsKits?: B2BKitItem[]): SegmentKit | undefined {
  const kits = getSegmentKits(slug, cmsKits);
  return kits.find((k) => k.id === kitId);
}

