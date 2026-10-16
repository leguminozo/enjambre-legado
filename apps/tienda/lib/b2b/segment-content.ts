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
      return { titulo: i.titulo, descripcion: i.descripcion, tag: i.tag || 'trazabilidad' };
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
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
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
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
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
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp",
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
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/814aaec5-330b-4ff2-8872-0c540b0e7825.webp",
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
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/bd874e95-611d-4d04-ad3a-d28a7fd7d6f5.webp",
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
      id: "piloto-mesa-barra",
      nombre: "Set Piloto de Mesa & Barra",
      badge: "Iniciación · Sin Riesgo",
      tier: "entrada",
      tagline: "Herramientas de servicio de mesa y vitrina para tu barra",
      descripcion:
        "Una selección ágil y sin fricción de las 4 cremas batidas en frío para validar la respuesta del comensal en mesa y vitrina, con soporte impreso A6 de origen.",
      precioNetoClp: 69000,
      pvpEstimadoClp: 119000,
      margenEstimadoPct: 42,
      moqSummary: "48 frascos 25g + 6 frascos 150g + láminas A6",
      salesStrategy:
        "Monodosis de 25g de acompañamiento en bandeja junto a la taza, venta directa de 150g en mesón y soporte A6 para exhibición en mesa.",
      componentesFisicos: [
        {
          cantidad: "48 un.",
          item: "Crema de Miel 25g (mesa)",
          detalle: "12 Floral (con panal), 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral",
        },
        {
          cantidad: "6 un.",
          item: "Frascos 150g vitrina",
          detalle: "Venta directa en mesón para llevar a casa (amortiza el kit)",
        },
        {
          cantidad: "1 pack",
          item: "Láminas A6 de Mesa (105 × 148 mm)",
          detalle: "Soportes de mesa con protocolo sensorial ST-CATA y QR de fidelización",
        },
      ],
      materialesExhibicion: [
        "Pack de láminas A6 de mesa laminadas para exhibición",
      ],
      integracionesDigitales: [
        {
          titulo: "Lámina A6 de Mesa & QR Soberano",
          descripcion:
            "Protocolo de cata rápida en 60s con 1 sello de bienvenida y 25 puntos para el comensal",
          tag: "trazabilidad",
        },
        {
          titulo: "Guía de Parámetros Barista",
          descripcion:
            "Límite térmico <40°C y técnica de vertido post-texturizado de leche",
          tag: "marketing",
        },
      ],
      recomendadoPara:
        "Barras de especialidad, cafeterías boutique y tostadurías que inician experiencia en mesa",
    },
    {
      id: "reserva-barra-vitrina",
      nombre: "Reserva Barra & Vitrina Autor",
      badge: "Abastecimiento Completo",
      tier: "avanzado",
      tagline: "Suministro continuo de mesa, vitrina retail y miel técnica para barista",
      descripcion:
        "El plan escalado para cafeterías consolidadas que han validado la experiencia en mesa y buscan abastecer rotación continua, venta directa en mesón y formulación de bebidas de la casa.",
      precioNetoClp: 249000,
      pvpEstimadoClp: 415000,
      margenEstimadoPct: 40,
      moqSummary: "144 frascos 25g + 24 frascos 150g + 4 potes 500g",
      salesStrategy:
        "Integración total: 25g en mesa diaria, alta rentabilidad en vitrina retail 150g y 500g para syrups fríos, barismo y repostería.",
      componentesFisicos: [
        {
          cantidad: "144 un.",
          item: "Crema de Miel 25g (mesa)",
          detalle: "36 Floral (con panal), 36 Avellana Chilena, 36 Cacao Santander, 36 Polen Floral",
        },
        {
          cantidad: "24 un.",
          item: "Frascos 150g vitrina retail",
          detalle: "6 de cada variedad para venta directa de mesón",
        },
        {
          cantidad: "4 un.",
          item: "Potes 500g miel técnica barista",
          detalle: "Para syrups fríos, cold brew, lattes de autor y cocina dulce",
        },
        {
          cantidad: "1 pack",
          item: "Set Completo Láminas A6 Plastificadas",
          detalle: "Láminas A6 durables para todas las mesas del local + atril de exhibición",
        },
      ],
      materialesExhibicion: [
        "Atril de mesón y set completo de láminas A6 plastificadas",
      ],
      integracionesDigitales: [
        {
          titulo: "Activación en Mapa Público de Cafeterías",
          descripcion:
            "Visibilidad oficial para comensales en la red de cafeterías aliadas de Enjambre Legado",
          tag: "resenas",
        },
        {
          titulo: "Reposición Preferente & Tramo Mayorista",
          descripcion:
            "Acceso inmediato a lista B2B y 5% de descuento por volumen en reposición continua",
          tag: "pricing",
        },
        {
          titulo: "Protocolo de Reseñas Verificadas de Mesa",
          descripcion:
            "Tus mesas nutren el catálogo público con reseñas de degustación en cafetería",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara:
        "Cafeterías de especialidad de mediano y alto flujo, tostadurías con salón y barras consolidadas",
    },
  ],

  hoteles: [
    {
      id: "bienvenida-boutique",
      nombre: "Set Piloto Bienvenida & Amenities",
      badge: "Iniciación de Hospitalidad",
      tier: "entrada",
      tagline: "Amenities de 25g que elevan la bienvenida del huésped en habitación",
      descripcion:
        "Mini frascos de crema de miel cruda con tapa dorada y Pasaporte A6 de Habitación bilingüe que introduce al huésped en la riqueza botánica del bosque chilote.",
      precioNetoClp: 89000,
      pvpEstimadoClp: 155000,
      margenEstimadoPct: 42,
      moqSummary: "72 frascos 25g + 72 pasaportes A6",
      salesStrategy:
        "Entrega un amenity memorable en habitación con QR bilingüe que induce al huésped a solicitar el set de regalo en recepción antes de su checkout.",
      componentesFisicos: [
        {
          cantidad: "72 un.",
          item: "Mini frascos 25g cortesía",
          detalle: "Tapa dorada y sello de garantía botánica (18 Floral, 18 Avellana, 18 Cacao, 18 Polen)",
        },
        {
          cantidad: "72 un.",
          item: "Pasaportes A6 de Habitación (105 × 148 mm)",
          detalle: "Papel mineral impreso en alta resolución con relato de bosque a 42°S y QR de bienvenida",
        },
      ],
      materialesExhibicion: [
        "Pack de Pasaportes A6 de habitación con guía de servicio e infusión",
      ],
      integracionesDigitales: [
        {
          titulo: "Experiencia Sensorial Digital",
          descripcion:
            "El huésped escanea el QR del frasco y realiza una cata guiada desde su teléfono",
          tag: "trazabilidad",
        },
        {
          titulo: "Activación de Bienvenida al Huésped",
          descripcion:
            "Acreditación de bienvenida con +25 puntos en el Club Legado para su próxima estadía",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara: "Lodges boutique, hoteles de autor y bed & breakfast premium",
    },
    {
      id: "gran-hospitalidad",
      nombre: "Reserva Total Hospitalidad & Boutique Lobby",
      badge: "Experiencia Completa",
      tier: "avanzado",
      tagline: "Amenities de suite, salón de desayuno buffet y vitrina de venta para souvenirs",
      descripcion:
        "Integración integral que cubre amenities en habitación, servicio de desayuno austral sin plástico y selección de frascos para que los huéspedes adquieran miel como recuerdo de viaje.",
      precioNetoClp: 289000,
      pvpEstimadoClp: 495000,
      margenEstimadoPct: 42,
      moqSummary: "144 frascos 25g + 8 potes 500g + 24 frascos 150g",
      salesStrategy:
        "La solución total: cubre habitaciones (amenities), salón de desayuno (elimina plásticos de un solo uso) y la boutique del lobby para capturar ventas de souvenirs con 45% de margen.",
      componentesFisicos: [
        {
          cantidad: "144 un.",
          item: "Mini frascos 25g amenities",
          detalle: "Para suites, habitaciones preferentes y turndown service",
        },
        {
          cantidad: "8 un.",
          item: "Potes 500g para salón de desayuno",
          detalle: "Miel cruda de bosque nativo sin filtrar para reposición fluida en buffet",
        },
        {
          cantidad: "24 un.",
          item: "Frascos 150g para tienda del lobby",
          detalle: "Ediciones numeradas con empaque para regalo al checkout",
        },
        {
          cantidad: "1 pack",
          item: "Set Completo Pasaportes A6 Plastificados",
          detalle: "Soportes durables para habitaciones y atril de buffet",
        },
      ],
      materialesExhibicion: [
        "Atril de mostrador para recepción y set completo de pasaportes A6",
      ],
      integracionesDigitales: [
        {
          titulo: "Ficha Botánica y Reseñas Bilingües",
          descripcion:
            "Respaldo analítico visible en inglés y español para visitantes internacionales",
          tag: "resenas",
        },
        {
          titulo: "Despacho Programado Continuo",
          descripcion:
            "Garantía de stock reservado anual según curva de ocupación hotelera",
          tag: "pricing",
        },
      ],
      recomendadoPara: "Hoteles 4 y 5 estrellas, lodges de lujo y complejos turísticos con boutique",
    },
  ],

  "tiendas-gourmet": [
    {
      id: "vitrina-autor",
      nombre: "Set Piloto Vitrina & Sello Botánico",
      badge: "Iniciación Gourmet",
      tier: "entrada",
      tagline: "El set indispensable para probar rotación en tu mostrador con respaldo analítico",
      descripcion:
        "Selección de 24 frascos de 150g en las variedades más apreciadas para mesón de venta y rotación ágil, con displays A6 de vitrina con sello analítico Codex.",
      precioNetoClp: 75000,
      pvpEstimadoClp: 130000,
      margenEstimadoPct: 42,
      moqSummary: "24 frascos 150g surtidos + displays A6",
      salesStrategy:
        "Coloca los 24 frascos en el mostrador o mesón de cobro para compras de impulso con margen del 42%.",
      componentesFisicos: [
        {
          cantidad: "24 un.",
          item: "Frascos 150g surtidos",
          detalle: "8 Miel Cruda Floral, 8 Crema con Avellana, 4 Crema con Cacao, 4 Crema con Polen",
        },
        {
          cantidad: "1 pack",
          item: "Displays A6 de Vitrina (Shelf-Talkers)",
          detalle: "Fichas con garantía analítica Codex (<17.5% humedad, invertasa viva) y QR de trazabilidad",
        },
      ],
      materialesExhibicion: [
        "Displays A6 de mostrador con garantía analítica de lote",
      ],
      integracionesDigitales: [
        {
          titulo: "Reseñas Verificadas de Cata",
          descripcion:
            "Tus clientes escanean y comprueban las opiniones reales de otros compradores",
          tag: "resenas",
        },
        {
          titulo: "Trazabilidad de Lote y Colmenar",
          descripcion:
            "Verificación digital en tiempo real del análisis de polen y apicultor custodio",
          tag: "trazabilidad",
        },
      ],
      recomendadoPara: "Tiendas gourmet, emporios barriales, vinotecas y panaderías artesanales",
    },
    {
      id: "emporio-selecto",
      nombre: "Reserva Emporio Maestro & Colección",
      badge: "Abastecimiento Completo",
      tier: "avanzado",
      tagline: "El mix completo de formatos de 150g y 500g Reserva para clientes habituales",
      descripcion:
        "Surtido balanceado de frascos de 150g y frascos de 500g Reserva del Bosque para abastecer consumo de mesa y amantes de la miel tradicional con margen protegido del 43%+.",
      precioNetoClp: 249000,
      pvpEstimadoClp: 435000,
      margenEstimadoPct: 43,
      moqSummary: "60 frascos 150g + 16 frascos 500g + material vitrina",
      salesStrategy:
        "La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina, generando recompra recurrente cada 3 semanas.",
      componentesFisicos: [
        {
          cantidad: "60 un.",
          item: "Frascos 150g vitrina",
          detalle: "20 Miel Cruda Floral, 20 Crema Avellana, 10 Crema Cacao, 10 Crema Polen",
        },
        {
          cantidad: "16 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Edición mayor con numeración de lote y origen botánico protegido",
        },
        {
          cantidad: "1 pack",
          item: "Material Completo de Exhibición",
          detalle: "Atril de madera nativa + fichas analíticas enmarcables de laboratorio",
        },
      ],
      materialesExhibicion: [
        "Atril de mesón y set completo de displays de vitrina plastificados",
      ],
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
            "Reordenamiento en 1 clic desde el portal con condiciones comerciales mayoristas blindadas",
          tag: "pricing",
        },
      ],
      recomendadoPara: "Emporios consolidados, tiendas de vinos y quesos, y locales de autor",
    },
  ],

  ferias: [
    {
      id: "stand-degustacion",
      nombre: "Set Piloto Stand & Degustación en Vivo",
      badge: "Presencia en Eventos",
      tier: "entrada",
      tagline: "Montaje ágil para ferias gastronómicas y mercados de diseño",
      descripcion:
        "Diseñado para montajes temporales con formatos de degustación de impulso de 25g y frascos de 150g listos para venta inmediata al paso.",
      precioNetoClp: 89000,
      pvpEstimadoClp: 155000,
      margenEstimadoPct: 42,
      moqSummary: "72 mini frascos 25g + 18 frascos 150g",
      salesStrategy:
        "Los mini frascos de impulso y frascos de mesa garantizan un flujo ininterrumpido de ventas sin objeción de precio.",
      componentesFisicos: [
        {
          cantidad: "72 un.",
          item: "Mini frascos 25g de impulso",
          detalle: "Surtido de 4 variedades con tapa dorada para degustación y venta ágil",
        },
        {
          cantidad: "18 un.",
          item: "Frascos 150g de autor",
          detalle: "Variedades surtidas para venta directa de mesa",
        },
        {
          cantidad: "1 pack",
          item: "Guía de Cata en Vivo para Mesón",
          detalle: "Ficha plastificada para degustación sensorial con comensales",
        },
      ],
      materialesExhibicion: [
        "Guía de cata en vivo y soporte QR de cobro",
      ],
      integracionesDigitales: [
        {
          titulo: "QR de Cobro y Registro Rápido",
          descripcion:
            "Cobro ágil y captura de comensales para el programa de fidelización",
          tag: "fidelizacion",
        },
        {
          titulo: "Puntos de Bienvenida en Feria",
          descripcion:
            "El cliente registra su cata in situ y gana sus primeros 25 puntos Club Legado",
          tag: "marketing",
        },
      ],
      recomendadoPara: "Productores, feriantes gourmet y activaciones de fin de semana",
    },
    {
      id: "encuentro-gastronomico",
      nombre: "Pabellón Gastronómico & Activación Masiva",
      badge: "Activación de Alto Flujo",
      tier: "avanzado",
      tagline: "Para festivales gastronómicos, pabellones de autor y pop-ups de alto flujo",
      descripcion:
        "Capacidad para atender degustaciones continuas y ofrecer frascos de mesa y familiares con excelente margen, respaldado por la app de venta móvil en terreno.",
      precioNetoClp: 249000,
      pvpEstimadoClp: 435000,
      margenEstimadoPct: 43,
      moqSummary: "144 mini frascos 25g + 36 frascos 150g + 12 frascos 500g",
      salesStrategy:
        "Cobertura total del evento: degustación masiva en 25g, frascos de 150g para compra al paso y frascos de 500g para amantes de la miel tradicional.",
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
        {
          cantidad: "1 pack",
          item: "Display Completo de Stand",
          detalle: "Atril de mesón + guías de cata en vivo plastificadas",
        },
      ],
      materialesExhibicion: [
        "Atril de mesón y display completo de degustación",
      ],
      integracionesDigitales: [
        {
          titulo: "Acceso a App Móvil de Terreno",
          descripcion:
            "POS offline en apps/campo con cobro rápido y sincronización automática",
          tag: "pricing",
        },
        {
          titulo: "Reseñas de Evento en Vivo",
          descripcion:
            "Los asistentes dejan comentarios en vivo durante el evento",
          tag: "resenas",
        },
      ],
      recomendadoPara: "Participantes en ferias gastronómicas, festivales de café y pabellones",
    },
  ],

  revendedores: [
    {
      id: "maletin-embajador",
      nombre: "Set Piloto Embajador Territorial",
      badge: "Iniciación de Representante",
      tier: "entrada",
      tagline: "El set esencial de formatos de mano para iniciar tu red personal",
      descripcion:
        "Stock inicial de 18 frascos de 150g para entrega inmediata, muestras de degustación y código de revendedor asignado con enlace personalizado en la plataforma.",
      precioNetoClp: 65000,
      pvpEstimadoClp: 115000,
      margenEstimadoPct: 43,
      moqSummary: "18 frascos 150g surtidos + muestras",
      salesStrategy:
        "Inicia ventas en tu red cercana; recupera la inversión total del kit en mano y genera tus primeros ingresos de inmediato.",
      componentesFisicos: [
        {
          cantidad: "18 un.",
          item: "Frascos 150g de autor",
          detalle: "Variedades de mayor demanda para entrega inmediata (6 Cruda, 6 Avellana, 3 Cacao, 3 Polen)",
        },
        {
          cantidad: "1 pack",
          item: "Muestras de Degustación en Frío",
          detalle: "Frasquitos y paletas para dar a probar a potenciales clientes",
        },
      ],
      materialesExhibicion: [
        "Folletería digital y guía de degustación de bolsillo",
      ],
      integracionesDigitales: [
        {
          titulo: "Enlace de Embajador Asignado",
          descripcion:
            "Enlace personalizado con código integrado para compartir en WhatsApp y redes",
          tag: "trazabilidad",
        },
        {
          titulo: "Pack Digital de Ventas",
          descripcion:
            "Fotografías en alta resolución, fichas botánicas y textos listos para compartir",
          tag: "marketing",
        },
      ],
      recomendadoPara: "Nuevos representantes territoriales y distribuidores independientes",
    },
    {
      id: "stock-rotacion",
      nombre: "Stock de Distribución & Rotación Zonal",
      badge: "Ruta Activa & Escala",
      tier: "avanzado",
      tagline: "Volumen para abastecer clientes frecuentes y ventas directas con margen del 44%+",
      descripcion:
        "El balance perfecto de frascos de 150g, frascos de 500g Reserva y piezas de 25g de apertura para cerrar pedidos recurrentes en tu zona.",
      precioNetoClp: 219000,
      pvpEstimadoClp: 390000,
      margenEstimadoPct: 44,
      moqSummary: "54 frascos 150g + 14 frascos 500g + 50 minis 25g",
      salesStrategy:
        "Atiende pedidos recurrentes de familias y comercios locales con frascos de 150g y 500g, utilizando las piezas de 25g para abrir nuevos clientes.",
      componentesFisicos: [
        {
          cantidad: "54 un.",
          item: "Frascos 150g surtidos",
          detalle: "Miel pura y cremas botánicas de alta demanda",
        },
        {
          cantidad: "14 un.",
          item: "Frascos 500g Reserva del Bosque",
          detalle: "Edición mayor para compras familiares y amantes de la miel pura",
        },
        {
          cantidad: "50 un.",
          item: "Mini frascos 25g cortesía",
          detalle: "Para degustación y apertura de nuevos compradores",
        },
      ],
      materialesExhibicion: [
        "Atril portátil de exhibición para muestras",
      ],
      integracionesDigitales: [
        {
          titulo: "Crédito de Retribución en Portal",
          descripcion:
            "Seguimiento de compras acumuladas a 12 meses y crédito descontable en nuevos pedidos",
          tag: "pricing",
        },
        {
          titulo: "Herramienta de Reposición Móvil",
          descripcion: "Gestión ágil de pedidos desde tu teléfono con escala de descuentos mayorista",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara: "Revendedores activos con cartera de clientes y rutas comerciales",
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

