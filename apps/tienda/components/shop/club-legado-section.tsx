'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { type ClubLegadoSettings, resolveLocalized, alignToClass } from '@/lib/shop/store-chrome';

export interface ClubLegadoSectionProps {
  settings?: ClubLegadoSettings;
}

/**
 * Sección del landing que promueve el Club Legado del Bosque.
 * Configurable desde el editor CMS de Núcleo (club_legado_settings).
 */
export function ClubLegadoSection({ settings }: ClubLegadoSectionProps = {}) {
  const locale = useLocale();

  const kicker = resolveLocalized(settings?.kicker, settings?.kicker_en, locale);
  const title = resolveLocalized(settings?.title, settings?.title_en, locale);
  const subtitle = resolveLocalized(settings?.subtitle, settings?.subtitle_en, locale);
  const ctaLabel = resolveLocalized(settings?.button_text, settings?.button_text_en, locale);
  const ctaHref = settings?.button_href?.trim() || '/club-legado-del-bosque';
  const trustLabel = resolveLocalized(
    settings?.trust_label,
    settings?.trust_label_en,
    locale,
  );

  const showCard = settings?.show_card !== false;
  const cardImage =
    settings?.card_image?.trim() ||
    'https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/club_page_settings/c1e9a4e9-2af8-4fbe-8111-dc07d0e539af.webp';
  const cardImageAlt = resolveLocalized(
    settings?.card_image_alt,
    settings?.card_image_alt_en,
    locale,
  );
  const cardKicker = resolveLocalized(
    settings?.card_kicker,
    settings?.card_kicker_en,
    locale,
  );
  const cardBadge = resolveLocalized(settings?.card_badge, settings?.card_badge_en, locale);
  const cardImageLabel = resolveLocalized(
    settings?.card_image_label,
    settings?.card_image_label_en,
    locale,
  );
  const cardImageSublabel = resolveLocalized(
    settings?.card_image_sublabel,
    settings?.card_image_sublabel_en,
    locale,
  );
  const cardBenefits = [
    resolveLocalized(settings?.card_benefit_1, settings?.card_benefit_1_en, locale),
    resolveLocalized(settings?.card_benefit_2, settings?.card_benefit_2_en, locale),
    resolveLocalized(settings?.card_benefit_3, settings?.card_benefit_3_en, locale),
    resolveLocalized(settings?.card_benefit_4, settings?.card_benefit_4_en, locale),
  ].filter(Boolean);
  const cardTitle = resolveLocalized(settings?.card_title, settings?.card_title_en, locale);
  const cardSubtitle = resolveLocalized(
    settings?.card_subtitle,
    settings?.card_subtitle_en,
    locale,
  );

  return (
    <section
      className="editorial-section relative overflow-hidden border-y border-border/30 bg-surface-sunken"
      aria-labelledby="club-legado-title"
    >
      <div className="editorial-container">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* Columna Izquierda: Mensaje y Acción */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            {kicker && <span className="editorial-kicker block">{kicker}</span>}

            {title ? (
              <h2
                id="club-legado-title"
                className="font-display text-[clamp(2rem,5vw,3.25rem)] font-light text-foreground text-balance leading-tight"
              >
                {title}
              </h2>
            ) : null}

            {subtitle && (
              <p
                className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 whitespace-pre-line ${alignToClass(
                  settings?.text_align,
                )}`}
              >
                {subtitle}
              </p>
            )}

            {trustLabel ? (
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-muted-foreground/90">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-text" />
                  <span>{trustLabel}</span>
                </div>
              </div>
            ) : null}

            {ctaLabel && (
              <div className="pt-2">
                <Link
                  href={ctaHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_24px_rgba(201,162,39,0.1)] active:scale-[0.98]"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Columna Derecha: Tarjeta de Membresía y Privilegios */}
          {showCard ? (
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl border border-border/40 bg-card p-6 flex flex-col justify-between shadow-xl overflow-hidden">
                {(cardKicker || cardBadge) && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/20 pb-3">
                    {cardKicker ? (
                      <span className="font-mono uppercase tracking-wider text-accent-text font-semibold">
                        {cardKicker}
                      </span>
                    ) : null}
                    {cardBadge ? <span>{cardBadge}</span> : null}
                  </div>
                )}

                <div className="relative flex-1 flex flex-col justify-center py-3">
                  {cardImage ? (
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-border/30 mb-3">
                      <Image
                        src={cardImage}
                        alt={cardImageAlt || cardTitle || 'Club Legado'}
                        fill
                        sizes="280px"
                        className="object-cover transition-transform duration-elegant hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                      {(cardImageLabel || cardImageSublabel) && (
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-foreground/90">
                          {cardImageLabel ? (
                            <span className="font-medium tracking-wide">{cardImageLabel}</span>
                          ) : null}
                          {cardImageSublabel ? (
                            <span className="text-accent-text">{cardImageSublabel}</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {cardBenefits.length > 0 && (
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {cardBenefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-text shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {(cardTitle || cardSubtitle) && (
                  <div className="border-t border-border/20 pt-3 text-center">
                    {cardTitle ? (
                      <p className="font-display text-base font-light text-foreground">
                        {cardTitle}
                      </p>
                    ) : null}
                    {cardSubtitle ? (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cardSubtitle}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}