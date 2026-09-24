import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
  Droplets, Flower, Flower2,
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
  alignToClass,
} from '@enjambre/shop-chrome';
import {
  B2B_SEGMENTS,
  isValidSegment,
  getSegmentContent,
  getSegmentKits,
  getSegmentQuestions,
  type B2BSegmentSlug,
} from '@/lib/b2b/segment-content';
import { B2BSegmentKitsShowcase } from '@/components/b2b/b2b-segment-kits-showcase';
import { B2BSegmentRegistration } from '@/components/b2b/b2b-segment-registration';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
  Droplets, Flower, Flower2,
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

  const sectionKey = `b2b_${segmento.replace(/-/g, '_')}`;
  const rows = await getSiteContent(sectionKey);
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const parsed = parseB2BSegmentContent(cmsContent, segmento as ChromeB2BSegmentSlug);
  const fallback = getSegmentContent(segmento);

  const title = parsed.seo_title || fallback?.seo.title || 'Alianzas · La Obrera y el Zángano';
  const description = parsed.seo_description || fallback?.seo.description || '';
  const heroImage = parsed.hero_image || fallback?.heroImage || '/assets/editorial/b2b-cafeterias.jpg';

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/alianzas/${segmento}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/alianzas/${segmento}`,
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

  const sectionKey = `b2b_${segmento.replace(/-/g, '_')}`;
  const rows = await getSiteContent(sectionKey, { draft });
  const cmsContent = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const content = parseB2BSegmentContent(cmsContent, segmento as ChromeB2BSegmentSlug);
  const kits = getSegmentKits(segmento, content.kits);
  const questions = getSegmentQuestions(segmento);

  const jsonLdData = mergeJsonLd([
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: 'Alianzas', href: '/alianzas' },
      { name: content.kicker, href: `/alianzas/${segmento}` },
    ]),
    faqJsonLd(content.faq),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main
        data-cms-section={sectionKey}
        className="min-h-[var(--vh-full)] bg-background"
      >
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
              {content.kicker?.trim() ? (
                <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent-text mb-8">
                  {content.kicker}
                </span>
              ) : null}
              <h1 className="font-display text-[clamp(2.25rem,8vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 text-balance">
                {content.headline}
              </h1>
              {content.subheadline?.trim() ? (
                <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto text-pretty mb-10 leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
                  {content.subheadline}
                </p>
              ) : null}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#registro"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 py-3 text-[0.65rem] uppercase tracking-[0.3em] font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  {content.cta_text || 'Acceder al Catálogo'}
                </a>
                <a
                  href="#kits-planificados"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border/80 px-7 py-3 text-[0.65rem] uppercase tracking-[0.3em] font-medium text-foreground hover:border-primary transition-colors"
                >
                  Ver Kits Planificados
                </a>
              </div>
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
                    <p className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-line ${alignToClass(content.text_align)}`}>
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

        {/* ── Kits de Inicio & Trazabilidad Local ── */}
        <B2BSegmentKitsShowcase
          kits={kits}
          segmentLabel={content.kicker}
          segmentSlug={segmento}
        />

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

        {/* ── Formulario de Registro de Alta Conversión ── */}
        <section
          id="registro"
          className="py-20 md:py-28 px-4 border-t border-border/20 bg-surface-raised/30"
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-primary mb-3">
                Acceso & Registro Oficial
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-4 text-balance">
                Accede al Catálogo Dedicado de {content.kicker}
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Crea tu cuenta de aliado comercial para acceder a precios de escala, trazabilidad por lote y la configuración de tu primer pedido.
              </p>
            </div>
            <B2BSegmentRegistration
              segmentSlug={segmento as B2BSegmentSlug}
              segmentLabel={content.kicker}
              segmentTipo={content.tipo}
              kind={segmento === 'revendedores' ? 'revendedor' : 'punto_venta'}
              kits={kits}
              questions={questions}
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
