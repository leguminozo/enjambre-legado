import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlugOrId, listVisibleProducts } from '@/lib/shop/products';
import { formatCLP } from '@/lib/shop/format';
import {
  productJsonLd,
  breadcrumbJsonLd,
  renderJsonLd,
} from '@/lib/shop/json-ld';
import { AddToCartButton, TraceabilitySection } from './ui';
import { ProductGallery } from '@/components/shop/product-gallery';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ChevronRight } from 'lucide-react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await listVisibleProducts();
  return products.map((p) => ({ slug: p.slug }));
}
export const dynamic = 'force-dynamic';
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
  });

  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Creaciones', href: '/catalogo' },
    { name: product.name, href: `/producto/${product.slug}` },
  ]);

  return (
    <Shell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(breadcrumbSchema) }}
      />
    <main className="bg-background pb-16">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Link href="/" className="hover:text-accent">
              Inicio
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <Link href="/catalogo" className="hover:text-accent">
              Creaciones
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            <span className="font-medium text-foreground/70">{product.name}</span>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:gap-14 sm:px-6 lg:grid-cols-[1fr_minmax(280px,400px)] lg:items-start lg:py-14">
          <ProductGallery photos={product.photos} alt={product.name} />

          <div className="lg:sticky lg:top-28">
            {product.format ? (
              <span className="inline-block rounded bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                {product.format}
              </span>
            ) : null}
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 font-display text-2xl text-accent">{formatCLP(product.price)}</p>

          {product.description ? (
            <div className="mt-8 border-l-2 border-accent/60 pl-5">
              <p className="whitespace-pre-line leading-relaxed text-foreground/70">{product.description}</p>
            </div>
          ) : (
            <p className="mt-8 text-sm italic text-muted-foreground/60">Descripción disponible pronto.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {product.sustituye_azucar_g ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent/80">
                Sustituye ~{product.sustituye_azucar_g}g azúcar refinada
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 px-3 py-1 text-[9px] uppercase tracking-wider text-accent/80">
                Sustituye azúcar refinada
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 px-3 py-1 text-[9px] uppercase tracking-wider text-success/80">
              Bosque nativo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/20 px-3 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/60">
              Miel viva · Enzimas activas
            </span>
            {product.irr_referencia && product.irr_referencia > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 px-3 py-1 text-[9px] uppercase tracking-wider text-success/80">
                IRR {product.irr_referencia} · Impacto &gt; Huella
              </span>
            )}
          </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <AddToCartButton product={product} disabled={!inStock} />
              <span className="text-sm text-muted-foreground">
                {product.stock == null
                  ? 'Stock por confirmar'
                  : product.stock > 0
                    ? `${product.stock} disponibles`
                    : 'Sin stock'}
              </span>
            </div>

            {/* Trazabilidad QR */}
            <TraceabilitySection
              blockchainHash={product.blockchain_hash}
              colmenaOrigen={product.colmena_origen}
              fechaCosecha={product.fecha_cosecha}
              fechaEnvasado={product.fecha_envasado}
              nombreLote={product.nombre_lote}
              descripcionLote={product.descripcion_lote}
            />

            <Link href="/catalogo" className="mt-10 inline-flex text-sm font-medium text-accent hover:underline">
              ← Seguir explorando
            </Link>
          </div>
        </div>
      </main>
    </Shell>
  );
}
