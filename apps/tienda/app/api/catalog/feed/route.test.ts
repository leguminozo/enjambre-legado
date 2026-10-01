import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getCatalogFeed } from './route';

vi.mock('@/lib/shop/products', () => ({
  listVisibleProducts: vi.fn().mockResolvedValue([
    {
      id: 'prod-feed-1',
      slug: 'crema-virgen',
      name: 'Crema de Miel Virgen',
      description: 'Miel batida pura',
      shortDescription: 'Miel batida',
      price: 12990,
      stock: 10,
      photos: ['/assets/products/virgen.jpg'],
      visible: true,
      category: 'cremas',
    },
  ]),
}));

describe('GET /api/catalog/feed', () => {
  it('responde con XML por defecto con headers de cache y content-type', async () => {
    const req = new NextRequest('https://obrerayzangano.cl/api/catalog/feed');
    const res = await getCatalogFeed(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/xml');
    expect(res.headers.get('Cache-Control')).toContain('max-age=1800');

    const text = await res.text();
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('<g:id>prod-feed-1</g:id>');
    expect(text).toContain('<g:title><![CDATA[Crema de Miel Virgen]]></g:title>');
    expect(text).toContain('<g:price>12990 CLP</g:price>');
  });

  it('responde con CSV si format=csv', async () => {
    const req = new NextRequest('https://obrerayzangano.cl/api/catalog/feed?format=csv');
    const res = await getCatalogFeed(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');

    const text = await res.text();
    expect(text).toContain('id,title,description');
    expect(text).toContain('prod-feed-1,Crema de Miel Virgen');
  });
});
