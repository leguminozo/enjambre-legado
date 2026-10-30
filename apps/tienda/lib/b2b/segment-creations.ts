import type { B2BSegmentSlug } from './segment-content';

export interface SegmentRecommendedContent {
  segmentSlug: B2BSegmentSlug;
  segmentName: string;
  headline: string;
  subheadline: string;
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
      'Herramientas tangibles para la barra y mesas de tu cafetería. Explica el ritual Botanical Sidecar y la degustación en microespátula sin disolver en taza.',
    tabletopKit: {
      title: 'Tarjeta de Mesa en Trípode: Protocolo de Cata',
      subtitle: 'Degustación sensorial con microespátula de bambú y maridaje con café de especialidad.',
      dimensions: [
        { label: 'HUMEDAD CERTIFICADA', value: '< 18% (Maduración Natural)' },
        { label: 'TEMPERATURA DE CATA', value: '< 40 °C (Fuera de la Taza)' },
        { label: 'TEXTURA', value: 'Cremada en Frío (<20°C)' },
        { label: 'FLORACIÓN', value: 'Ulmo & Tiaca (Chiloé 42°S)' },
      ],
      instruction:
        'Toma una muestra en la microespátula, degústala en paladar y escanea el código QR del trípode para registrar tu cata sensorial y evaluar las notas del bosque.',
      qrActionUrl: 'https://obrerayzangano.cl/cata?ref=tarjeta_mesa',
      qrLabel: 'CATA SENSORIAL & RESEÑA',
    },
    staffBriefing: {
      title: 'Guía Rápida para Baristas & Personal de Barra',
      serviceTips: [
        {
          title: 'Regla de Oro: Jamás dentro de la taza caliente',
          detail:
            'El café se entrega limpio. El frasco de 25 g se dispone en la bandeja junto a la microespátula para degustar en contrapunto.',
        },
        {
          title: 'Preservar los aromas sutiles',
          detail:
            'Al consumirse directamente con la espátula en paladar, se aprecian los aromas florales intactos sin alterar la acidez ni la temperatura del café.',
        },
        {
          title: 'El pitch de 5 segundos al servir',
          detail:
            '«Te dejamos este frasco de miel cruda de Chiloé: prueba una pizca en la espátula y luego un sorbo de café para sentir el contrapunto floral».',
        },
      ],
      faqForStaff: [
        {
          question: '¿Por qué la textura es cremosa y no líquida?',
          answer:
            'Es miel cruda batida en frío a menos de 20 °C mediante microcristalización mecánica controlada, 100% natural y sin pasteurización.',
        },
        {
          question: '¿Altera la microespuma o la acidez del café?',
          answer:
            'Al consumirse fuera de la taza con la microespátula, no modifica la acidez del espresso ni rompe la microespuma de las bebidas con leche.',
        },
      ],
    },
  },

  hoteles: {
    segmentSlug: 'hoteles',
    segmentName: 'Hotelería & Lodges de Autor',
    headline: 'Kit Editorial de Habitación & Hospitalidad',
    subheadline:
      'Papelería en papel algodón y guías para el servicio nocturno (turndown) y la mesa de desayuno.',
    tabletopKit: {
      title: 'Tarjeta de Habitación & Amenidad de Origen',
      subtitle: 'Bienvenido a un territorio vivo. Conoce el origen botánico de la miel que acompaña tu estadía.',
      dimensions: [
        { label: 'ORIGEN APÍCOLA', value: 'Chiloé Insular (42°S)' },
        { label: 'CERTIFICACIÓN', value: 'Miel Cruda Pura' },
        { label: 'FLORACIÓN', value: 'Ulmo & Tiaca' },
        { label: 'HUMEDAD', value: '< 18% Controlada' },
      ],
      instruction:
        'Apunta la cámara directamente al código QR del etiquetado del envase individual de 25 g para certificar la cuenca de recolección en Chiloé.',
      qrActionUrl: 'https://obrerayzangano.cl/trazabilidad?ref=amenity_hotel',
      qrLabel: 'PASAPORTE DE BIENVENIDA (ENVASE)',
    },
    staffBriefing: {
      title: 'Protocolo de Servicio para Personal de Sala & Desayuno',
      serviceTips: [
        {
          title: 'Montaje de bandeja matutina',
          detail: 'Disponer el frasco de 25 g cerrado junto a la servilleta de lino y la cuchara de madera en la mesa de desayuno.',
        },
        {
          title: 'Explicación al huésped',
          detail: 'Enfatizar que es miel cruda de bosque nativo de Chiloé, sin pasteurizar y con alta pureza botánica monofloral.',
        },
      ],
      faqForStaff: [
        {
          question: '¿Qué hacer si un huésped desea comprar frascos para llevar?',
          answer: 'Mantener frascos de 150 g en recepción para venta directa como recuerdo de viaje.',
        },
      ],
    },
  },

  'tiendas-gourmet': {
    segmentSlug: 'tiendas-gourmet',
    segmentName: 'Tiendas Gourmet & Emporios',
    headline: 'Kit Editorial de Vitrina & Criterio Gastronómico',
    subheadline:
      'Material de comunicación visual para atraer al consumidor consciente y destacar el valor de la miel cruda de origen certificado.',
    tabletopKit: {
      title: 'Peana de Mostrador: Cata & Reseña Sensorial',
      subtitle: 'Estación de degustación con microespátula higiénica y valoración de textura cremada.',
      dimensions: [
        { label: 'PROCESO', value: 'Centrifugado en frío' },
        { label: 'PASTEURIZACIÓN', value: '0% (Miel cruda viva)' },
        { label: 'HUMEDAD', value: '16.8% (Alta densidad)' },
        { label: 'FLORACIÓN', value: 'Ulmo / Tiaca / Melí' },
      ],
      instruction:
        'Invita a tus clientes a probar con la microespátula y escanear el QR del trípode para calificar las notas florales y acceder a la analítica de lote.',
      qrActionUrl: 'https://obrerayzangano.cl/cata?ref=mostrador_gourmet',
      qrLabel: 'CATA SENSORIAL & VALORACIÓN',
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
      'Piezas visuales de alto impacto para stands de diseño, encuentros campesinos y ferias gastronómicas.',
    tabletopKit: {
      title: 'Trípode de Mesón: Degustación Rápida & Reseña',
      subtitle: 'Prueba la miel virgen cremada en frío sin goteo y califica la floración de la temporada.',
      dimensions: [
        { label: 'RECOLECCIÓN', value: 'Temporada Actual' },
        { label: 'ORIGEN', value: 'Chiloé Insular' },
        { label: 'TRATAMIENTO', value: 'Sin Calor' },
        { label: 'ESTÁNDAR', value: 'Comercio Soberano' },
      ],
      instruction:
        'Apunta la cámara al trípode para registrar tu reseña sensorial en 60 segundos o pagar tu selección de frascos sin filas.',
      qrActionUrl: 'https://obrerayzangano.cl/cata?ref=feria_stand',
      qrLabel: 'CATA EN STAND & VALORACIÓN',
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
      'Herramientas de venta, argumentarios y fichas para representantes comerciales y distribuidores independientes.',
    tabletopKit: {
      title: 'Peana de Demostración: Cata & Reseña en Ruta',
      subtitle: 'Mesa de demostración directa con microespátula de bambú y captura de testimonios.',
      dimensions: [
        { label: 'ROL', value: 'Embajador Autorizado' },
        { label: 'STOCK', value: 'Partidas Frescas' },
        { label: 'FACTURA', value: 'Boleta o Factura' },
        { label: 'RESPALDO', value: 'Chiloé Nativo' },
      ],
      instruction:
        'Ofrece una cata guiada a tu comprador e invítalo a escanear el QR del trípode para dejar su reseña de autenticidad y recibir beneficios de cliente.',
      qrActionUrl: 'https://obrerayzangano.cl/cata?ref=rep_cata',
      qrLabel: 'CATA SENSORIAL & TESTIMONIO',
    },
    staffBriefing: {
      title: 'Estrategia de Cierre y Reposición',
      serviceTips: [
        {
          title: 'Seguimiento a los 30 días',
          detail: 'Contactar a los clientes que adquirieron un frasco de 150g o la Reserva de 900g para preguntar cómo estuvo su experiencia y ofrecer reposición periódica.',
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
