import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
  ChevronDown,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { breadcrumbJsonLd, faqJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { getSiteContent } from '@/lib/cms';
import {
  parseB2BSegmentContent,
  type B2BSegmentSlug as ChromeB2BSegmentSlug,
} from '@enjambre/shop-chrome';
import {
  B2B_SEGMENTS,
  isValidSegment,
  getSegmentContent,
  type B2BSegmentSlug,
} from '@/lib/b2b/segment-content';
import { B2BRegisterForm } from '@/components/b2b/b2b-register-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
};

export async function generateStaticParams() {
  return B2B_SEGMENTS.map((segmento) => ({ segmento }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>;
}): Promise<Metadata> {
  const { segmento } = await params;
  if (!isValidSegment(segmento)) return {};

  const rows = await getSiteContent(`b2b_${segmento}`);
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const parsed = parseB2BSegmentContent(cmsContent, segmento as ChromeB2BSegmentSlug);
  const fallback = getSegmentContent(segmento);

  const title = parsed.seo_title || fallback?.seo.title || 'Alianzas · La Obrera y el Zángano';
  const description = parsed.seo_description || fallback?.seo.description || '';
  const heroImage = parsed.hero_image || fallback?.heroImage || '/assets/editorial/b2b-cafeterias.jpg';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/para/${segmento}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/para/${segmento}`,
      type: 'website',
      locale: 'es_CL',
      siteName: 'La Obrera y el Zángano',
      images: [{ url: `${SITE_URL}${heroImage}`, width: 1600, height: 900 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ParaSegmentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ segmento: string }>;
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const { segmento } = await params;

  if (!isValidSegment(segmento)) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const draft = resolvedSearchParams.cms_preview === '1';

  const rows = await getSiteContent(`b2b_${segmento}`, { draft });
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseB2BSegmentContent(cmsContent, segmento as ChromeB2BSegmentSlug);

  const jsonLdData = mergeJsonLd([
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: content.kicker, href: `/para/${segmento}` },
    ]),
    faqJsonLd(content.faq),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={content.hero_image}
              alt={content.headline}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
          </div>

          <div className="relative px-4 text-center pt-[max(8rem,calc(env(safe-area-inset-top)+6.5rem))] pb-20 md:pb-28">
            <div className="max-w-3xl mx-auto">
              <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent-text mb-8">
                {content.kicker}
              </span>
              <h1 className="font-display text-[clamp(2.25rem,8vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 text-balance">
                {content.headline}
              </h1>
              <p className="font-display italic text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto text-pretty mb-10">
                {content.subheadline}
              </p>
              <a
                href={content.cta_href}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent px-8 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {content.cta_text}
              </a>
            </div>
          </div>
        </section>

        {/* ── Value Props ── */}
        <section className="py-20 md:py-28 px-4 border-t border-border/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
                Propuesta de valor
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground text-balance">
                Criterios de origen para tu espacio
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.value_props.map((prop) => {
                const IconComponent = ICON_MAP[prop.icon];
                return (
                  <div
                    key={prop.title}
                    className="group bg-surface-raised border border-border/30 rounded-xl p-8 hover:border-accent/30 transition-colors"
                  >
                    {IconComponent ? (
                      <IconComponent className="w-8 h-8 text-accent-text mb-5 group-hover:scale-110 transition-transform" />
                    ) : null}
                    <h3 className="font-display text-xl font-light text-foreground mb-3">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Social Proof / Stats ── */}
        <section className="py-16 px-4 border-t border-border/20 bg-surface-raised/30">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {content.stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl md:text-4xl text-accent-text mb-2">
                  {stat.value}
                </div>
                <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="py-20 md:py-28 px-4 border-t border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
                Flujo
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground text-balance">
                Abastecimiento y servicio
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {content.process.map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <span className="inline-block font-mono text-4xl md:text-5xl text-accent-text/30 mb-4">
                    {item.step}
                  </span>
                  <h3 className="font-display text-xl font-light text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Products CTA ── */}
        <section className="py-20 px-4 border-t border-border/20 bg-surface-raised/30">
          <div className="max-w-3xl mx-auto text-center">
            <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
              Selección
            </span>
            <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-6 text-balance">
              Formatos de bosque para tu vitrina
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto mb-10">
              {content.suggested_products_copy}
            </p>
            <Link
              href="/catalogo"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Explorar catálogo →
            </Link>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 md:py-28 px-4 border-t border-border/20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
                Preguntas frecuentes
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground text-balance">
                Lo que necesitas saber
              </h2>
            </div>
            <div className="space-y-4">
              {content.faq.map((item) => (
                <details
                  key={item.question}
                  className="group bg-surface-raised border border-border/30 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-foreground font-display text-lg font-light list-none">
                    {item.question}
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Registration Form ── */}
        <section
          id="registro"
          className="py-20 md:py-28 px-4 border-t border-border/20 bg-surface-raised/30"
        >
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-12">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
                Alianza
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-4 text-balance">
                Registro comercial de aliados
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Completa tus datos y te contactaremos para habilitar las condiciones comerciales de tu espacio.
                Sin compromisos iniciales ni mínimos forzados.
              </p>
            </div>
            <B2BRegisterForm
              segmentType={content.tipo as 'cafeteria' | 'tienda_gourmet' | 'hotel' | 'feria_evento' | 'otro'}
              segmentLabel={content.kicker}
              kind={segmento === 'revendedores' ? 'revendedor' : 'punto_venta'}
            />
          </div>
        </section>

        {/* ── Contact CTA ── */}
        <section className="py-16 px-4 border-t border-border/20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Tienes preguntas específicas sobre tu negocio?
            </p>
            <Link
              href="/contacto"
              className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:text-accent/80 transition-colors"
            >
              Escríbenos directamente →
            </Link>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
