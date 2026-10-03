import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const originsData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Orígenes y Floraciones Nativas de Chiloé — La Obrera y el Zángano',
    description:
      'Catálogo botánico, apiarios de recolección y perfiles de floración nativa de la selva fría valdiviana en Chiloé.',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Place',
          name: 'Apiario Predio Pureo',
          description:
            'Apiario principal de conservación en la vertiente oriental de la Cordillera de Piuchén, Chiloé.',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: -42.88,
            longitude: -73.75,
          },
          ecosystem: 'Bosque templado lluvioso costero (Selva Valdiviana)',
          floracionesPredominantes: ['Ulmo', 'Tiaca', 'Melí', 'Luma'],
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'Floración de Ulmo (Eucryphia cordifolia)',
          category: 'Floración de verano tardío / otoño',
          period: 'Febrero — Marzo',
          organolepticProfile: {
            color: 'Blanco marfil a ámbar extra claro',
            aroma: 'Floral voluptuoso, notas a flor de azahar, jazmín y anís',
            taste: 'Dulzura profunda con retrogusto a vainilla natural',
            crystallization: 'Cristal fino, textura cremosa y sedosa',
          },
          url: `${siteUrl}/origen/ulmo`,
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Thing',
          name: 'Floración de Tiaca (Caldcluvia paniculata)',
          category: 'Floración de verano pleno',
          period: 'Diciembre — Enero',
          organolepticProfile: {
            color: 'Ámbar claro y brillante',
            aroma: 'Fresco, herbal y sutilmente balsámico',
            taste: 'Agridulce armónico con notas cítricas y acidez vivaz',
            crystallization: 'Cristalización suave de grano medio',
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 4,
        item: {
          '@type': 'Thing',
          name: 'Floración de Melí (Amomyrtus meli)',
          category: 'Floración de primavera tardía',
          period: 'Noviembre — Diciembre',
          organolepticProfile: {
            color: 'Ámbar cálido profundo',
            aroma: 'Altamente aromático, especiado, con notas de hojas machacadas de arrayán',
            taste: 'Notas licorosas y toffee con persistencia balsámica prolongada',
            crystallization: 'Cristalización lenta',
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 5,
        item: {
          '@type': 'Thing',
          name: 'Floración de Luma (Amomyrtus luma)',
          category: 'Floración de verano austral',
          period: 'Enero — Febrero',
          organolepticProfile: {
            color: 'Caramelo oscuro y cobrizo',
            aroma: 'Madera nativa, tierra húmeda y bosque profundo',
            taste: 'Robusto, mineral, con notas de caramelo tostado',
            crystallization: 'Consistencia densa y mantecosa',
          },
        },
      },
    ],
  };

  return NextResponse.json(originsData, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
