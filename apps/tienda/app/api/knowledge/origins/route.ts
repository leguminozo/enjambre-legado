import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
  const supabase = await createClient();

  const [apiarios, honeyAnalysis] = await Promise.all([
    supabase
      .from('apiarios')
      .select('id, nombre, lat, lng, sector')
      .limit(50),
    supabase
      .from('honey_analysis')
      .select('id, lote_id, producto_id, humedad_pct, hmf_mg_kg, perfil_polen, indice_glicemico_estimado')
      .limit(50),
  ]);

  const origins = (apiarios.data ?? []).map((a) => ({
    '@type': 'Place',
    '@id': `${siteUrl}/apiario/${a.id}#apiario`,
    name: a.nombre ?? '',
    description: `Apiario en ${a.sector ?? 'el sur de Chile'}`,
    geo:
      a.lat != null && a.lng != null
        ? {
            '@type': 'GeoCoordinates',
            latitude: a.lat,
            longitude: a.lng,
          }
        : undefined,
    address: {
      '@type': 'PostalAddress',
      addressRegion: a.sector ?? 'Los Lagos',
      addressCountry: 'CL',
    },
  }));

  const analyses = (honeyAnalysis.data ?? []).map((h) => ({
    '@type': 'Dataset',
    '@id': `${siteUrl}/analysis/${h.id}#analysis`,
    name: 'Análisis de miel',
    description: `Humedad: ${h.humedad_pct ?? 'N/A'}%. HMF: ${h.hmf_mg_kg ?? 'N/A'} mg/kg. Índice glicémico estimado: ${h.indice_glicemico_estimado ?? 'N/A'}.`,
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'Humedad (%)',
        value: h.humedad_pct,
      },
      {
        '@type': 'PropertyValue',
        name: 'HMF (mg/kg)',
        value: h.hmf_mg_kg,
      },
      {
        '@type': 'PropertyValue',
        name: 'Índice glicémico estimado',
        value: h.indice_glicemico_estimado,
      },
    ],
    ...(h.perfil_polen && {
      about: {
        '@type': 'PropertyValue',
        name: 'Perfil polínico',
        value: JSON.stringify(h.perfil_polen),
      },
    }),
  }));

  return NextResponse.json(
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: origins.length + analyses.length,
      itemListElement: [...origins, ...analyses],
    },
    {
      headers: {
        'Cache-Control':
          'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
