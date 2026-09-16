import { NextResponse } from 'next/server';
import { organizationJsonLd, webSiteJsonLd } from '@/lib/shop/json-ld';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const knowledgeGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      organizationJsonLd(),
      webSiteJsonLd(),
      {
        '@type': 'Place',
        '@id': `${siteUrl}/#predio-pureo`,
        name: 'Predio Pureo · Protección Forestal',
        description:
          'Zona de conservación y apiarios de bosque nativo en la Cordillera de Piuchén, Archipiélago de Chiloé.',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: -42.88,
          longitude: -73.75,
        },
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Chiloé, Región de Los Lagos, Chile',
        },
      },
      {
        '@type': 'Dataset',
        '@id': `${siteUrl}/#analisis-cientifico-referencia`,
        name: 'Parámetros Analíticos de Referencia de Miel Cruda OYZ',
        description:
          'Estándares analíticos oficiales certificados para miel cruda del bosque nativo de Chiloé.',
        publisher: {
          '@type': 'Organization',
          name: 'La Obrera y el Zángano',
        },
        variableMeasured: [
          {
            '@type': 'PropertyValue',
            name: 'Humedad Natural',
            value: '< 18.0 %',
            description: 'Preservación espontánea sin fermentación ni recalentamiento.',
          },
          {
            '@type': 'PropertyValue',
            name: 'Hidroximetilfurfural (HMF)',
            value: '< 10.0 mg/kg',
            description: 'Indicador de frescura absoluta y ausencia de pasteurización.',
          },
          {
            '@type': 'PropertyValue',
            name: 'Pureza Melisopalinológica',
            value: '> 85 % polen nativo chileno',
            description: 'Verificación botánica del origen en bosque nativo templado lluvioso.',
          },
        ],
      },
      {
        '@type': 'DataCatalog',
        '@id': `${siteUrl}/#knowledge-catalog`,
        name: 'Catálogo de APIs de Conocimiento para Agentes de IA',
        dataset: [
          {
            '@type': 'DataDownload',
            name: 'Productos y Catálogo',
            contentUrl: `${siteUrl}/api/knowledge/products`,
            encodingFormat: 'application/ld+json',
          },
          {
            '@type': 'DataDownload',
            name: 'Orígenes y Floraciones',
            contentUrl: `${siteUrl}/api/knowledge/origins`,
            encodingFormat: 'application/ld+json',
          },
          {
            '@type': 'DataDownload',
            name: 'Recolecciones y Disponibilidad',
            contentUrl: `${siteUrl}/api/knowledge/harvests`,
            encodingFormat: 'application/ld+json',
          },
          {
            '@type': 'DataDownload',
            name: 'Experiencia y Dashboard de Cliente',
            contentUrl: `${siteUrl}/api/knowledge/customer-experience`,
            encodingFormat: 'application/ld+json',
          },
          {
            '@type': 'DataDownload',
            name: 'Especificación OpenAPI 3.1',
            contentUrl: `${siteUrl}/api/openapi.json`,
            encodingFormat: 'application/json',
          },
        ],
      },
    ],
    metadata: {
      documentationText: `${siteUrl}/llms.txt`,
      documentationComprehensive: `${siteUrl}/llms-full.txt`,
      agentInstructions: `${siteUrl}/agents.txt`,
      demoCustomerDashboardUrl: `${siteUrl}/demo/perfil`,
    },
  };

  return NextResponse.json(knowledgeGraph, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
