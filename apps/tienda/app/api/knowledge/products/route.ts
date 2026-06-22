import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('productos')
    .select(
      'id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, co2_evitado_kg, irr_referencia, origen_apicola, sustituye_azucar_g, lote_id, lotes(id, nombre, tipo_miel, fecha_cosecha, co2_kg)',
    )
    .eq('visible', true);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    );
  }

  const products = (data ?? []).map((p) => ({
    '@type': 'Product',
    '@id': `${siteUrl}/producto/${p.slug}#product`,
    name: p.nombre ?? '',
    url: `${siteUrl}/producto/${p.slug}`,
    description: p.descripcion_regenerativa ?? undefined,
    image: (p.fotos as string[] | null)?.[0] ?? undefined,
    category: 'Miel cruda artesanal',
    material: 'Miel de bosque nativo chileno',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: p.precio ?? 0,
      availability:
        p.stock == null || (p.stock as number | null) !== null && (p.stock as number) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
    additionalProperty: [
      ...(p.co2_evitado_kg != null
        ? [
            {
              '@type': 'PropertyValue' as const,
              name: 'CO2 evitado (kg)',
              value: p.co2_evitado_kg,
              description:
                'Kilogramos de CO2 evitados por kilo de miel versus azúcar refinada.',
            },
          ]
        : []),
      ...(p.irr_referencia != null
        ? [
            {
              '@type': 'PropertyValue' as const,
              name: 'Índice IRR',
              value: p.irr_referencia,
              description:
                'Índice de Regeneración y Resiliencia. >1 indica impacto neto positivo.',
            },
          ]
        : []),
      ...(p.sustituye_azucar_g != null
        ? [
            {
              '@type': 'PropertyValue' as const,
              name: 'Sustituye azúcar refinada (g)',
              value: p.sustituye_azucar_g,
            },
          ]
        : []),
    ],
  ...(p.lotes && p.lotes.length > 0 && {
    hasBatch: {
      '@type': 'ProductBatch',
      name: p.lotes[0].nombre ?? '',
      productionDate: p.lotes[0].fecha_cosecha ?? undefined,
      description: `Tipo: ${p.lotes[0].tipo_miel ?? ''}. CO2 del lote: ${p.lotes[0].co2_kg ?? 0} kg.`,
    },
  }),
  }));

  return NextResponse.json(
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products,
    },
    {
      headers: {
        'Cache-Control':
          'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
