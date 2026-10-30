import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Clock,
  ArrowRight,
  Home,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { ExperienceInquiryForm } from '@/components/experiencias/experience-inquiry-form';
import { getSiteContent } from '@/lib/cms';
import { parseExperienciasSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/shop/page-metadata';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/experiencias', {
    title: 'Encuentros en el Bosque Austral · La Obrera y el Zángano',
    description:
      'Inmersión territorial en Chiloé, catas de mieles de Chile y talleres de técnica apícola. Sesiones a puerta cerrada conducidas por Cristina Miranda.',
  });
}

function renderSpecText(value: string | undefined, defaultPrefix: string): string {
  if (!value) return '';
  let trimmed = value.trim();
  trimmed = trimmed.replace(
    /^(?:Espacio|Aforo|Duración|Enfoque|Modalidad|Space|Capacity|Duration|Focus):\s*(?:Espacio|Aforo|Duración|Enfoque|Modalidad|Space|Capacity|Duration|Focus):\s*/i,
    (m) => {
      const parts = m.split(':').map((s) => s.trim()).filter(Boolean);
      const prefix = parts[1] || parts[0];
      return `${prefix}: `;
    },
  );
  if (/^[^:]+:\s*.+$/.test(trimmed)) {
    return trimmed;
  }
  return `${defaultPrefix}: ${trimmed}`;
}

