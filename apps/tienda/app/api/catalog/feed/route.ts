import { NextRequest, NextResponse } from 'next/server';
import { listVisibleProducts } from '@/lib/shop/products';
import { generateCatalogXml, generateCatalogCsv } from '@/lib/shop/catalog-feed';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function GET(req: NextRequest) {
  try {
    const products = await listVisibleProducts();
    const format = req.nextUrl.searchParams.get('format')?.toLowerCase();

    if (format === 'csv') {
      const csv = generateCatalogCsv(products, SITE_URL);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'inline; filename="catalog.csv"',
          'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
        },
      });
    }

    const xml = generateCatalogXml(products, SITE_URL);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[catalog-feed] Error generando feed de catálogo:', error);
    return new NextResponse('Error generando catálogo de productos', { status: 500 });
  }
}
