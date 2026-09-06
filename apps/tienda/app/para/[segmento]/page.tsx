import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
  Droplets, Flower2,
  ChevronDown,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { breadcrumbJsonLd, faqJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import {
  B2B_SEGMENTS,
  isValidSegment,
  getSegmentContent,
  type B2BSegmentContent,
  type B2BSectionId,
} from '@/lib/b2b/segment-content';
import { B2BRegisterForm } from '@/components/b2b/b2b-register-form';
import { FormatImagesRow } from '@/components/b2b/format-images-row';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';
const WA_E164 = '56940831358';

const DEFAULT_ORDER: B2BSectionId[] = [
  'value',
  'formats',
  'stats',
  'process',
  'leadMagnet',
  'proof',
  'products',
  'faq',
  'form',
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, Coffee, Star, BarChart3, Hotel, Users, Leaf,
  ShoppingBag, Award, Truck, Shield, TrendingUp, Gift, Palette,
  Droplets, Flower2,
};

function waHref(text: string) {
  return `https://wa.me/${WA_E164}?text=${encodeURIComponent(text)}`;
}

export async function generateStaticParams() {
  return B2B_SEGMENTS.map((segmento) => ({ segmento }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>;
}): Promise<Metadata> {
  const { segmento } = await params;
  const content = getSegmentContent(segmento);
  if (!content) return {};

  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: { canonical: `${SITE_URL}/para/${segmento}` },
    openGraph: {
      title: content.seo.title,
      description: content.seo.description,
      url: `${SITE_URL}/para/${segmento}`,
      type: 'website',
      locale: 'es_CL',
      siteName: 'La Obrera y el Zángano',
      images: [{ url: `${SITE_URL}${content.heroImage}`, width: 1600, height: 900 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.seo.title,
      description: content.seo.description,
    },
  };
}

function HeroSection({ content, segmento }: { content: B2BSegmentContent; segmento: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={content.heroImage}
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
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <a
              href={content.ctaHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent px-8 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {content.ctaText}
            </a>
            <Link
              href={`/para/${segmento}/ficha`}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border/60 px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Ver ficha 1 página
            </Link>
            <a
              href={waHref(content.leadMagnet.whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-accent-text underline underline-offset-4"
            >
              WhatsApp mix/precios
            </a>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {content.priceAnchor}
          </p>
        </div>
      </div>
    </section>
  );
}

function ValueSection({ content }: { content: B2BSegmentContent }) {
  return (
    <section className="py-20 md:py-28 px-4 border-t border-border/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
            Propuesta de valor
          </span>
          <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground text-balance">
            {content.valuePropsTitle}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.valueProps.map((prop) => {
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
  );
}

function StatsSection({ content }: { content: B2BSegmentContent }) {
  return (
    <section className="py-16 px-4 border-t border-border/20 bg-surface-raised/30">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
        <p className="mt-10 text-center text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {content.priceAnchor}
        </p>
      </div>
    </section>
  );
}

function ProcessSection({ content }: { content: B2BSegmentContent }) {
  return (
    <section className="py-20 md:py-28 px-4 border-t border-border/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
            Proceso
          </span>
          <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground text-balance">
            {content.processTitle}
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
  );
}

function ProofSection({ content }: { content: B2BSegmentContent }) {
  const { socialProof } = content;
  return (
    <section className="py-20 px-4 border-t border-border/20 bg-surface-raised/30">
      <div className="max-w-3xl mx-auto text-center">
        <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
          {socialProof.kicker}
        </span>
        <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-balance">
          {socialProof.title}
        </h2>
        {socialProof.items && socialProof.items.length > 0 ? (
          <ul className="space-y-4 text-left mb-8">
            {socialProof.items.map((item) => (
              <li
                key={item.name}
                className="rounded-xl border border-border/30 bg-background/60 px-6 py-5"
              >
                <p className="font-display text-lg text-foreground">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.line}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center text-xs uppercase tracking-wider text-accent-text underline underline-offset-4"
                  >
                    {item.href.replace(/^https?:\/\//, '')} →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {socialProof.softLine ? (
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            {socialProof.softLine}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function LeadMagnetSection({
  content,
  segmento,
}: {
  content: B2BSegmentContent;
  segmento: string;
}) {
  return (
    <section className="py-16 px-4 border-t border-border/20">
      <div className="max-w-2xl mx-auto rounded-2xl border border-border/40 bg-surface-raised/40 p-8 text-center">
        <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-4">
          Ficha imprimible
        </span>
        <h2 className="font-display text-2xl font-light text-foreground mb-3">
          {content.leadMagnet.fichaTitle}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {content.leadMagnet.fichaBlurb}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/para/${segmento}/ficha`}
            className="inline-flex min-h-12 items-center rounded-full border border-accent px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Ver ficha 1 página
          </Link>
          <a
            href={waHref(content.leadMagnet.whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function ProductsSection({ content }: { content: B2BSegmentContent }) {
  return (
    <section className="py-20 px-4 border-t border-border/20 bg-surface-raised/30">
      <div className="max-w-3xl mx-auto text-center">
        <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
          Nuestras creaciones
        </span>
        <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-6 text-balance">
          Conoce nuestros productos
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto mb-10">
          {content.suggestedProductsCopy}
        </p>
        <Link
          href="/catalogo"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Explorar catálogo →
        </Link>
      </div>
    </section>
  );
}

function FaqSection({ content }: { content: B2BSegmentContent }) {
  return (
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
  );
}

function FormSection({
  content,
  segmento,
}: {
  content: B2BSegmentContent;
  segmento: string;
}) {
  return (
    <section
      id="registro"
      className="py-20 md:py-28 px-4 border-t border-border/20 bg-surface-raised/30"
    >
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent-text mb-6">
            {content.formKicker}
          </span>
          <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-4 text-balance">
            {content.formTitle}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {content.formIntro}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
            {content.priceAnchor}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-2">
            <Link
              href={`/para/${segmento}/ficha`}
              className="inline-flex min-h-11 items-center text-xs uppercase tracking-wider text-accent-text underline underline-offset-4"
            >
              Ver ficha 1 página
            </Link>
            <a
              href={waHref(content.leadMagnet.whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-xs uppercase tracking-wider text-muted-foreground underline underline-offset-4"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <B2BRegisterForm
          segmentType={content.tipo as 'cafeteria' | 'tienda_gourmet' | 'hotel' | 'feria_evento' | 'otro'}
          segmentLabel={content.kicker}
          kind={segmento === 'revendedores' ? 'revendedor' : 'punto_venta'}
          submitLabel={content.submitLabel}
        />
      </div>
    </section>
  );
}

function renderSection(
  id: B2BSectionId,
  content: B2BSegmentContent,
  segmento: string,
) {
  switch (id) {
    case 'proof':
      return <ProofSection key={id} content={content} />;
    case 'value':
      return <ValueSection key={id} content={content} />;
    case 'stats':
      return <StatsSection key={id} content={content} />;
    case 'process':
      return <ProcessSection key={id} content={content} />;
    case 'formats':
      return (
        <FormatImagesRow
          key={id}
          frames={content.formatImages}
          title="Formatos 25 · 150 · 500"
        />
      );
    case 'leadMagnet':
      return <LeadMagnetSection key={id} content={content} segmento={segmento} />;
    case 'products':
      return <ProductsSection key={id} content={content} />;
    case 'faq':
      return <FaqSection key={id} content={content} />;
    case 'form':
      return <FormSection key={id} content={content} segmento={segmento} />;
    default:
      return null;
  }
}

export default async function ParaSegmentoPage({
  params,
}: {
  params: Promise<{ segmento: string }>;
}) {
  const { segmento } = await params;

  if (!isValidSegment(segmento)) {
    notFound();
  }

  const content = getSegmentContent(segmento);
  if (!content) notFound();

  const order = content.sectionsOrder ?? DEFAULT_ORDER;

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
        <HeroSection content={content} segmento={segmento} />
        {order.map((id) => renderSection(id, content, segmento))}

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
