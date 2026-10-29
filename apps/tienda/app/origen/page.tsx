import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { CienciaCanvas } from '@/components/shop/ciencia-canvas';
import { getSiteContent } from '@/lib/cms';
import {
  parseOrigenSettings,
  parseBotanicalMonographs,
  resolveLocalized,
  alignToClass,
} from '@enjambre/shop-chrome';

export const metadata: Metadata = {
  title: 'Origen & Floraciones — La Obrera y el Zángano',
  description: 'Colección de monografías científicas sobre las fuentes florales del bosque nativo chileno.',
};

export default async function OrigenIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const draft = resolvedSearchParams.cms_preview === '1';

  const [origenRows, monografiasRows, locale] = await Promise.all([
    getSiteContent('origen_settings', { draft }),
    getSiteContent('origen_monografias', { draft }),
    getLocale(),
  ]);

  const origenSettings = parseOrigenSettings(
    (origenRows?.[0]?.content as Record<string, unknown>) ?? null,
  );
  const monographs = parseBotanicalMonographs(
    monografiasRows?.map((r) => r.content) ?? null,
  );

  const kicker = resolveLocalized(origenSettings.kicker, origenSettings.kicker_en, locale);
  const title = resolveLocalized(origenSettings.title, origenSettings.title_en, locale);
  const description = resolveLocalized(origenSettings.description, origenSettings.description_en, locale);

  return (
    <StoreShell>
      <ShopHeader />
      <main
        data-cms-section="origen_settings"
        className="min-h-[var(--vh-full)] bg-background"
      >
        <EditorialHero
          sectionKey="origen_settings"
          kicker={kicker}
          title={title || 'Origen & Floraciones Nativas'}
          subtitle={description}
          align={origenSettings.text_align}
          variant="deep-code"
          backgroundSlot={<CienciaCanvas />}
          scrollCueLabel={locale === 'en' ? 'Explore botanical monographs' : 'Explorar monografías botánicas'}
        />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="flex flex-wrap justify-center gap-6">
          {monographs.map((mono) => (
            <Link
              key={mono.slug}
              href={`/origen/${mono.slug}`}
              className="group flex flex-col justify-between border border-border/70 bg-card p-6 sm:p-7 rounded-2xl hover:border-primary/50 hover:bg-surface-raised transition-all duration-150 shadow-sm w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <div>
                {mono.image_url ? (
                  <div className="relative h-44 w-full mb-4 rounded-xl overflow-hidden bg-surface-raised">
                    <Image
                      src={mono.image_url}
                      alt={resolveLocalized(mono.common_name, mono.common_name_en, locale) || mono.common_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : null}
                <h2 className="font-display text-2xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {resolveLocalized(mono.common_name, mono.common_name_en, locale) || mono.common_name}
                </h2>
                <p className="mt-1 text-sm italic text-muted-foreground">{mono.scientific_name}</p>
                <p className={`mt-4 text-sm text-foreground/70 leading-relaxed line-clamp-3 whitespace-pre-line ${alignToClass(origenSettings.text_align)}`}>
                  {resolveLocalized(mono.short_description, mono.short_description_en, locale) || mono.short_description}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary group-hover:gap-2 transition-all">
                {locale === 'en' ? 'Read monograph →' : 'Leer monografía →'}
              </span>
            </Link>
          ))}
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
