type JsonLdValue = string | number | boolean | null | undefined | JsonLdValue[] | { [key: string]: JsonLdValue };

type JsonLdRecord = Record<string, JsonLdValue>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
const SITE_NAME = 'La Obrera y el Zángano';
const SITE_DESCRIPTION =
  'Miel cruda del bosque nativo de Chiloé. Creaciones con legado y regeneración.';

function buildUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function organizationJsonLd(): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'OYZ',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.svg`,
    description: SITE_DESCRIPTION,
    email: 'hola@obrerayzangano.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Chiloé',
      addressRegion: 'Los Lagos',
      addressCountry: 'CL',
    },
    foundingLocation: {
      '@type': 'Place',
      name: 'Chiloé, Los Lagos, Chile',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -42.6217,
        longitude: -73.9469,
      },
    },
    sameAs: [],
    knowsAbout: [
      'Apicultura artesanal',
      'Miel cruda del bosque nativo chileno',
      'Regeneración biocultural',
      'Trazabilidad apícola',
      'Conservación del bosque nativo',
    ],
    foundingDate: '2024',
  };
}

export function webSiteJsonLd(): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'es-CL',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/catalogo?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productJsonLd(input: {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  photos: string[];
  stock: number | null;
  format: string | null;
  co2EvitadoKg?: number | null;
  irrReferencia?: number | null;
  blockchainHash?: string | null;
  colmenaOrigen?: string | null;
  fechaCosecha?: string | null;
}): JsonLdRecord {
  const inStock =
    input.stock == null ? 'https://schema.org/InStock' : input.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: buildUrl(`/producto/${input.slug}`),
    description: input.description ?? undefined,
    image: input.photos.length > 0 ? input.photos : undefined,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: 'Miel cruda artesanal',
    material: 'Miel de bosque nativo chileno',
    origin: 'Bosque nativo del sur de Chile',
    offers: {
      '@type': 'Offer',
      url: buildUrl(`/producto/${input.slug}`),
      priceCurrency: 'CLP',
      price: input.price,
      availability: inStock,
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
    },
    hasMeasurement: input.format
      ? { '@type': 'QuantitativeValue', name: input.format }
      : undefined,
    ...(input.co2EvitadoKg != null && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'CO2 evitado (kg)',
          value: input.co2EvitadoKg,
          description:
            'Kilogramos de CO2 evitados por kilo de miel producido versus azúcar refinada industrial.',
        },
        ...(input.irrReferencia != null
          ? [
              {
                '@type': 'PropertyValue' as const,
                name: 'Índice de Regeneración y Resiliencia (IRR)',
                value: input.irrReferencia,
                description:
                  'Puntaje que mide si el impacto positivo de esta cosecha supera su huella ecológica. IRR > 1 indica impacto neto positivo.',
              },
            ]
          : []),
      ],
    }),
    ...(input.blockchainHash && {
      identifier: {
        '@type': 'PropertyValue',
        name: 'Hash de trazabilidad blockchain',
        value: input.blockchainHash,
        propertyID: 'blockchain_hash',
      },
    }),
    ...(input.colmenaOrigen && {
      productionDate: input.fechaCosecha ?? undefined,
      relevantOccupation: {
        '@type': 'Occupation',
        name: 'Apicultor',
        description: `Miel producida en colmena: ${input.colmenaOrigen}`,
      },
    }),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; href: string }>,
): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildUrl(item.href),
    })),
  };
}

export function itemListJsonLd(
  items: Array<{ name: string; slug: string; position: number }>,
): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: buildUrl(`/producto/${item.slug}`),
    })),
  };
}

export function faqJsonLd(
  items: Array<{ question: string; answer: string }>,
): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function apiaryJsonLd(input: {
  name: string;
  lat: number;
  lng: number;
  sector: string;
  floraciones?: string[];
}): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    description: `Apiario en ${input.sector}. ${input.floraciones?.length ? `Floraciones: ${input.floraciones.join(', ')}.` : ''}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: input.lat,
      longitude: input.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: input.sector,
      addressCountry: 'CL',
    },
  };
}

export function harvestEventJsonLd(input: {
  date: string;
  apiaryName: string;
  productNames: string[];
  kilos: number;
}): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Cosecha ${input.apiaryName} — ${input.date}`,
    startDate: input.date,
    location: {
      '@type': 'Place',
      name: input.apiaryName,
    },
    description: `Cosecha de ${input.kilos} kg de miel del apiario ${input.apiaryName}. Productos resultantes: ${input.productNames.join(', ')}.`,
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
}): JsonLdRecord {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished ?? '2025-07-02',
    dateModified: input.dateModified ?? undefined,
    author: {
      '@type': 'Organization',
      name: input.authorName ?? SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-512.svg`,
      },
    },
    image: input.imageUrl ?? undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
  };
}

export function mergeJsonLd(records: JsonLdRecord[]): JsonLdRecord {
  if (records.length === 1) return records[0];
  return {
    '@context': 'https://schema.org',
    '@graph': records.map((r) => {
      const { '@context': _ctx, ...rest } = r;
      return rest;
    }),
  };
}

export function renderJsonLd(record: JsonLdRecord): string {
  return JSON.stringify(record, null, 0);
}
