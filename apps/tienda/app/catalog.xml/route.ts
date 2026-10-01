import { NextResponse } from 'next/server';
import { listVisibleProducts } from '@/lib/shop/products';
import { generateCatalogXml } from '@/lib/shop/catalog-feed';

export const revalidate = 1800; // 30 minutos de caché en el borde (ISR)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function GET() {
  try {
    const products = await listVisibleProducts();
    const xml = generateCatalogXml(products, SITE_URL);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[catalog.xml] Error generando feed XML de catálogo:', error);
    return new NextResponse('Error generando catálogo', { status: 500 });
  }
}
