import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lotes')
    .select(
      'id, nombre_lote, descripcion, fecha_envasado, kg_total',
    )
    .order('fecha_envasado', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch harvests' },
      { status: 500 },
    );
  }

  const harvests = (data ?? []).map((l) => {
  return {
    '@type': 'Event',
    '@id': `${siteUrl}/lote/${l.id}#harvest`,
    name: `Cosecha ${l.nombre_lote ?? ''} — ${l.fecha_envasado ?? 'fecha por confirmar'}`,
    startDate: l.fecha_envasado ?? undefined,
      description: `${l.kg_total ?? 0} kg. Detalles: ${l.descripcion ?? ''}.`,
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
