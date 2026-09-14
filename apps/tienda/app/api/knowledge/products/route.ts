import { NextResponse } from 'next/server';
import { listVisibleProducts } from '@/lib/shop/products';
import { productJsonLd } from '@/lib/shop/json-ld';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  try {
    const products = await listVisibleProducts();

    const productItems = products.map((p, index) => {
      const baseJsonLd = productJsonLd({
        name: p.name,
        slug: p.slug,
        description: p.description ?? p.shortDescription,
        photos: p.photos ?? [],
        price: p.price,
        stock: p.stock,
        format: p.formatLabel ?? p.format,
        co2EvitadoKg: p.co2_evitado_kg,
        irrReferencia: p.irr_referencia,
        blockchainHash: p.blockchain_hash,
        colmenaOrigen: p.colmena_origen,
        fechaCosecha: p.fecha_cosecha,
      });

      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          ...baseJsonLd,
          sustituyeAzucarG: p.sustituye_azucar_g ?? undefined,
          origenApicola: p.origenApicola ?? 'Bosque nativo de Chiloé, Chile',
          perfilSensorial: p.perfil_sensorial ?? undefined,
          trazabilidadUrl: `${siteUrl}/producto/${p.slug}/trazabilidad`,
        },
      };
    });

    const responseData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Catálogo de Mieles Crudas del Bosque Nativo — La Obrera y el Zángano',
      description:
        'Selección de mieles crudas y formatos de experiencia trazables del archipiélago de Chiloé.',
      numberOfItems: products.length,
      itemListElement: productItems,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[knowledge/products] error loading products:', error);
    return NextResponse.json(
      { error: 'Error cargando catálogo de conocimiento' },
      { status: 500 },
    );
  }
}
