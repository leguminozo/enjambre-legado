import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { faqJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { getLocale } from 'next-intl/server';
import { getSiteContent } from '@/lib/cms';
import {
  parseBotanicalMonographs,
  resolveLocalized,
  type BotanicalMonograph,
} from '@enjambre/shop-chrome';

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

  const [rows, locale] = await Promise.all([
    getSiteContent('origen_monografias', { draft }),
    getLocale(),
  ]);
  const allMonographs = parseBotanicalMonographs(rows?.map((r) => r.content) ?? null);
  const monograph = allMonographs.find((m) => m.slug === slug);

  if (!monograph) {
    notFound();
  }

  const commonName = resolveLocalized(monograph.common_name, monograph.common_name_en, locale) || monograph.common_name;
  const shortDescription = resolveLocalized(monograph.short_description, monograph.short_description_en, locale) || monograph.short_description;
  const floweringPeriod = resolveLocalized(monograph.flowering_period, monograph.flowering_period_en, locale) || monograph.flowering_period;
  const sensoryProfile = resolveLocalized(monograph.sensory_profile, monograph.sensory_profile_en, locale) || monograph.sensory_profile;
  const fullDescription = resolveLocalized(monograph.full_description, monograph.full_description_en, locale) || monograph.full_description;
  const ecology = resolveLocalized(monograph.ecology, monograph.ecology_en, locale) || monograph.ecology;
  const references = monograph.references;

  const defaultFaqs = [
    {
      question: locale === 'en' ? `What defines ${commonName}?` : `¿Qué características definen a ${commonName}?`,
      answer: shortDescription,
    },
    {
      question: locale === 'en' ? `When does ${commonName} bloom?` : `¿Cuándo florece ${commonName}?`,
      answer: locale === 'en' ? `Its flowering cycle is recorded during: ${floweringPeriod}.` : `Su ciclo de floración se registra en: ${floweringPeriod}.`,
    },
    {
      question: locale === 'en' ? `What is the sensory profile of ${commonName} honey?` : `¿Cuál es el perfil sensorial de la miel de ${commonName}?`,
      answer: sensoryProfile,
    },
  ];

  const faqSchema = faqJsonLd(
    monograph.faqs && monograph.faqs.length > 0 ? monograph.faqs : defaultFaqs,
  );

  return (
    <Shell>
      <JsonLd data={faqSchema} />
      <article
        data-cms-section="origen_monografias"
        className="mx-auto max-w-3xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
            {locale === 'en' ? 'Botanical Library · Native Trees of Chile' : 'Biblioteca Botánica · Árboles de Chile'}
          </span>
          <Link
            href="/origen"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {locale === 'en' ? '← Back to index' : '← Volver al índice'}
          </Link>
        </div>

        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-medium leading-tight text-foreground text-balance tracking-tight">
          {commonName}
        </h1>
        <p className="mt-1 font-display text-xl italic text-muted-foreground">
          {monograph.scientific_name}
        </p>

        <section className="mt-12 space-y-6 text-foreground/80 leading-relaxed">
          <p className="whitespace-pre-line">{fullDescription}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            {locale === 'en' ? 'Phenology & Flowering Period' : 'Fenología y Período de Floración'}
          </h2>
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <span className="text-xs font-mono uppercase tracking-wider text-accent-text block mb-1">
              {locale === 'en' ? 'Nectar Season' : 'Temporada de néctar'}
            </span>
            <p className="text-sm font-medium text-foreground">{floweringPeriod}</p>
          </div>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            {locale === 'en' ? 'Physicochemical & Sensorial Profile of Honey' : 'Perfil Fisicoquímico y Sensorial de la Miel'}
          </h2>
          <p className="whitespace-pre-line">{sensoryProfile}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            {locale === 'en' ? 'Ecology & Native Rainforest Habitat' : 'Ecología y Hábitat en el Bosque Nativo'}
          </h2>
          <p className="whitespace-pre-line">{ecology}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            {locale === 'en' ? 'Scientific Sources & References' : 'Fuentes Científicas y Referencias'}
          </h2>
          {references ? (
            <p className="text-sm opacity-80 italic">{references}</p>
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
            {locale === 'en' ? '← Explore botanical library' : '← Explorar biblioteca botánica'}
          </Link>
          <Link
            href="/ciencia"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline transition-colors"
          >
            {locale === 'en' ? 'View scientific backing in Science →' : 'Ver respaldo científico en Ciencia →'}
          </Link>
        </div>
      </article>
    </Shell>
  );
}
