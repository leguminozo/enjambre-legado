import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { faqJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { getSiteContent } from '@/lib/cms';
import { parseBotanicalMonographs, type BotanicalMonograph } from '@enjambre/shop-chrome';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell>
      <ShopHeader />
      {children}
      <ShopFooter />
    </StoreShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const rows = await getSiteContent('origen_monografias');
  const allMonographs = parseBotanicalMonographs(rows?.map((r) => r.content) ?? null);
  const monograph = allMonographs.find((m) => m.slug === slug);

  if (!monograph) {
    return {
      title: 'Monografía Botánica · La Obrera y el Zángano',
    };
  }

  return {
    title: `${monograph.common_name} — Miel del Bosque Nativo · La Obrera y el Zángano`,
    description: monograph.short_description,
    alternates: {
      canonical: `/origen/${monograph.slug}`,
    },
    openGraph: {
      title: `${monograph.common_name} (${monograph.scientific_name})`,
      description: monograph.short_description,
      type: 'article',
    },
  };
}

export default async function BotanicalMonographPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const draft = resolvedSearchParams.cms_preview === '1';

  const rows = await getSiteContent('origen_monografias', { draft });
  const allMonographs = parseBotanicalMonographs(rows?.map((r) => r.content) ?? null);
  const monograph = allMonographs.find((m) => m.slug === slug);

  if (!monograph) {
    notFound();
  }

  const defaultFaqs = [
    {
      question: `¿Qué características definen a ${monograph.common_name}?`,
      answer: monograph.short_description,
    },
    {
      question: `¿Cuándo florece ${monograph.common_name}?`,
      answer: `Su ciclo de floración se registra en: ${monograph.flowering_period}.`,
    },
    {
      question: `¿Cuál es el perfil sensorial de la miel de ${monograph.common_name}?`,
      answer: monograph.sensory_profile,
    },
  ];

  const faqSchema = faqJsonLd(
    monograph.faqs && monograph.faqs.length > 0 ? monograph.faqs : defaultFaqs,
  );

  return (
    <Shell>
      <JsonLd data={faqSchema} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
            Biblioteca Botánica · Árboles de Chile
          </span>
          <Link
            href="/origen"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al índice
          </Link>
        </div>

        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-medium leading-tight text-foreground text-balance tracking-tight">
          {monograph.common_name}
        </h1>
        <p className="mt-1 font-display text-xl italic text-muted-foreground">
          {monograph.scientific_name}
        </p>

        <section className="mt-12 space-y-6 text-foreground/80 leading-relaxed">
          <p className="whitespace-pre-line">{monograph.full_description}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Fenología y Período de Floración
          </h2>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <span className="text-xs font-mono uppercase tracking-wider text-accent-text block mb-1">
              Temporada de néctar
            </span>
            <p className="text-sm font-medium text-foreground">{monograph.flowering_period}</p>
          </div>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Perfil Fisicoquímico y Sensorial de la Miel
          </h2>
          <p className="whitespace-pre-line">{monograph.sensory_profile}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Ecología y Hábitat en el Bosque Nativo
          </h2>
          <p className="whitespace-pre-line">{monograph.ecology}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Fuentes Científicas y Referencias
          </h2>
          {monograph.references ? (
            <p className="text-sm opacity-80 italic">{monograph.references}</p>
          ) : (
            <ul className="list-disc pl-6 space-y-2 mt-4 text-sm opacity-80">
              <li>
                Donoso, C. (2006). <em>Las especies arbóreas de los bosques templados de Chile y Argentina</em>. Marisa Cuneo Ediciones.
              </li>
              <li>
                Montenegro, G. et al. (2008). <em>Propiedades antibacterianas y antioxidantes de las mieles chilenas</em>. Pontificia Universidad Católica de Chile.
              </li>
            </ul>
          )}
        </section>

        <div className="mt-16 border-t border-border pt-8 flex items-center justify-between">
          <Link
            href="/origen"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Explorar biblioteca botánica
          </Link>
          <Link
            href="/ciencia"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline transition-colors"
          >
            Ver respaldo científico en Ciencia →
          </Link>
        </div>
      </article>
    </Shell>
  );
}
