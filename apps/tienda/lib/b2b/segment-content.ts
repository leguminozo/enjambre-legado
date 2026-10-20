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
    kicker: "ALIANZAS B2B · CAFETERÍAS DE ESPECIALIDAD & TOSTADURÍAS",
    headline: "El café de especialidad no se endulza en taza. Se acompaña en mesa.",
    subheadline:
      "Cuatro cremas de miel cruda batida en frío recolectadas en el bosque nativo de Chiloé (42°S), presentadas en piezas individuales de 25 g para servicio en mesa y frascos de 150 g para venta en mostrador. Respaldo analítico de origen y margen comercial del 41% al 48% para tu barra.",
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
    valueProps: [
      {
        icon: "Droplets",
        title: "01. Servicio al Lado de la Taza (< 40 °C)",
        description:
          "Servido en pieza cilíndrica de vidrio de 25 g junto a la taza. El comensal degusta la crema batida en frío en paladar antes o entre sorbos de café, preservando los aromas botánicos y la extracción calibrada del barista.",
      },
      {
        icon: "Layers",
        title: "02. Textura Cremada Sin Goteo",
        description:
          "Microcristalización mecánica en frío a menos de 20 °C (< 18% de humedad controlada). Textura sedosa que mantiene en suspensión homogénea la avellana chilena, el cacao y el polen nativo, sin goteos ni mermas en barra.",
      },
      {
        icon: "QrCode",
        title: "03. Trazabilidad Analítica QR por Lote",
        description:
          "Cada frasco de 25 g y 150 g integra acceso digital al apiario de origen en Pureo (Queilén, Chiloé), porcentaje de polen nativo, fecha de recolección y notas de cata para tu equipo.",
      },
    ],
    stats: [
      { value: '< 18%', label: 'Humedad Certificada' },
      { value: '0% Calor', label: 'Cruda y sin pasteurizar' },
      { value: '25g / 150g', label: 'Mesa y Vitrina' },
      { value: '41–48%', label: 'Margen neto real' },
    ],
    process: [
      {
        step: '01',
        title: '25 g — Pieza de mesa (Sidecar)',
        desc: 'Servido en bandeja junto a la taza con microespátula de cata. El comensal degusta la crema en paladar antes o entre sorbos de café, preservando aromas florales sin alterar la extracción.',
      },
      {
        step: '02',
        title: '150 g — Reserva de vitrina (Retail)',
        desc: 'Exhibido en el mesón de caja junto a las bolsas de café de 250 g. Captura la compra por impulso del cliente que acaba de probar el maridaje en mesa.',
      },
      {
        step: '03',
        title: 'Tester de barra bonificado',
        desc: 'A partir del Kit Tracción Barista, frascos de 150 g sin costo para que tu equipo ofrezca microdegustaciones de 5 segundos al ordenar, activando la rotación orgánica.',
      },
    ],
    suggestedProductsCopy: 'Disponibles en Pieza de Mesa (25 g) y Reserva de Vitrina (150 g). Cuatro expresiones botánicas diseñadas para armonizar con el método de extracción y perfil de tueste de tu barra.',
    ctaText: "Activar Kit Piloto ($78.400 neto)",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Por qué servir el formato de 25 g junto a la taza (Sidecar) y no disuelto adentro?",
        answer:
          "Porque las altas temperaturas evaporan los aromas florales más sutiles de la miel cruda y alteran el equilibrio de acidez de una extracción calibrada. La degustación secuencial con microespátula respeta al 100% el trabajo del barista y permite disfrutar ambos perfiles en contrapunto.",
      },
      {
        question: "¿Se endurece o separa la miel en la barra?",
        answer:
          "No. Nuestro proceso de cremado mecánico en frío a menos de 20 °C genera cristales microscópicos homogéneos, manteniendo una textura suave y untable que no se separa ni endurece a temperatura ambiente.",
      },
      {
        question: "¿Cómo se capacita al equipo de baristas para asegurar la rotación?",
        answer:
          "Cada kit incluye fichas técnicas de cata A6 y, a partir del Kit Tracción Barista, incorporamos frascos Tester de 150 g sin costo para que tu equipo ofrezca microcatas en barra en 5 segundos, disparando la venta en mesa y vitrina.",
      },
    ],
    seo: {
      title: "Alianzas B2B Cafeterías & Tostadurías · La Obrera y el Zángano",
      description:
        "Maridaje botánico en piezas de 25g y frascos de 150g para cafeterías de especialidad. Miel cruda de Chiloé 42°S con 41% a 48% de margen real.",
    },
  },

  hoteles: {
    slug: "hoteles",
    tipo: "hotel",
    kicker: "ALIANZAS B2B · HOSPITALIDAD DE AUTOR & LODGES",
    headline: "Miel Cruda de Bosque Nativo de Chiloé (42°S) para Hotelería de Autor",
    subheadline:
      "Formatos en 25 g para amenidad de bienvenida y cata en mesa de desayuno, y frascos de 150 g para vitrina de recepción y boutique. Miel cruda certificada de bosque nativo que transforma la cortesía en un recuerdo de viaje.",
    heroImage: "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
    valueProps: [
      {
        icon: "ShieldCheck",
        title: "Amenidad de Bienvenida en Habitación (25 g)",
        description:
          "Frasco individual de vidrio con apertura sellada para turndown nocturno o bandeja de llegada, sin plásticos de un solo uso.",
      },
      {
        icon: "Layers",
        title: "Cata en Salón de Desayuno",
        description:
          "Formato para mesa de desayuno de autor que acompaña quesos de campo, bollería de masa madre e infusiones nativas con textura untable sin goteo.",
      },
      {
        icon: "TrendingUp",
        title: "Frasco de Recuerdo en Recepción (150 g)",
        description:
          "Producto de alta rotación en el checkout para que el huésped lleve el sabor del bosque consigo. Formato apto para equipaje de mano en vuelos nacionales e internacionales.",
      },
      {
        icon: "QrCode",
        title: "Trazabilidad y Análisis de Lote",
        description:
          "Cada frasco enlaza al pasaporte de lote oficial: humedad < 18%, análisis de polen nativo y coordenadas exactas del apiario en Chiloé.",
      },
    ],
    stats: [
      { value: '25 g', label: 'Amenidad de Habitación' },
      { value: '150 g', label: 'Formato Souvenir Boutique' },
      { value: '< 18%', label: 'Humedad Controlada' },
      { value: 'Chiloé 42°S', label: 'Apiarios Fijos de Bosque' },
    ],
    process: [
      {
        step: '01',
        title: '25 g — Amenidad en Habitación & Mesa',
        desc: 'Servicio nocturno de apertura de cama (turndown ritual), cata en mesa de desayuno y acompañamiento para infusiones nativas.',
      },
      {
        step: '02',
        title: '150 g — Formato de Recuerdo en Recepción',
        desc: 'Exhibición en el atril de mesón de recepción. Formato de reserva para que el huésped lo adquiera como souvenir gastronómico.',
      },
      {
        step: '03',
        title: 'Retorno y Sostenibilidad del Servicio',
        desc: 'La rotación en el checkout y boutique amortiza el costo de las amenidades de bienvenida, ofreciendo una experiencia memorable de alto estándar.',
      },
    ],
    suggestedProductsCopy: 'Disponibles en Formato 25 g (Amenidad & Desayuno) y Frasco 150 g (Boutique de Recepción). Cuatro variedades botánicas de Chiloé diseñadas para bienvenida en suite, mesa de desayuno y boutique.',
    ctaText: "Solicitar Muestras de Degustación",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo se presenta el envase de 150 g para huéspedes que viajan?",
        answer:
          "Nuestros frascos de 150 g están herméticamente sellados con lacre y etiqueta de alta resistencia. Su volumen y dimensiones son aptos para transporte seguro en equipaje de viaje.",
      },
      {
        question: "¿Cuál es el origen y estándar botánico de la miel de Ulmo?",
        answer:
          "Miel cruda monofloral de Eucryphia cordifolia recolectada en apiarios fijos del bosque nativo de Chiloé, bajo norma chilena NCh2981 con más del 45% de dominancia polínica y humedad natural menor al 18%.",
      },
      {
        question: "¿Cómo se conserva la Miel con Avellana Chilena?",
        answer:
          "Elaboramos una emulsión mecánica en frío que integra avellana chilena silvestre tostada en la miel cruda, manteniendo una textura cremada homogénea sin separación de fases ni conservantes artificiales durante más de 12 meses.",
      },
      {
        question: "¿Cómo solicitar muestras de degustación antes de emitir una orden?",
        answer:
          "A través del formulario de esta página. Despachamos a gerencia general o jefatura de alimentos y bebidas una selección de degustación para validar texturas, notas aromáticas y presentación de sala.",
      },
    ],
    seo: {
      title: "Hospitalidad de Lujo & Bio-Gastronomía · Enjambre Legado",
      description:
        "Bio-gastronomía del bosque lluvioso de Chiloé (42°S) para hotelería de autor y lodges. Sistema modular en 25g y 150g con modelo financiero de costo neto cero.",
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
      id: "piloto-validacion",
      nombre: "KIT 01: Piloto de Validación (15 Días)",
      badge: "Iniciación · Sin Riesgo",
      tier: "starter",
      tagline: "Validar rotación en mesa y vitrina con riesgo financiero mínimo",
      descripcion:
        "Una selección ágil y sin fricción de las 4 formulaciones botánicas en 25 g y 150 g para comprobar la aceptación en mesa y vitrina con soporte técnico y exhibidor de mostrador.",
      precioNetoClp: 78400,
      pvpEstimadoClp: 159200,
      margenEstimadoPct: 41,
      moqSummary: "32 piezas 25g + 8 frascos 150g + exhibidor",
      salesStrategy:
        "Inversión: $78.400 neto (~$93.296 IVA inc.). Venta total: $159.200 PVP ($133.782 venta neta). Utilidad neta limpia: +$55.382 netos (41,4% margen real, +70,6% ROI).",
      componentesFisicos: [
        {
          cantidad: "32 un.",
          item: "Piezas de Mesa 25g",
          detalle: "8 Virgen Ulmo, 8 Avellana Chilena, 8 Cacao Santander, 8 Polen Floral",
        },
        {
          cantidad: "8 un.",
          item: "Reserva de Vitrina 150g",
          detalle: "2 Virgen Ulmo, 2 Avellana Chilena, 2 Cacao Santander, 2 Polen Floral",
        },
        {
          cantidad: "1 un.",
          item: "Exhibidor Minimalista",
          detalle: "Display de mostrador compacto para mesón de pago",
        },
        {
          cantidad: "12 un.",
          item: "Tarjetas de Mesa A6",
          detalle: "Fichas de mesa con protocolo de cata y QR de lote",
        },
      ],
      materialesExhibicion: [
        "Exhibidor minimalista de mostrador",
        "12 tarjetas de mesa A6 con QR de lote y protocolo de maridaje",
      ],
      integracionesDigitales: [
        {
          titulo: "Trazabilidad Analítica QR por Lote",
          descripcion:
            "Acceso directo a análisis de laboratorio (humedad <18%, HMF 2,76 mg/kg, diastasa 23,1 Schade)",
          tag: "trazabilidad",
        },
        {
          titulo: "Protocolo Barista Botanical Sidecar",
          descripcion:
            "Guía técnica para servir la crema en frío (<40°C) sin alterar el pH del café",
          tag: "marketing",
        },
      ],
      recomendadoPara:
        "Barras de especialidad y tostadurías independientes que inician validación en mesa y vitrina",
    },
    {
      id: "traccion-barista",
      nombre: "KIT 02: Tracción Barista (Mensual · Recomendado)",
      badge: "Más Elegido · Recomendado",
      tier: "growth",
      tagline: "Abastecimiento mensual estándar para 1 local con impulso activo de baristas",
      descripcion:
        "El equilibrio perfecto entre rotación de salón y venta retail. Incluye 4 frascos Tester bonificados de 150 g para ofrecer microcatas gratuitas de 5 segundos en caja.",
      precioNetoClp: 204000,
      pvpEstimadoClp: 436000,
      margenEstimadoPct: 44,
      moqSummary: "80 piezas 25g + 24 frascos 150g + 4 Testers bonificados",
      salesStrategy:
        "Inversión: $204.000 neto (~$242.760 IVA inc.). Venta total: $436.000 PVP ($366.387 venta neta). Utilidad neta limpia: +$162.387 netos (44,3% margen real, +79,6% ROI).",
      componentesFisicos: [
        {
          cantidad: "80 un.",
          item: "Piezas de Mesa 25g",
          detalle: "20 Virgen Ulmo, 20 Avellana Chilena, 20 Cacao Santander, 20 Polen Floral",
        },
        {
          cantidad: "24 un.",
          item: "Reserva de Vitrina 150g",
          detalle: "6 Virgen Ulmo, 6 Avellana Chilena, 6 Cacao Santander, 6 Polen Floral",
        },
        {
          cantidad: "4 un.",
          item: "Frascos 150g Tester de Barra",
          detalle: "Bonificados sin costo (1 por variedad) para microdegustaciones al ordenar",
        },
        {
          cantidad: "1 un.",
          item: "Exhibidor de Mostrador + Accesorios",
          detalle: "25 tarjetas A6 plastificadas + 20 microespátulas de cata",
        },
      ],
      materialesExhibicion: [
        "Exhibidor de mostrador de madera noble",
        "25 tarjetas de mesa A6 plastificadas",
        "20 microespátulas de cata para barra",
      ],
      integracionesDigitales: [
        {
          titulo: "Módulo QR Interactivo para Carta Digital",
          descripcion:
            "Pasaporte botánico interactivo enlazable a la carta digital de tu cafetería",
          tag: "marketing",
        },
        {
          titulo: "Activación en Directorio de Cafeterías Aliadas",
          descripcion:
            "Visibilidad oficial para comensales en el mapa público de aliados de Enjambre Legado",
          tag: "resenas",
        },
      ],
      recomendadoPara:
        "Cafeterías de especialidad de flujo regular con prescripción activa del equipo de barra",
    },
    {
      id: "ecosistema-tostaduria",
      nombre: "KIT 03: Ecosistema Tostaduría (Alta Rotación)",
      badge: "Escala & Tostadurías",
      tier: "flagship",
      tagline: "Suministro integral para tostadurías, flagships o locales de alto flujo con co-branding",
      descripcion:
        "La solución total de máxima escala y rentabilidad. Incluye 8 frascos Tester bonificados, doble exhibidor y personalización de marca (co-branding en tarjetas A6) calibrado con tus cafés de la casa.",
      precioNetoClp: 377600,
      pvpEstimadoClp: 872000,
      margenEstimadoPct: 49,
      moqSummary: "160 piezas 25g + 48 frascos 150g + 8 Testers bonificados",
      salesStrategy:
        "Inversión: $377.600 neto (~$449.344 IVA inc.). Venta total: $872.000 PVP ($732.773 venta neta). Utilidad neta limpia: +$355.173 netos (48,5% margen real, +94,1% ROI).",
      componentesFisicos: [
        {
          cantidad: "160 un.",
          item: "Piezas de Mesa 25g",
          detalle: "40 Virgen Ulmo, 40 Avellana Chilena, 40 Cacao Santander, 40 Polen Floral",
        },
        {
          cantidad: "48 un.",
          item: "Reserva de Vitrina 150g",
          detalle: "12 Virgen Ulmo, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral",
        },
        {
          cantidad: "8 un.",
          item: "Frascos 150g Tester de Barra",
          detalle: "Bonificados sin costo (2 por variedad) para cata activa en barra y sala",
        },
        {
          cantidad: "1 pack",
          item: "Doble Exhibidor + Co-Branding A6",
          detalle: "50 tarjetas A6 con el logo de tu cafetería y calibración sensorial de tueste",
        },
      ],
      materialesExhibicion: [
        "Doble exhibidor de mostrador y vitrina",
        "50 tarjetas de mesa A6 con co-branding (logo de la cafetería)",
      ],
      integracionesDigitales: [
        {
          titulo: "Calibración Sensorial de Tueste con Granos de la Casa",
          descripcion:
            "Estudio de resonancia fitoquímica entre tus lotes de café y nuestras 4 matrices botánicas",
          tag: "marketing",
        },
        {
          titulo: "Acceso Preferente a Tramos Mayoristas",
          descripcion:
            "Reposición continua prioritaria directo desde Chiloé con condiciones comerciales de escala",
          tag: "pricing",
        },
      ],
      recomendadoPara:
        "Tostadurías, cafeterías con múltiples barras o locales insignia de alto volumen",
    },
  ],

  hoteles: [
    {
      id: "kit-piloto-i-ritual-cata",
      nombre: "Kit Piloto I: Ritual & Cata Horizontal",
      badge: "Tracción Operativa · Solo 25 g",
      tier: "entrada",
      tagline: "Validación de experiencia del huésped en turndown, excursiones y desayuno VIP sin compromiso de tienda",
      descripcion:
        "Dotación concentrada de 120 amenidades de 25 g distribuidas equilibradamente en las cuatro formulaciones bioactivas, complementadas con 3 regletas de cata en madera nativa, pasaportes bilingües y protocolo de servicio.",
      precioNetoClp: 168000,
      pvpEstimadoClp: 280000,
      margenEstimadoPct: 40,
      moqSummary: "120 piezas 25 g + 3 regletas cata + 60 pasaportes",
      salesStrategy:
        "Costo por habitación ocupada de apenas $1.400 CLP (~$1,50 USD), una fracción marginal frente al costo laboral de $9 USD de un turndown de lujo en lodges que cobran más de $500 USD por noche.",
      componentesFisicos: [
        {
          cantidad: "120 un.",
          item: "Mini Frascos de Cortesía 25 g",
          detalle: "30× Ulmo Puro APF, 30× Avellana Chilena ω-7, 30× Polen Biomimético, 30× Cacao Nibs Santander",
        },
        {
          cantidad: "3 un.",
          item: "Regletas de Cata Horizontal",
          detalle: "Madera nativa cepillada con 4 cavidades calibradas para Tasting Flights en suites o salón",
        },
        {
          cantidad: "60 un.",
          item: "Pasaportes Botánicos A6",
          detalle: "Papel algodón bilingüe (ES/EN) con relato bioactivo del bosque a 42°S y QR de trazabilidad",
        },
        {
          cantidad: "1 un.",
          item: "Protocolo Técnico de Servicio",
          detalle: "Ficha impermeable de 1 página para garzones y housekeeping con temperaturas y maridajes",
        },
      ],
      materialesExhibicion: [
        "3 Regletas de cata horizontal en madera nativa para Tasting Flights",
        "60 Pasaportes Botánicos de Habitación A6 en papel algodón",
        "Certificado analítico NCh2981 del lote vigente enmarcable",
      ],
      integracionesDigitales: [
        {
          titulo: "Cata Sensorial Bilingüe en Suite",
          descripcion:
            "El huésped escanea el QR del frasco y explora la curva aromática y el factor APF",
          tag: "trazabilidad",
        },
        {
          titulo: "Trazabilidad Oficial NCh2981",
          descripcion:
            "Informe melisopalinológico y análisis de pureza descargable",
          tag: "marketing",
        },
      ],
      recomendadoPara:
        "Directores de Alimentos & Bebidas y Gobernanta que buscan validar la respuesta sensorial de sus huéspedes con riesgo cero de inventario",
    },
    {
      id: "kit-piloto-ii-ecosistema-circular",
      nombre: "Kit Piloto II: Ecosistema Circular Auto-Liquidable",
      badge: "Costo Neto Cero · 25 g + 150 g",
      tier: "avanzado",
      tagline: "Financiar el 100% de las amenidades de cortesía mediante la venta del formato 150 g en recepción",
      descripcion:
        "Ecosistema comercial cerrado: combina 80 frascos de 25 g para bienvenidas y catas con 28 frascos de 150 g Cabin-Safe para vitrina de checkout. La venta de los 28 frascos de 150 g recauda $336.000 netos, recuperando el 100% de la factura del hotel y generando $41.000 netos de excedente más 80 amenidades gratuitas.",
      precioNetoClp: 295000,
      pvpEstimadoClp: 479840,
      margenEstimadoPct: 38,
      moqSummary: "80 piezas 25 g + 28 frascos 150 g + glorificador",
      salesStrategy:
        "Inversión neta: $295.000 CLP. Venta de 28 frascos de 150 g a PVP $14.280 IVA inc. ($12.000 neto): recauda $336.000 netos. Amortiza el 100% de la factura ($295.000), genera +$41.000 CLP de utilidad líquida y 80 amenidades de 25 g resultan 100% gratuitas.",
      componentesFisicos: [
        {
          cantidad: "80 un.",
          item: "Piezas de Cortesía 25 g",
          detalle: "20× Ulmo Puro APF, 20× Avellana ω-7, 20× Polen, 20× Cacao Nibs",
        },
        {
          cantidad: "28 un.",
          item: "Reserva de Recepción 150 g (Cabin-Safe)",
          detalle: "7× Ulmo Puro, 7× Avellana ω-7, 7× Polen, 7× Cacao Nibs (Net Vol. 98 ml TSA Approved)",
        },
        {
          cantidad: "1 un.",
          item: "Glorificador Minimalista de Recepción",
          detalle: "Exhibidor de mesón para las 4 variedades de 150 g con frascos probadores de aroma",
        },
        {
          cantidad: "2 un.",
          item: "Regletas de Cata Horizontal",
          detalle: "Para servicio de desayuno en mesa y suites preferentes",
        },
        {
          cantidad: "80 un.",
          item: "Pasaportes Botánicos de Habitación",
          detalle: "Con llamado explícito al huésped a adquirir la reserva de 150 g en recepción antes de su vuelo",
        },
      ],
      materialesExhibicion: [
        "1 Glorificador minimalista de lobby para mesón de recepción y checkout",
        "2 Regletas de cata horizontal en madera nativa para desayuno VIP",
        "80 Pasaportes Botánicos A6 bilingües con invitación a boutique de recepción",
      ],
      integracionesDigitales: [
        {
          titulo: "Conversión Cruzada Suite a Recepción",
          descripcion:
            "Pasaporte de habitación con QR que invita a retirar la reserva de 150 g antes del vuelo",
          tag: "marketing",
        },
        {
          titulo: "Certificación Cabin & TSA Approved",
          descripcion:
            "Garantía volumétrica de 98 ml para tránsito aeroportuario sin decomiso",
          tag: "trazabilidad",
        },
        {
          titulo: "Membresía Digital para Huéspedes",
          descripcion:
            "Pase digital para Apple/Google Wallet con trazabilidad y beneficios en próximas visitas",
          tag: "fidelizacion",
        },
      ],
      recomendadoPara:
        "Gerentes Generales, Propietarios y Directores de Finanzas que exigen un retorno de inversión transparente e inmediato sin gasto muerto",
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
        { value: "16_30", label: "16 a 30 habitaciones (Hotel de autor / Patrimonial)" },
        { value: "mas_30", label: "Más de 30 habitaciones (Gran lodge / Resort de exploración)" },
      ],
    },
    {
      id: "area_contacto",
      label: "Cargo o área directiva del solicitante",
      type: "select",
      required: true,
      options: [
        { value: "gerencia_general", label: "Gerencia General / Propietario" },
        { value: "alimentos_bebidas", label: "Dirección de Alimentos y Bebidas (A&B) / Chef Ejecutivo" },
        { value: "housekeeping", label: "Gobernanta General / Housekeeping" },
        { value: "adquisiciones_finanzas", label: "Adquisiciones & Finanzas" },
      ],
    },
    {
      id: "enfoque_servicio",
      label: "Paso prioritario requerido",
      type: "select",
      required: true,
      options: [
        { value: "caja_criterio", label: "Solicitar Caja Científica de Criterio (Muestreo ejecutivo)" },
        { value: "kit_piloto_1", label: "Activar Kit Piloto I: Ritual & Cata Horizontal ($168.000 neto)" },
        { value: "kit_piloto_2", label: "Activar Kit Piloto II: Ecosistema Circular Auto-Liquidable ($295.000 neto)" },
        { value: "concierge_medida", label: "Coordinar Concierge B2B para programa a medida (> 30 habitaciones)" },
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
  const found = kits.find((k) => k.id === kitId);
  if (found) return found;
  if (slug === 'cafeterias') {
    if (kitId === 'piloto-mesa-barra') return kits.find((k) => k.id === 'piloto-validacion') || kits[0];
    if (kitId === 'reserva-barra-vitrina') return kits.find((k) => k.id === 'traccion-barista') || kits[1];
  }
  if (slug === 'hoteles') {
    if (kitId === 'bienvenida-boutique') return kits.find((k) => k.id === 'kit-piloto-i-ritual-cata') || kits[0];
    if (kitId === 'gran-hospitalidad') return kits.find((k) => k.id === 'kit-piloto-ii-ecosistema-circular') || kits[1];
  }
  return undefined;
}

