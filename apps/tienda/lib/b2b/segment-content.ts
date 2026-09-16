import {
  B2B_SEGMENT_SLUGS,
  type B2BSegmentSlug,
} from '@enjambre/shop-chrome';

export const B2B_SEGMENTS = B2B_SEGMENT_SLUGS;
export type { B2BSegmentSlug };

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
      { value: '100%', label: 'Origen y trazabilidad SAG' },
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
        question: "Mix recomendado",
        answer:
          "Una barra no necesita más productos, necesita mejores gestos. Definimos contigo el mix, la frecuencia de abastecimiento y, para locales seleccionados, una edición de casa o trazabilidad QR.",
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
        title: "Conservación en marcha",
        description:
          "Tu compra apoya un proyecto real en desarrollo. Estamos iniciando la trazabilidad forestal y el conteo de árboles nativos, para pronto poder entregarte reportes exactos de tu impacto.",
      },
    ],
    stats: [
      { value: '25 g', label: 'Amenity de origen' },
      { value: '100%', label: 'Recolección trazable SAG' },
      { value: '4 variedades', label: 'Floraciones de Chiloé' },
      { value: '1 QR', label: 'Cata sensorial guiada' },
    ],
    process: [
      { step: '01', title: 'Evaluación', desc: 'Definimos el volumen mensual ideal para tus operaciones de desayuno o welcome packs.' },
      { step: '02', title: 'Personalización (Opcional)', desc: 'Opcionalmente, y por un coste adicional, añadimos el logo de tu hotel al diseño de los mini frascos.' },
      { step: '03', title: 'Conservación conjunta', desc: 'Despachos recurrentes. Tu hotel se convierte en un actor clave financiando nuestro proyecto de trazabilidad forestal en desarrollo.' },
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
        question: "¿Tienen reportes de impacto ambiental o huella de carbono?",
        answer:
          "Toda nuestra trazabilidad forestal está en plena construcción. Durante este año iniciaremos un conteo de árboles nativos paso a paso. Tu compra nos ayuda a financiar el desarrollo de esta herramienta transparente, que en un futuro cercano será compartida con nuestros aliados.",
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
        title: "Trazabilidad completa",
        description:
          "Cada frasco lleva número de lote y origen. Tu cliente sabe exactamente qué está comprando y apoya el comercio justo.",
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
      { value: '100%', label: 'Pura sin aditivos' },
      { value: 'SAG', label: 'Certificación sanitaria' },
      { value: '5 km', label: 'Radio de exclusividad territorial' },
    ],
    process: [
      { step: '01', title: 'Set de Entrada', desc: 'Inicia con un Set diseñado algorítmicamente para rotar rápido, acompañado de tu pack digital.' },
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
        title: "Levantamiento de Datos",
        description:
          "Durante la feria, los visitantes escanean tu QR para calificar la miel y ganar puntos. Tú te quedas con un registro de leads calificados para el futuro.",
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
      { value: '1 display', label: 'Kit de exhibición de mesón' },
      { value: '1 QR', label: 'Token digital de canje' },
    ],
    process: [
      { step: '01', title: 'Planifica', desc: 'Cuéntanos la fecha y magnitud de tu evento para sugerir el mix adecuado de inventario.' },
      { step: '02', title: 'Equípate', desc: 'Recibe tu Set de Entrada con los frascos y el material de exhibición físico y digital.' },
      { step: '03', title: 'Interactúa', desc: 'Usa el sistema de Catas Digitales en tu stand. Atrae público, captura correos y multiplica ventas.' },
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
          "Colocas el QR de tu local en el stand. Quienes prueban la miel lo escanean para registrar su opinión y entrar a un sorteo o acumular puntos. Convierte una simple degustación en una base de datos para recompras.",
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
    headline: "Tu micro-negocio de miel del bosque",
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
        icon: "Users",
        title: "Fidelización de TUS clientes",
        description:
          "Tus clientes escanean tu código personal, ganan sellos y se fidelizan a ti. Nosotros proveemos todo el software de recompensas sin costo para ti.",
      },
      {
        icon: "Package",
        title: "Set de Entrada y Pack Digital",
        description:
          "Tu primera orden es un 'Set de Entrada' que incluye un kit de activos para redes sociales (fotos, videos) listos para que empieces a vender por WhatsApp o Instagram de inmediato.",
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
      { value: '100%', label: 'Margen comercial directo' },
      { value: 'Kit digital', label: 'Activos fotográficos de apoyo' },
    ],
    process: [
      { step: '01', title: 'Únete', desc: 'Regístrate sin costo, obtén tu código de revendedor y descarga tu Pack Digital de ventas.' },
      { step: '02', title: 'Distribuye', desc: 'Ofrece los frascos (25g, 150g, 500g) y haz que tus clientes escaneen tu QR para sumar puntos contigo.' },
      { step: '03', title: 'Acelera', desc: 'Haz pedidos de reposición rápidos para cobrar el "Bonus de Recompra Rápida" y multiplicar tu margen.' },
    ],
    suggestedProductsCopy: 'Nuestros revendedores suelen tener gran éxito armando packs de regalo con los mini frascos de 25g, además de abastecer hogares con los frascos de 500g.',
    ctaText: "Comenzar ahora",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo funciona el 'Bonus de Recompra Rápida'?",
        answer:
          "El sistema mide el tiempo entre tus pedidos. Si rotas el inventario rápidamente y vuelves a pedir dentro del umbral establecido, el algoritmo automáticamente te asigna un rebate (descuento) o producto de cortesía.",
      },
      {
        question: "¿Cómo mis clientes acumulan puntos conmigo?",
        answer:
          "Te damos un código único de Revendedor (QR). Cuando le entregas un frasco a un cliente, le muestras el QR; ellos lo escanean con su teléfono, evalúan la miel y ganan 'sellos'. Esto los incentiva a volver a comprarte a ti para llenar su tarjeta virtual.",
      },
      {
        question: "¿Qué incluye el Pack Digital?",
        answer:
          "Al registrarte, descargas un archivo con fotografías profesionales de los frascos, textos de venta probados, y gráficos para subir a tus estados de WhatsApp, Instagram o Facebook.",
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
