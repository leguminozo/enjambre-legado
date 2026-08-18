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

export interface B2BSegmentContent {
  slug: B2BSegmentSlug;
  tipo: string;
  kicker: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  valueProps: ValueProp[];
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
      "Sachets individuales de miel cruda del bosque patagónico para elevar la experiencia de tu cafetería. Diferenciación real, margen saludable.",
    heroImage: "/images/b2b/hero-cafeterias.jpg",
    valueProps: [
      {
        icon: "Package",
        title: "Sachets individuales",
        description:
          "15 g de miel cruda por sachet — la dosis perfecta para acompañar cada taza sin desperdicio.",
      },
      {
        icon: "Leaf",
        title: "Diferenciación real",
        description:
          "Cada sachet cuenta la historia del bosque nativo de Chiloé. Tu cafetería ofrece algo que ninguna otra tiene.",
      },
      {
        icon: "TrendingUp",
        title: "Margen saludable",
        description:
          "Precio mayorista competitivo que protege tu rentabilidad sin sacrificar calidad premium.",
      },
      {
        icon: "BarChart3",
        title: "Soporte visual",
        description:
          "Material POS y display de mostrador incluido para que el producto se presente y se venda solo.",
      },
    ],
    ctaText: "Solicitar cotización",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿En qué formatos viene la miel para cafeterías?",
        answer:
          "Ofrecemos sachets individuales de 15 g ideales para servicio de mesa, y frascos de 150 g para barra o venta cruzada. Ambos formatos con etiquetado premium listo para exhibir.",
      },
      {
        question: "¿Cuál es el pedido mínimo?",
        answer:
          "El pedido mínimo es de 100 sachets o un mix equivalente en frascos. Trabajamos contigo para encontrar el volumen que mejor se ajuste a tu rotación.",
      },
      {
        question: "¿Tienen precios mayoristas escalonados?",
        answer:
          "Sí. Manejamos tres tramos de volumen con descuentos progresivos. A partir de 500 unidades el precio unitario baja significativamente. Solicita tu cotización personalizada.",
      },
      {
        question: "¿Incluyen material de soporte para el punto de venta?",
        answer:
          "Cada primer pedido incluye un display de mostrador, tarjetas informativas y stickers de origen. También ofrecemos capacitación breve para tu equipo sobre la historia del producto.",
      },
    ],
    seo: {
      title: "Miel Premium para Cafeterías · La Obrera y el Zángano",
      description:
        "Sachets individuales de miel cruda del bosque patagónico para cafeterías de especialidad. Diferenciación real, margen saludable y soporte de marca incluido.",
    },
  },

  hoteles: {
    slug: "hoteles",
    tipo: "hotel",
    kicker: "Para Hoteles",
    headline: "Amenities que cuentan la historia del bosque",
    subheadline:
      "Sachets de miel cruda como amenity premium. Cada uno cuenta la historia del bosque patagónico de Chiloé, diferenciando tu experiencia de hospedaje.",
    heroImage: "/images/b2b/hero-hoteles.jpg",
    valueProps: [
      {
        icon: "Hotel",
        title: "Amenity premium",
        description:
          "Sachets de miel cruda con diseño editorial que elevan la percepción de calidad desde el primer contacto con el huésped.",
      },
      {
        icon: "Users",
        title: "Experiencia de huésped",
        description:
          "Ideal para el servicio de desayuno, room service o welcome pack. Un detalle que se recuerda y se comparte.",
      },
      {
        icon: "Palette",
        title: "Personalización",
        description:
          "Branding co-branded disponible para volúmenes a partir de 1.000 unidades. Tu logo junto al del bosque patagónico.",
      },
      {
        icon: "Leaf",
        title: "Sostenibilidad",
        description:
          "Apicultura regenerativa certificada. Una historia de sostenibilidad real que refuerza el compromiso ambiental de tu hotel.",
      },
    ],
    ctaText: "Solicitar cotización",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Es posible personalizar los sachets con nuestra marca?",
        answer:
          "Sí, ofrecemos sachets co-branded a partir de 1.000 unidades. El proceso incluye diseño conjunto para mantener la identidad premium del producto y la de tu hotel.",
      },
      {
        question: "¿Qué volúmenes manejan para hotelería?",
        answer:
          "Trabajamos desde pedidos de 200 sachets para hoteles boutique hasta contratos trimestrales de miles de unidades para cadenas. Adaptamos la logística a tu operación.",
      },
      {
        question: "¿Cómo es el proceso de entrega?",
        answer:
          "Despachamos a todo Chile con tiempos de entrega de 3 a 7 días hábiles según la zona. Para contratos recurrentes ofrecemos entregas programadas mensuales o quincenales.",
      },
      {
        question: "¿Cómo comunico la historia de sostenibilidad a mis huéspedes?",
        answer:
          "Cada sachet incluye un micro-relato del origen. Además proveemos fichas de habitación, contenido digital para pantallas y un QR que enlaza a la historia completa del bosque.",
      },
    ],
    seo: {
      title: "Miel del Bosque para Hoteles · La Obrera y el Zángano",
      description:
        "Sachets de miel cruda del bosque patagónico como amenity premium para hoteles. Personalización co-branded, historia de sostenibilidad y logística adaptada a hotelería.",
    },
  },

  "tiendas-gourmet": {
    slug: "tiendas-gourmet",
    tipo: "tienda_gourmet",
    kicker: "Para Tiendas Gourmet",
    headline: "El frasco que tus clientes buscan",
    subheadline:
      "Miel cruda de bosque nativo con trazabilidad desde la colmena. Alto ticket, historia que vende sola, rotación constante.",
    heroImage: "/images/b2b/hero-tiendas-gourmet.jpg",
    valueProps: [
      {
        icon: "Award",
        title: "Producto premium",
        description:
          "Alto ticket y margen atractivo. Un producto que justifica su precio con calidad tangible y una historia irrepetible.",
      },
      {
        icon: "Shield",
        title: "Trazabilidad completa",
        description:
          "Cada frasco lleva número de lote, colmena de origen y apiario. Tu cliente sabe exactamente de dónde viene su miel.",
      },
      {
        icon: "Star",
        title: "Narrativa que vende",
        description:
          "La historia del bosque nativo patagónico se cuenta sola. Etiquetado editorial y material de exhibición que convierte sin esfuerzo.",
      },
      {
        icon: "Package",
        title: "Gama completa",
        description:
          "Sachets de 15 g, frascos medianos de 150 g y frascos mayores de 500 g Reserva del Bosque. Formatos para cada ocasión de consumo y rango de precio.",
      },
    ],
    ctaText: "Solicitar catálogo",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Qué formatos están disponibles para retail?",
        answer:
          "Sachets de 15 g, frascos de 150 g (Crema de miel pura, con polen, avellanas o cacao) y frascos mayores de 500 g Reserva del Bosque. Todos con etiquetado premium listo para góndola y ficha técnica.",
      },
      {
        question: "¿Cuál es la vida útil del producto?",
        answer:
          "Nuestra fecha de consumo preferente es de 24 meses desde el envasado. Mantener entre 15 y 25 °C en lugar seco y sin luz solar directa para proteger sus enzimas y aroma.",
      },
      {
        question: "¿Cómo funciona la estructura de precios mayorista?",
        answer:
          "Manejamos precios netos mayoristas con descuentos escalonados según inversión neta (5% desde $500.000 y 10% desde $1.000.000), con despacho bonificado en RM a partir de $900.000 netos.",
      },
      {
        question: "¿Ofrecen zonas de exclusividad?",
        answer:
          "Para tiendas que mantengan un volumen mínimo trimestral, ofrecemos exclusividad de radio geográfico. Conversemos sobre tu zona para evaluar disponibilidad.",
      },
    ],
    seo: {
      title: "Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano",
      description:
        "Miel cruda de bosque nativo patagónico con trazabilidad completa para tiendas gourmet. Alto ticket, narrativa premium y gama completa de formatos.",
    },
  },

  ferias: {
    slug: "ferias",
    tipo: "feria_evento",
    kicker: "Para Ferias y Eventos",
    headline: "Del bosque al encuentro",
    subheadline:
      "Formatos ideales para venta directa: kits de degustación, display portátil y soporte de marca. El bosque patagónico llega a tu feria.",
    heroImage: "/images/b2b/hero-ferias.jpg",
    valueProps: [
      {
        icon: "Gift",
        title: "Kit de arranque",
        description:
          "Display portátil más selección de productos listos para vender. Arma tu stand en minutos con imagen profesional.",
      },
      {
        icon: "Coffee",
        title: "Degustación incluida",
        description:
          "Sachets de cortesía para degustación en feria. El mejor argumento de venta es probar la miel del bosque.",
      },
      {
        icon: "TrendingUp",
        title: "Margen de feria",
        description:
          "Precio de costo con 20% de margen sobre precio público. Tu ganancia está protegida desde la primera venta.",
      },
      {
        icon: "ShoppingBag",
        title: "Soporte de marca",
        description:
          "Material gráfico, banners con QR, tarjetas de producto y argumentario de venta. Todo lo que necesitas para representar la marca.",
      },
    ],
    ctaText: "Pedir kit de feria",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Qué incluye el kit de arranque para ferias?",
        answer:
          "Un display portátil de madera, selección de productos (sachets + frascos), material gráfico impreso, tarjetas de producto y sachets de degustación. Todo en una caja lista para transportar.",
      },
      {
        question: "¿Cuál es el pedido mínimo para participar en una feria?",
        answer:
          "No hay pedido mínimo rígido. Recomendamos al menos 50 sachets y 12 frascos para una feria de un día. Podemos armar un mix a medida según la duración del evento.",
      },
      {
        question: "¿Puedo devolver producto no vendido?",
        answer:
          "Aceptamos devolución de producto sellado y en perfecto estado dentro de los 15 días posteriores al evento. Aplica un cargo de logística inversa del 5%.",
      },
      {
        question: "¿Hay disponibilidad todo el año?",
        answer:
          "Sí, producimos durante todo el año. Sin embargo, la cosecha principal es entre diciembre y marzo, cuando la diversidad floral del bosque es máxima. Recomendamos planificar con anticipación para temporada alta de ferias.",
      },
    ],
    seo: {
      title: "Miel para Ferias y Eventos · La Obrera y el Zángano",
      description:
        "Kits de venta directa de miel cruda del bosque patagónico para ferias y eventos. Display portátil, degustación incluida y 20% de margen garantizado.",
    },
  },

  revendedores: {
    slug: "revendedores",
    tipo: "otro",
    kicker: "Programa Revendedores",
    headline: "Tu micro-negocio de miel del bosque",
    subheadline:
      "Sin inversión inicial mínima, 20% de margen garantizado, soporte completo. Comienza a vender miel premium del bosque patagónico desde tu espacio.",
    heroImage: "/images/b2b/hero-revendedores.jpg",
    valueProps: [
      {
        icon: "Package",
        title: "Sin stock mínimo",
        description:
          "Compra lo que necesites, cuando lo necesites. Sin presión de inventario ni capital inmovilizado.",
      },
      {
        icon: "TrendingUp",
        title: "20% de margen",
        description:
          "Descuento revendedor automático sobre precio público. Tu margen está garantizado desde la primera unidad.",
      },
      {
        icon: "ShoppingBag",
        title: "Kit digital completo",
        description:
          "Catálogo digital, lista de precios, argumentario de venta y contenido para redes. Todo listo para que empieces a vender.",
      },
      {
        icon: "Award",
        title: "Programa de tiers",
        description:
          "Bronce → Plata → Oro. Avanza por volumen y desbloquea mejores precios, acceso anticipado a ediciones limitadas y beneficios exclusivos.",
      },
    ],
    ctaText: "Comenzar ahora",
    ctaHref: "#registro",
    faq: [
      {
        question: "¿Cómo empiezo a revender?",
        answer:
          "Completa el formulario de registro, recibe tu kit digital con catálogo y precios, y realiza tu primer pedido. No hay costo de inscripción ni permanencia obligatoria.",
      },
      {
        question: "¿Cuáles son las condiciones de pago?",
        answer:
          "Primer pedido con pago anticipado. A partir del segundo pedido, ofrecemos pago a 15 días para revendedores activos. Transferencia bancaria o tarjeta de crédito.",
      },
      {
        question: "¿Cómo funciona el envío?",
        answer:
          "Despachamos a todo Chile. Envío bonificado para pedidos superiores a $50.000 CLP. Para pedidos menores, el costo de envío se calcula según destino.",
      },
      {
        question: "¿Puedo devolver producto?",
        answer:
          "Sí, aceptamos devolución de producto sellado y en perfecto estado dentro de los 30 días. El reembolso se procesa en un plazo de 5 días hábiles.",
      },
    ],
    seo: {
      title: "Programa de Revendedores · La Obrera y el Zángano",
      description:
        "Revende miel cruda premium del bosque patagónico sin inversión mínima. 20% de margen garantizado, kit digital y programa de tiers por volumen.",
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
