import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const harvestsData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Recolecciones de Temporada y Lotes Activos — La Obrera y el Zángano',
    description:
      'Lotes certificados de recolección de miel cruda, parámetros analíticos de laboratorio y disponibilidad de temporada.',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'ProductModel',
          name: 'Lote Recolección 2026-A1 · Ulmo Cordillera de Piuchén',
          description:
            'Miel de floración pura de Ulmo recolectada en el bosque nativo de Chiloé durante febrero de 2026. Lote numerado de alta pureza botánica.',
          harvestDate: '2026-02-18',
          packagingDate: '2026-03-02',
          originLocation: 'Cordillera de Piuchén, Chiloé',
          laboratoryParameters: {
            humedad: '16.8 %',
            hmf: '4.2 mg/kg',
            polenUlmo: '88.4 %',
            estadoSanitario: 'Certificado óptimo',
          },
          authenticityAnchor: {
            status: 'Verificado',
            network: 'Registro Digital Público',
            verificationUrl: `${siteUrl}/qr-scan`,
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'ProductModel',
          name: 'Lote Recolección 2026-B2 · Tiaca & Bosque Lluvioso',
          description:
            'Extracción estival de Tiaca con notas frescas de arrayán y bosque nativo costero.',
          harvestDate: '2026-01-24',
          packagingDate: '2026-02-05',
          originLocation: 'Bosque Nativo, Chiloé',
          laboratoryParameters: {
            humedad: '17.1 %',
            hmf: '3.8 mg/kg',
            polenTiaca: '74.2 %',
            estadoSanitario: 'Certificado óptimo',
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Thing',
          name: 'Reserva de Recolección Futura (Temporada 2026/2027)',
          description:
            'Acceso anticipado a lotes limitados de floración temprana para suscriptores del Club Legado del Bosque.',
          availability: 'Pre-reserva habilitada en dashboard de clientes',
          url: `${siteUrl}/demo/perfil`,
        },
      },
    ],
  };

  return NextResponse.json(harvestsData, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
