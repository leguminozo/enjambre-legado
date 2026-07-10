import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlugOrId, listVisibleProducts } from '@/lib/shop/products';
import {
  productJsonLd,
  breadcrumbJsonLd,
} from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { listActiveSubscriptionPlans } from '@/lib/shop/subscription-plans';
import { fetchResenas } from '@/lib/shop/resenas-api';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { PdpBody } from '@/components/shop/pdp-body';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await listVisibleProducts();
  return products.map((p) => ({ slug: p.slug }));
}
export const revalidate = 120;
export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);
  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const canonicalUrl = `${SITE_URL}/producto/${product.slug}`;
  const primaryImage = product.photos[0] ?? undefined;

  return {
    title: product.name,
    description:
      product.description ??
      `Miel cruda artesanal del bosque nativo de Chile. ${product.name} — La Obrera y el Zángano.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.name,
      description:
        product.description ??
        'Miel cruda del bosque nativo. Trazable desde el apiario.',
      url: canonicalUrl,
      type: 'website',
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : [],
      locale: 'es_CL',
      siteName: 'La Obrera y el Zángano',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description ?? undefined,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <StoreShell>
      <ShopHeader />
      {children}
      <ShopFooter />
    </StoreShell>
  );
}

export default async function ProductoPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  if (!product) {
    notFound();
  }

  const inStock = product.stock == null || product.stock > 0;
  const [resenasData, replenishmentPlans] = await Promise.all([
    fetchResenas(product.id),
    listActiveSubscriptionPlans(),
  ]);

  const productSchema = productJsonLd({
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    photos: product.photos,
    stock: product.stock,
    format: product.format,
    co2EvitadoKg: product.co2_evitado_kg,
    irrReferencia: product.irr_referencia,
    blockchainHash: product.blockchain_hash,
    colmenaOrigen: product.colmena_origen,
    fechaCosecha: product.fecha_cosecha,
    reviews: resenasData.items.slice(0, 5).map((r) => ({
      author: r.display_name ?? 'Guardián',
      rating: r.rating,
      body: r.comentario_corto ?? r.notas_personales ?? '',
      datePublished: r.created_at,
    })),
    aggregateRating: resenasData.aggregate ?? undefined,
  });

  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Creaciones', href: '/catalogo' },
    { name: product.name, href: `/producto/${product.slug}` },
  ]);

  return (
    <Shell>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <PdpBody
        product={product}
        inStock={inStock}
        plans={replenishmentPlans}
        resenasAggregate={resenasData.aggregate ?? null}
      />
    </Shell>
  );
}
