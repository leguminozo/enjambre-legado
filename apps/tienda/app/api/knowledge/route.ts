import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';
  const supabase = await createClient();

  const [products, apiarios, lotes] = await Promise.all([
    supabase
      .from('productos')
      .select(
        'id, slug, nombre, descripcion_regenerativa, precio, stock, formato, fotos, co2_evitado_kg, irr_referencia, origen_apicola, lote_id',
      )
      .eq('visible', true),
    supabase
      .from('apiarios')
      .select('id, nombre, lat, lng, sector')
      .limit(50),
    supabase
      .from('lotes')
      .select('id, nombre_lote, descripcion, fecha_envasado, kg_total')
      .limit(50),
  ]);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'La Obrera y el Zángano',
        alternateName: 'OYZ',
        url: siteUrl,
        email: 'hola@obrerayzangano.com',
        knowsAbout: [
          'Miel cruda del bosque nativo chileno',
          'Apicultura artesanal',
          'Regeneración biocultural',
          'Trazabilidad apícola',
        ],
      },
      ...(products.data ?? []).map((p) => ({
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
            p.stock == null || p.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        },
        ...(p.co2_evitado_kg != null && {
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'CO2 evitado (kg)',
            value: p.co2_evitado_kg,
          },
        }),
        ...(p.irr_referencia != null && {
          identifier: {
            '@type': 'PropertyValue',
            name: 'IRR',
            value: p.irr_referencia,
          },
        }),
      })),
      ...(apiarios.data ?? []).map((a) => ({
        '@type': 'Place',
        '@id': `${siteUrl}/apiario/${a.id}#apiario`,
        name: a.nombre ?? '',
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
          addressRegion: a.sector ?? '',
          addressCountry: 'CL',
        },
      })),
      ...(lotes.data ?? []).map((l) => ({
        '@type': 'ProductBatch',
        '@id': `${siteUrl}/lote/${l.id}#lote`,
        name: l.nombre_lote ?? '',
        description: `Lote de miel. Cosecha/Envasado: ${l.fecha_envasado ?? 'fecha por confirmar'}. ${l.kg_total ?? 0} kg. Detalles: ${l.descripcion ?? ''}.`,
        productionDate: l.fecha_envasado ?? undefined,
      })),
    ],
  };

  return NextResponse.json(graph, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