export default async function ExperienciasPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [expRows, locale] = await Promise.all([
    getSiteContent('experiencias_settings', { draft }),
    getLocale(),
  ]);
  const isEn = locale === 'en';

  const expSettings = parseExperienciasSettings(
    (expRows?.[0]?.content as Record<string, unknown>) ?? null,
  );

  const heroKicker = resolveLocalized(expSettings.hero_kicker, expSettings.hero_kicker_en, locale);
  const heroTitle =
    resolveLocalized(expSettings.hero_title, expSettings.hero_title_en, locale) ||
    'Encuentros en el Bosque Austral';
  const heroSubtitle = resolveLocalized(expSettings.hero_subtitle, expSettings.hero_subtitle_en, locale);
  const heroImage =
    expSettings.hero_image || '/assets/editorial/hero-bosque-apertura.jpg';
  const heroOpacity = expSettings.hero_image_opacity ?? 45;
  const heroCtaLabel = resolveLocalized(expSettings.hero_cta_label, expSettings.hero_cta_label_en, locale);
  const heroCtaHref = expSettings.hero_cta_href || '#encuentros';
  const heroSecondaryLabel =
    resolveLocalized(expSettings.hero_secondary_label, expSettings.hero_secondary_label_en, locale);
  const heroSecondaryHref = expSettings.hero_secondary_href || '#solicitud';

  const flagshipBadge =
    resolveLocalized(expSettings.flagship_badge, expSettings.flagship_badge_en, locale);
  const flagshipTag =
    resolveLocalized(expSettings.flagship_tag ?? expSettings.card2_tag, expSettings.flagship_tag_en ?? expSettings.card2_tag_en, locale);
  const flagshipTitle =
    resolveLocalized(expSettings.flagship_title, expSettings.flagship_title_en, locale);
  const flagshipDesc =
    resolveLocalized(expSettings.flagship_desc, expSettings.flagship_desc_en, locale);
  const flagshipFormat =
    resolveLocalized(expSettings.flagship_format, expSettings.flagship_format_en, locale);
  const flagshipCapacity =
    resolveLocalized(expSettings.flagship_capacity, expSettings.flagship_capacity_en, locale);
  const flagshipDuration =
    resolveLocalized(expSettings.flagship_duration, expSettings.flagship_duration_en, locale);
  const flagshipCtaLabel =
    resolveLocalized(expSettings.flagship_cta_label, expSettings.flagship_cta_label_en, locale);
  const flagshipHref = expSettings.flagship_href || '/experiencias/degustaciones';
  const flagshipImage = expSettings.flagship_image || '/assets/editorial/honey-jar.png';
  const showFlagshipCard = expSettings.show_flagship_card !== false;

  // Badges hero
  const specsBadge1Label = resolveLocalized(expSettings.specs_badge1_label, expSettings.specs_badge1_label_en, locale);
  const specsBadge1Value = resolveLocalized(expSettings.specs_badge1_value, expSettings.specs_badge1_value_en, locale);
  const specsBadge2Label = resolveLocalized(expSettings.specs_badge2_label, expSettings.specs_badge2_label_en, locale);
  const specsBadge2Value = resolveLocalized(expSettings.specs_badge2_value, expSettings.specs_badge2_value_en, locale);
  const specsBadge3Label = resolveLocalized(expSettings.specs_badge3_label, expSettings.specs_badge3_label_en, locale);
  const specsBadge3Value = resolveLocalized(expSettings.specs_badge3_value, expSettings.specs_badge3_value_en, locale);

  // Trilogía
  const trilogiaKicker = resolveLocalized(expSettings.trilogia_kicker, expSettings.trilogia_kicker_en, locale);
  const trilogiaTitle = resolveLocalized(expSettings.trilogia_title, expSettings.trilogia_title_en, locale);
  const trilogiaSubtitle = resolveLocalized(expSettings.trilogia_subtitle, expSettings.trilogia_subtitle_en, locale);

  // Card 1: Territorio
  const card1Tag = resolveLocalized(expSettings.card1_tag, expSettings.card1_tag_en, locale);
  const card1Title = resolveLocalized(expSettings.card1_title, expSettings.card1_title_en, locale);
  const card1Desc = resolveLocalized(expSettings.card1_desc, expSettings.card1_desc_en, locale);
  const card1Space = resolveLocalized(expSettings.card1_space, expSettings.card1_space_en, locale);
  const card1Capacity = resolveLocalized(expSettings.card1_capacity, expSettings.card1_capacity_en, locale);
  const card1Duration = resolveLocalized(expSettings.card1_duration, expSettings.card1_duration_en, locale);
  const card1CtaLabel = resolveLocalized(expSettings.card1_cta_label, expSettings.card1_cta_label_en, locale);
  const card1CtaHref = expSettings.card1_cta_href || '/experiencias/territorio';
  const card1Image = expSettings.card1_image || '/assets/editorial/hero-bosque-tronco.jpg';

  // Card 3: Talleres
  const card3Tag = resolveLocalized(expSettings.card3_tag, expSettings.card3_tag_en, locale);
  const card3Title = resolveLocalized(expSettings.card3_title, expSettings.card3_title_en, locale);
  const card3Desc = resolveLocalized(expSettings.card3_desc, expSettings.card3_desc_en, locale);
  const card3Focus = resolveLocalized(expSettings.card3_focus, expSettings.card3_focus_en, locale);
  const card3Capacity = resolveLocalized(expSettings.card3_capacity, expSettings.card3_capacity_en, locale);
  const card3Duration = resolveLocalized(expSettings.card3_duration, expSettings.card3_duration_en, locale);
  const card3CtaLabel = resolveLocalized(expSettings.card3_cta_label, expSettings.card3_cta_label_en, locale);
  const card3CtaHref = expSettings.card3_cta_href || '/experiencias/talleres';
  const card3Image = expSettings.card3_image || '/assets/editorial/hero-hueco.jpg';

  return (
    <StoreShell>
      <ShopHeader />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero Cinemático & Editorial: Presencia en el Bosque ── */}
        <EditorialHero
          sectionKey="experiencias_settings"
          kicker={heroKicker}
          title={heroTitle}
          subtitle={heroSubtitle}
          imageUrl={heroImage}
          imageOpacity={heroOpacity}
          imageAlt="Bosque nativo templado lluvioso en Chiloé"
          align={expSettings.text_align}
          ctaLabel={heroCtaLabel}
          ctaHref={heroCtaHref}
          secondaryCtaLabel={heroSecondaryLabel}
          secondaryCtaHref={heroSecondaryHref}
          preferAnchor
        >
          {/* Badges de especificación editorial */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto text-left border-y border-border/30 py-4 backdrop-blur-xs">
            <div className="border-r border-border/20 pr-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">{specsBadge1Label}</span>
              <span className="text-xs text-foreground font-medium">{specsBadge1Value}</span>
            </div>
            <div className="border-r border-border/20 pr-2 pl-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">{specsBadge2Label}</span>
              <span className="text-xs text-foreground font-medium">{specsBadge2Value}</span>
            </div>
            <div className="pl-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">{specsBadge3Label}</span>
              <span className="text-xs text-foreground font-medium">{specsBadge3Value}</span>
            </div>
          </div>
        </EditorialHero>

        {/* ── Trilogía de Encuentros: Tarjetas Editoriales Vivas ── */}
        <section id="encuentros" className="py-20 md:py-28 px-4 sm:px-6 border-b border-border/20 bg-surface-sunken/40 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-16">
              {trilogiaKicker ? (
                <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                  {trilogiaKicker}
                </span>
              ) : null}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
                {trilogiaTitle}
              </h2>
              {trilogiaSubtitle ? (
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {trilogiaSubtitle}
                </p>
              ) : null}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Card 1: Territorio */}
              <div className="group rounded-3xl border border-border/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
                <div>
                  {/* Fotografía de portada con gradiente */}
                  <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                    <Image
                      src={card1Image}
                      alt={card1Title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    {card1Tag ? (
                      <div className="absolute top-4 left-4">
                        <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-border/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                          {card1Tag}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                      {card1Title}
                    </h3>
                    <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line ${alignToClass(expSettings.text_align)}`}>
                      {card1Desc}
                    </p>

                    <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                      {card1Space ? (
                        <div className="flex items-center gap-2">
                          <Home className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card1Space, isEn ? 'Space' : 'Espacio')}</span>
                        </div>
                      ) : null}
                      {card1Capacity ? (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card1Capacity, isEn ? 'Capacity' : 'Aforo')}</span>
                        </div>
                      ) : null}
                      {card1Duration ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card1Duration, isEn ? 'Duration' : 'Duración')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href={card1CtaHref}
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  >
                    <span>{card1CtaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Degustaciones (Insignia Nacional) */}
              {showFlagshipCard ? (
                <div className="group rounded-3xl border border-accent/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent transition-all duration-300 shadow-xl shadow-accent/5 hover:shadow-2xl hover:shadow-accent/15 relative">
                  {flagshipBadge ? (
                    <div className="absolute top-0 right-0 z-20 bg-accent text-accent-foreground px-4 py-1 text-[0.65rem] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">
                      {flagshipBadge}
                    </div>
                  ) : null}

                  <div>
                    {/* Fotografía de portada con gradiente */}
                    <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                      <Image
                        src={flagshipImage}
                        alt={flagshipTitle}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className={`${flagshipImage.includes('honey-jar') ? 'object-contain p-6' : 'object-cover'} group-hover:scale-105 transition-transform duration-700 ease-out opacity-90`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                      {flagshipTag ? (
                        <div className="absolute top-4 left-4">
                          <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-accent/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                            {flagshipTag}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="p-6 sm:p-7">
                      <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                        {flagshipTitle}
                      </h3>
                      <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line ${alignToClass(expSettings.text_align)}`}>
                        {flagshipDesc}
                      </p>

                      <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                        {flagshipFormat ? (
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-accent-text shrink-0" />
                            <span>{renderSpecText(flagshipFormat, isEn ? 'Contrast honeys' : 'Mieles de contraste')}</span>
                          </div>
                        ) : null}
                        {flagshipCapacity ? (
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                            <span>{renderSpecText(flagshipCapacity, isEn ? 'Capacity' : 'Aforo')}</span>
                          </div>
                        ) : null}
                        {flagshipDuration ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                            <span>{renderSpecText(flagshipDuration, isEn ? 'Duration' : 'Duración')}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 pt-0">
                    <Link
                      href={flagshipHref}
                      className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                      <span>{flagshipCtaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* Card 3: Talleres */}
              <div className="group rounded-3xl border border-border/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
                <div>
                  {/* Fotografía de portada con gradiente */}
                  <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                    <Image
                      src={card3Image}
                      alt={card3Title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    {card3Tag ? (
                      <div className="absolute top-4 left-4">
                        <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-border/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                          {card3Tag}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                      {card3Title}
                    </h3>
                    <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line ${alignToClass(expSettings.text_align)}`}>
                      {card3Desc}
                    </p>

                    <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                      {card3Focus ? (
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card3Focus, isEn ? 'Focus' : 'Enfoque')}</span>
                        </div>
                      ) : null}
                      {card3Capacity ? (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card3Capacity, isEn ? 'Capacity' : 'Aforo')}</span>
                        </div>
                      ) : null}
                      {card3Duration ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-accent-text shrink-0" />
                          <span>{renderSpecText(card3Duration, isEn ? 'Duration' : 'Duración')}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href={card3CtaHref}
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  >
                    <span>{card3CtaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formulario de Solicitud Directa ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20 scroll-mt-28 md:scroll-mt-36">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm initialFormat="corporativo" />
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
