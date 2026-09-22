import type { MetadataRoute } from 'next';
import { listVisibleProducts } from '@/lib/shop/products';
import { B2B_SEGMENTS } from '@/lib/b2b/segment-content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/ciencia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/experiencias`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/club-legado-del-bosque`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.75 },
    { url: `${siteUrl}/galeria`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contacto`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${siteUrl}/qr-scan`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/envio`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/origen/ulmo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    // Superficie agéntica y demostrativa
    { url: `${siteUrl}/demo/perfil`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/demo/perfil/pasaporte`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/demo/perfil/pedidos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/demo/perfil/billetera`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/demo/perfil/reposicion`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/alianzas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/llms.txt`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/llms-full.txt`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/agents.txt`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  const b2bRoutes: MetadataRoute.Sitemap = B2B_SEGMENTS.map((segment) => ({
    url: `${siteUrl}/alianzas/${segment}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  try {
    const products = await listVisibleProducts();
    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
    // Trazabilidad: diferenciador de marca; indexable por producto
    const trazabilidadRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}/trazabilidad`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
    return [...staticRoutes, ...b2bRoutes, ...productRoutes, ...trazabilidadRoutes];
  } catch {
    return [...staticRoutes, ...b2bRoutes];
  }
}
