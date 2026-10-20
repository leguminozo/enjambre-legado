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
      title: 'Tarjeta de Mesa: Protocolo de Maridaje',
      subtitle: 'Guía de cata en 3 tiempos para disfrutar tu café de especialidad con miel cruda.',
      dimensions: [
        { label: 'HUMEDAD CERTIFICADA', value: '< 18% (Maduración Natural)' },
        { label: 'TEMPERATURA DE CATA', value: '< 40 °C (Fuera de la Taza)' },
        { label: 'TEXTURA', value: 'Cremada en Frío (<20°C)' },
        { label: 'FLORACIÓN', value: 'Ulmo & Tiaca (Chiloé 42°S)' },
      ],
      instruction:
        'Toma una pequeña porción con la microespátula, colócala en el paladar y luego bebe tu café para apreciar el contrapunto botánico sin intervenir la extracción.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/trazabilidad?ref=tarjeta_mesa',
      qrLabel: 'ORIGEN DEL LOTE & TRAZABILIDAD',
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
      title: 'Tarjeta de Habitación & Desayuno',
      subtitle: 'Bienvenido a un territorio vivo. Conoce el origen de la miel que acompaña tu estadía.',
      dimensions: [
        { label: 'ORIGEN APÍCOLA', value: 'Chiloé Insular (42°S)' },
        { label: 'CERTIFICACIÓN', value: 'Miel Cruda Pura' },
        { label: 'FLORACIÓN', value: 'Ulmo & Tiaca' },
        { label: 'HUMEDAD', value: '< 18% Controlada' },
      ],
      instruction: 'Apunta la cámara para acceder al pasaporte botánico y certificar la cuenca de recolección.',
      qrActionUrl: 'https://tienda.obrerayzangano.cl/trazabilidad?ref=amenity_hotel',
      qrLabel: 'PASAPORTE DE BIENVENIDA',
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
      title: 'Expositor de Mostrador & Degustación',
      subtitle: 'Miel cruda de bosque nativo. Prueba la textura con una cucharilla limpia.',
      dimensions: [
        { label: 'PROCESO', value: 'Centrifugado en frío' },
        { label: 'PASTEURIZACIÓN', value: '0% (Miel cruda viva)' },
        { label: 'HUMEDAD', value: '16.8% (Alta densidad)' },
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
      'Piezas visuales de alto impacto para stands de diseño, encuentros campesinos y ferias gastronómicas.',
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
      'Herramientas de venta, argumentarios y fichas para representantes comerciales y distribuidores independientes.',
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
          detail: 'Contactar a los clientes que compraron un frasco de 500g para preguntar cómo estuvo su experiencia y ofrecer reposición.',
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
