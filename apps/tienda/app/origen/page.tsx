import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import {
  parseOrigenSettings,
  parseBotanicalMonographs,
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

  const [origenRows, monografiasRows] = await Promise.all([
    getSiteContent('origen_settings', { draft }),
    getSiteContent('origen_monografias', { draft }),
  ]);

  const origenSettings = parseOrigenSettings(
    (origenRows?.[0]?.content as Record<string, unknown>) ?? null,
  );
  const monographs = parseBotanicalMonographs(
    monografiasRows?.map((r) => r.content) ?? null,
  );

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 min-h-[60vh]">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {origenSettings.kicker}
        </span>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight text-foreground">
          {origenSettings.title}
        </h1>
        <p className="mt-6 max-w-2xl text-foreground/80 leading-relaxed">
          {origenSettings.description}
        </p>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monographs.map((mono) => (
            <Link
              key={mono.slug}
              href={`/origen/${mono.slug}`}
              className="group block border border-border/70 bg-card p-6 sm:p-7 rounded-2xl hover:border-primary/50 hover:bg-surface-raised transition-all duration-150 shadow-sm"
            >
              <h2 className="font-display text-2xl font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
                {mono.common_name}
              </h2>
              <p className="mt-1 text-sm italic text-muted-foreground">{mono.scientific_name}</p>
              <p className="mt-4 text-sm text-foreground/70 leading-relaxed line-clamp-3">
                {mono.short_description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-primary group-hover:gap-2 transition-all">
                Leer monografía →
              </span>
            </Link>
          ))}
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
