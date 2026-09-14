'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { type ClubLegadoSettings, resolveLocalized } from '@/lib/shop/store-chrome';

export interface ClubLegadoSectionProps {
  settings?: ClubLegadoSettings;
}

/**
 * Sección del landing que promueve el Club Legado del Bosque.
 * Configurable desde el editor CMS de Núcleo (club_legado_settings).
 */
export function ClubLegadoSection({ settings }: ClubLegadoSectionProps = {}) {
  const tBridge = useTranslations('perfil.bridge');
  const locale = useLocale();

  const kicker =
    resolveLocalized(settings?.kicker, settings?.kicker_en, locale) ||
    tBridge('clubTitle') ||
    'Club Legado del Bosque';
  const title =
    resolveLocalized(settings?.title, settings?.title_en, locale) ||
    'Custodia y recolecciones de temporada';
  const subtitle =
    resolveLocalized(settings?.subtitle, settings?.subtitle_en, locale) ||
    'Como miembro acreditado, accede a las floraciones limitadas del Predio Pureo: ulmo, tiaca y quillay con trazabilidad de colmena y cata de origen.';
  const ctaLabel =
    resolveLocalized(settings?.button_text, settings?.button_text_en, locale) ||
    tBridge('clubCta') ||
    'Unirme al Club';
  const ctaHref = settings?.button_href?.trim() || '/club-legado-del-bosque';

  return (
    <section className="editorial-section bg-surface-sunken" aria-labelledby="club-legado-title">
      <div className="editorial-container max-w-2xl mx-auto text-center px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">{kicker}</span>
        <h2
          id="club-legado-title"
          className="font-display text-[clamp(1.75rem,6vw,3.5rem)] sm:text-4xl md:text-5xl font-light text-foreground text-balance leading-tight mb-6"
        >
          {title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
          {subtitle}
        </p>
        <Link
          href={ctaHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}