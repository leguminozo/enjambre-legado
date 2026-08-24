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
    kicker: "Para Cafeterías",
    headline: "La miel que transforma cada taza",
    subheadline:
      "Mini frascos de 25g con tapa dorada llenos de miel cruda del bosque patagónico. Eleva la experiencia de tu cafetería con un detalle premium e inolvidable.",
    heroImage: "/images/b2b/hero-cafeterias.jpg",
    valueProps: [
      {
        icon: "Package",
        title: "Mini frascos de 25g",
        description:
          "La dosis perfecta presentada en un formato de lujo con tapa dorada, diseñado para acompañar infusiones de especialidad.",
      },
      {
        icon: "Palette",
        title: "Co-Branding disponible (Opcional)",
        description:
          "Integramos el logo de tu cafetería dentro de nuestra etiqueta editorial. Un servicio premium opcional de alto valor añadido para tu marca.",
      },
      {
        icon: "Gift",
        title: "Dividendo Apícola (Retorno)",
        description:
          "Por cada X frascos que adquieras, acumulas bonificaciones en producto para tu uso interno o venta, gracias a nuestra trazabilidad por unidad.",
      },
      {
        icon: "BarChart3",
        title: "Fidelidad B2B2C",
        description:
          "No solo te vendemos miel. Te entregamos un programa de lealtad digital. Tus clientes escanean un QR en tu local, se registran, y acumulan 'sellos' cada vez que consumen, garantizando que vuelvan a tu cafetería.",
      },
      {
        icon: "Users",
        title: "Inspiración para tu staff",
        description:
          "En compras por volumen, incluimos frascos de 500g 'Reserva del Bosque' marcados 'Para el equipo de barra'. Si el barista prueba la mejor miel, la recomendará con pasión a tus clientes.",
      },
    ],
    stats: [
      { value: 'App', label: 'Fidelización QR' },
      { value: '25g', label: 'Formato premium' },
      { value: 'Co-brand', label: 'Upgrade opcional' },
      { value: 'Staff', label: 'Cross-sampling' },
    ],
    process: [
      { step: '01', title: 'Conectemos', desc: 'Cuéntanos sobre tu cafetería. Entendemos que cada barra de especialidad tiene su ritmo.' },
      { step: '02', title: 'Onboarding Digital', desc: 'Recibes tu código de local para que tus clientes puedan escanear el QR y entrar a tu red de fidelidad.' },
      { step: '03', title: 'Abastecimiento y Cultura', desc: 'Recibe tu pedido junto a la miel de cortesía para tu staff. Aumenta la moral de tu equipo y mejora la venta.' },
    ],
    suggestedProductsCopy: 'El formato estrella para cafeterías es nuestro mini frasco de 25g con tapa dorada. También disponemos de frascos de 150g para venta directa en tu local.',
    ctaText: "Solicitar cotización",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo funciona el programa de fidelidad QR para mis clientes?",
        answer:
          "Te asignamos un código único. Tus clientes lo escanean y entran a nuestra plataforma global de fidelidad. Acumulan su primer 'sello' automáticamente por consumir en tu local, y nosotros nos encargamos del software. Tú solo disfrutas de clientes más fieles.",
      },
      {
        question: "¿Pueden mis clientes opinar sobre la miel?",
        answer:
          "Sí, nuestra plataforma incluye un módulo de cata sensorial. El cliente final puede registrar qué perfil de sabor y aroma percibió en su visita a tu local, elevando su experiencia de consumo de algo ordinario a una cata interactiva.",
      },
      {
        question: "¿Cómo funciona el co-branding (re-branding)?",
        answer:
          "Es un servicio opcional de alta plusvalía. Nuestra etiqueta tiene un espacio dedicado donde, por un coste adicional, incorporamos el logo de tu cafetería de forma armónica.",
      },
    ],
    seo: {
      title: "Miel Premium para Cafeterías · La Obrera y el Zángano",
      description:
        "Mini frascos de 25g de miel cruda para cafeterías. Software de fidelización B2B2C integrado, opción de co-branding y beneficios para tu equipo de barra.",
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
      { value: 'VIP', label: 'Experiencia huésped' },
      { value: 'Cata', label: 'Inmersión digital' },
      { value: 'Co-brand', label: 'Upgrade Opcional' },
      { value: 'Bosque', label: 'Protección activa' },
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
      { value: 'Co-op', label: 'Fondos de Marketing' },
      { value: 'Digital', label: 'Pack redes sociales' },
      { value: 'Aliados', label: 'Tiers de lealtad' },
      { value: 'Exclusividad', label: 'Zonas reservadas' },
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
      { value: '25g', label: 'Compra de impulso' },
      { value: 'Leads', label: 'Captura digital QR' },
      { value: 'Stock', label: 'Bonificado' },
      { value: 'Stand', label: 'Display incluido' },
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
      "Distribuye miel premium apoyado por tecnología B2B2C. Sin inversión inicial obligatoria, con beneficios por compras cruzadas, recompensas de recompra rápida y lealtad digital para tus propios clientes.",
    heroImage: "/images/b2b/hero-revendedores.jpg",
    valueProps: [
      {
        icon: "TrendingUp",
        title: "Bonus de Recompra Rápida",
        description:
          "Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de X días, desbloqueas rebajas automáticas y producto bonificado.",
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
          "Escala de Bronce a Oro según tu volumen y velocidad de recompra. Desbloquea mayores porcentajes de retorno y acceso anticipado.",
      },
    ],
    stats: [
      { value: 'Bonus', label: 'Recompra Rápida' },
      { value: 'App', label: 'Fideliza tu red' },
      { value: 'Digital', label: 'Pack de RRSS' },
      { value: 'Tiers', label: 'Escalabilidad' },
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
