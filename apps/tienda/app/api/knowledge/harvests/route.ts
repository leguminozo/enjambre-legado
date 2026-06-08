import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lotes')
    .select(
      'id, nombre, tipo_miel, fecha_cosecha, kilos, origen, apiario_id, co2_kg, apiarios(nombre, sector)',
    )
    .order('fecha_cosecha', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch harvests' },
      { status: 500 },
    );
  }

  const harvests = (data ?? []).map((l) => {
  const apiario = l.apiarios && l.apiarios.length > 0 ? l.apiarios[0] : null;
  return {
    '@type': 'Event',
    '@id': `${siteUrl}/lote/${l.id}#harvest`,
    name: `Cosecha ${l.nombre ?? ''} — ${l.fecha_cosecha ?? 'fecha por confirmar'}`,
    startDate: l.fecha_cosecha ?? undefined,
    location: apiario
      ? {
          '@type': 'Place',
          name: apiario.nombre ?? '',
          address: {
            '@type': 'PostalAddress',
            addressRegion: apiario.sector ?? 'Los Lagos',
            addressCountry: 'CL',
          },
        }
      : undefined,
      description: `${l.kilos ?? 0} kg de miel ${l.tipo_miel ?? ''}. Origen: ${l.origen ?? 'sur de Chile'}. CO2 del lote: ${l.co2_kg ?? 0} kg.`,
      organizer: {
        '@type': 'Organization',
        name: 'La Obrera y el Zángano',
      },
    };
  });

  return NextResponse.json(
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: harvests.length,
      itemListElement: harvests,
    },
    {
      headers: {
        'Cache-Control':
          'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
