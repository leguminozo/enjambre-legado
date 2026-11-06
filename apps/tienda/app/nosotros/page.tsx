import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContentBatch } from '@/lib/cms';
import { parseNosotrosSettings, parseNosotrosContent, resolveLocalized, alignToClass } from '@/lib/shop/store-chrome';
import { articleJsonLd, breadcrumbJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { ArrowRight, Edit3 } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { getNucleoAppUrl } from '@/lib/shop/nucleo-app-url';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

const aspectClassMap: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  'auto': 'aspect-auto',
};

import { createPageMetadata } from '@/lib/shop/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/nosotros', {
    title: 'Nosotros · Renacer de las Cenizas en Chiloé',
    description:
      'Desde el año 2003, un camino de aprendizajes, cambios y experiencia. Presencia en el bosque nativo de Chiloé y estándar de recolección apícola — La Obrera y el Zángano.',
    ogType: 'article',
  });
}

export default async function NosotrosPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  const supabase = await createClient();
  const [{ data: { user } }, [batch, locale]] = await Promise.all([
    supabase.auth.getUser(),
    Promise.all([
      getSiteContentBatch(['nosotros', 'nosotros_settings', 'galeria'], { draft }),
      getLocale(),
    ]),
  ]);
  const staffRole = (user?.app_metadata?.role as string | undefined) ?? null;
  const isStaff = isNucleoStaffRole(staffRole);

  const cmsRows = batch.nosotros ?? [];
  const nosotrosSettings = parseNosotrosSettings((batch.nosotros_settings?.[0]?.content as Record<string, unknown>) ?? null);
  const nosotrosContent = parseNosotrosContent((cmsRows[0]?.content as Record<string, unknown>) ?? null);

  const rawGaleria = batch.galeria ?? [];
  const galeriaCmsItems = rawGaleria
    .map((row) => {
      const c = (row.content as Record<string, unknown>) ?? {};
      return {
        id: row.id,
        titulo: resolveLocalized(c.titulo as string, c.titulo_en as string, locale) || '',
        descripcion: resolveLocalized(c.descripcion as string, c.descripcion_en as string, locale) || '',
        url: typeof c.url === 'string' ? c.url : '',
        orden: typeof c.orden === 'number' ? c.orden : 0,
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.orden - b.orden);

  const defaultArchiveImages = [
    {
      id: 'def-1',
      titulo: locale === 'en' ? 'Ulmo Blossom' : 'Flor de Ulmo',
      descripcion: locale === 'en' ? 'Native blossom in Chiloé canopy' : 'Floración nativa en el dosel del bosque',
      url: '/assets/editorial/hero-bosque-tronco.jpg',
    },
    {
      id: 'def-2',
      titulo: locale === 'en' ? 'Chiloé Apiary' : 'Apiario en Bosque Nativo',
      descripcion: locale === 'en' ? 'Hives in rainforest sanctuary' : 'Colmenas en el bosque templado lluvioso',
      url: '/assets/editorial/hero-bosque-apertura.jpg',
    },
    {
      id: 'def-3',
      titulo: locale === 'en' ? 'Raw Honey Jar' : 'Miel de Origen',
      descripcion: locale === 'en' ? 'Cold-creamed living honey' : 'Miel cruda batida en frío sin aditivos',
      url: '/assets/editorial/honey-jar.png',
    },
    {
      id: 'def-4',
      titulo: locale === 'en' ? 'Territorial Immersion' : 'Inmersión Territorial',
      descripcion: locale === 'en' ? 'Coastal range of Chiloé' : 'Fiordo y bosque en la cordillera de la Costa',
      url: '/assets/editorial/experiencias.jpg',
    },
    {
      id: 'def-5',
      titulo: locale === 'en' ? 'Historic Sachet' : 'Gotas de Néctar',
      descripcion: locale === 'en' ? 'Pioneering format' : 'Formato pionero de miel virgen en sachet',
      url: '/assets/editorial/sachets.png',
    },
    {
      id: 'def-6',
      titulo: locale === 'en' ? 'Living Forest' : 'Bosque Lluvioso',
      descripcion: locale === 'en' ? 'Rainforest canopy' : 'Dosel regenerado tras dos décadas de cuidado',
      url: '/assets/editorial/immersion.png',
    },
  ];

  const archiveImages = galeriaCmsItems.length > 0 ? galeriaCmsItems.slice(0, 6) : defaultArchiveImages;

  const heroKicker =
    resolveLocalized(nosotrosSettings.kicker, nosotrosSettings.kicker_en, locale);
  const heroTitle =
    resolveLocalized(nosotrosSettings.title, nosotrosSettings.title_en, locale);
  const heroDesc =
    resolveLocalized(nosotrosSettings.subtitle, nosotrosSettings.subtitle_en, locale);
  const heroImage =
    (typeof nosotrosSettings.hero_image === 'string' && nosotrosSettings.hero_image) ||
    '/assets/editorial/nosotros-hero.jpg';

  const giroKicker = resolveLocalized(nosotrosContent.giro_kicker, nosotrosContent.giro_kicker_en, locale);
  const giroTitle = resolveLocalized(nosotrosContent.giro_title, nosotrosContent.giro_title_en, locale);
  const giroP1 = resolveLocalized(nosotrosContent.giro_p1, nosotrosContent.giro_p1_en, locale);
  const giroP2 = resolveLocalized(nosotrosContent.giro_p2, nosotrosContent.giro_p2_en, locale);
  const giroP3 = resolveLocalized(nosotrosContent.giro_p3, nosotrosContent.giro_p3_en, locale);
  const historia = resolveLocalized(nosotrosContent.historia, nosotrosContent.historia_en, locale);

  const cronicaKicker = resolveLocalized(nosotrosContent.cronica_kicker, nosotrosContent.cronica_kicker_en, locale);
  const cronicaTitle = resolveLocalized(nosotrosContent.cronica_title, nosotrosContent.cronica_title_en, locale);

  const movimientos = [
    {
      year: nosotrosContent.mov1_year,
      title: resolveLocalized(nosotrosContent.mov1_title, nosotrosContent.mov1_title_en, locale),
      desc: resolveLocalized(nosotrosContent.mov1_desc, nosotrosContent.mov1_desc_en, locale),
    },
    {
      year: nosotrosContent.mov2_year,
      title: resolveLocalized(nosotrosContent.mov2_title, nosotrosContent.mov2_title_en, locale),
      desc: resolveLocalized(nosotrosContent.mov2_desc, nosotrosContent.mov2_desc_en, locale),
    },
    {
      year: nosotrosContent.mov3_year,
      title: resolveLocalized(nosotrosContent.mov3_title, nosotrosContent.mov3_title_en, locale),
      desc: resolveLocalized(nosotrosContent.mov3_desc, nosotrosContent.mov3_desc_en, locale),
    },
    {
      year: nosotrosContent.mov4_year,
      title: resolveLocalized(nosotrosContent.mov4_title, nosotrosContent.mov4_title_en, locale),
      desc: resolveLocalized(nosotrosContent.mov4_desc, nosotrosContent.mov4_desc_en, locale),
    },
    {
      year: resolveLocalized(nosotrosContent.mov5_year, nosotrosContent.mov5_year_en, locale),
      title: resolveLocalized(nosotrosContent.mov5_title, nosotrosContent.mov5_title_en, locale),
      desc: resolveLocalized(nosotrosContent.mov5_desc, nosotrosContent.mov5_desc_en, locale),
    },
  ];

  const principiosKicker = resolveLocalized(nosotrosContent.principios_kicker, nosotrosContent.principios_kicker_en, locale);
  const principiosTitle = resolveLocalized(nosotrosContent.principios_title, nosotrosContent.principios_title_en, locale);

  const misionKicker = resolveLocalized(nosotrosContent.mision_kicker, nosotrosContent.mision_kicker_en, locale);
  const misionTitle = resolveLocalized(nosotrosContent.mision_title, nosotrosContent.mision_title_en, locale);
  const mision = resolveLocalized(nosotrosContent.mision, nosotrosContent.mision_en, locale);
  const misionFooterLeft = resolveLocalized(nosotrosContent.mision_footer_left, nosotrosContent.mision_footer_left_en, locale);
  const misionFooterRight = resolveLocalized(nosotrosContent.mision_footer_right, nosotrosContent.mision_footer_right_en, locale);

  const visionKicker = resolveLocalized(nosotrosContent.vision_kicker, nosotrosContent.vision_kicker_en, locale);
  const visionTitle = resolveLocalized(nosotrosContent.vision_title, nosotrosContent.vision_title_en, locale);
  const vision = resolveLocalized(nosotrosContent.vision, nosotrosContent.vision_en, locale);
  const visionFooterLeft = resolveLocalized(nosotrosContent.vision_footer_left, nosotrosContent.vision_footer_left_en, locale);
  const visionFooterRight = resolveLocalized(nosotrosContent.vision_footer_right, nosotrosContent.vision_footer_right_en, locale);

  const aspectClass = aspectClassMap[nosotrosSettings.image_aspect_ratio] || 'aspect-[16/9]';
  const fitClass = nosotrosSettings.image_fit === 'contain' ? 'object-contain p-4' : 'object-cover';

  const stats = [
    {
      label: resolveLocalized(nosotrosContent.stat1_label, nosotrosContent.stat1_label_en, locale),
      value: nosotrosContent.stat1_value,
    },
    {
      label: resolveLocalized(nosotrosContent.stat2_label, nosotrosContent.stat2_label_en, locale),
      value: nosotrosContent.stat2_value,
    },
    {
      label: resolveLocalized(nosotrosContent.stat3_label, nosotrosContent.stat3_label_en, locale),
      value: nosotrosContent.stat3_value,
    },
    {
      label: resolveLocalized(nosotrosContent.stat4_label, nosotrosContent.stat4_label_en, locale),
      value: nosotrosContent.stat4_value,
    },
  ];
  const statsDisclaimer = resolveLocalized(nosotrosContent.stats_disclaimer, nosotrosContent.stats_disclaimer_en, locale);

  const archivoKicker = resolveLocalized(nosotrosContent.archivo_kicker, nosotrosContent.archivo_kicker_en, locale);
  const archivoTitle = resolveLocalized(nosotrosContent.archivo_title, nosotrosContent.archivo_title_en, locale);
  const archivoDesc = resolveLocalized(nosotrosContent.archivo_desc, nosotrosContent.archivo_desc_en, locale);
  const archivoCtaLabel = resolveLocalized(nosotrosContent.archivo_cta_label, nosotrosContent.archivo_cta_label_en, locale);
  const archivoCtaHref = nosotrosContent.archivo_cta_href || '/galeria';

  const cienciaKicker = resolveLocalized(nosotrosContent.ciencia_kicker, nosotrosContent.ciencia_kicker_en, locale);
  const cienciaTitle = resolveLocalized(nosotrosContent.ciencia_title, nosotrosContent.ciencia_title_en, locale);
  const cienciaDesc = resolveLocalized(nosotrosContent.ciencia_desc, nosotrosContent.ciencia_desc_en, locale);
  const cienciaCtaLabel = resolveLocalized(nosotrosContent.ciencia_cta_label, nosotrosContent.ciencia_cta_label_en, locale);
  const cienciaCtaHref = nosotrosContent.ciencia_cta_href || '/ciencia';

  // CTA final de página configurable
  const ctaKicker = resolveLocalized(nosotrosSettings.cta_kicker, nosotrosSettings.cta_kicker_en, locale);
  const ctaTitle = resolveLocalized(nosotrosSettings.cta_title, nosotrosSettings.cta_title_en, locale);
  const ctaLabel = resolveLocalized(nosotrosSettings.cta_label, nosotrosSettings.cta_label_en, locale);
  const ctaHref = nosotrosSettings.cta_href || '/catalogo';
  const nucleoAppUrl = getNucleoAppUrl();

  const nosotrosJsonLd = mergeJsonLd([
    articleJsonLd({
      headline: heroTitle || 'Renacer de las Cenizas en Chiloé',
      description:
        heroDesc || 'Desde el año 2003, un camino de aprendizajes, cambios y experiencia.',
      url: `${SITE_URL}/nosotros`,
      datePublished: '2025-07-02',
    }),
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: heroKicker || 'Nuestra Historia', href: '/nosotros' },
    ]),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={nosotrosJsonLd} />
      <main
        data-cms-section="nosotros"
        className="mx-auto max-w-6xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 lg:py-24"
      >
        {/* Hero */}
        <div data-cms-section="nosotros_settings" className="text-center mb-16 md:mb-20">
          {heroKicker ? (
            <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
              {heroKicker}
            </span>
          ) : null}
          {heroTitle ? (
            <h1 className="font-display text-[clamp(2rem,6.5vw,4.5rem)] md:text-6xl lg:text-7xl font-light text-foreground mb-6 md:mb-8 text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08]">
              {heroTitle}
            </h1>
          ) : null}
          {heroDesc ? (
            <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto text-pretty whitespace-pre-line leading-relaxed ${alignToClass(nosotrosSettings.text_align)}`}>
              {heroDesc}
            </p>
          ) : null}
          {heroImage ? (
            <div className={`relative ${aspectClass} max-w-4xl mx-auto mt-8 rounded-[var(--tienda-radius,0.5rem)] overflow-hidden border border-border/30`}>
              <Image
                src={heroImage}
                alt={heroTitle || 'Nosotros'}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className={fitClass}
                style={{ opacity: (nosotrosSettings.hero_image_opacity ?? 100) / 100 }}
              />
            </div>
          ) : null}
        </div>

        {/* Capítulo I: El Giro Vital (De la Pesca al Bosque Lluvioso) */}
        <section className="mb-20 rounded-3xl border border-border/40 bg-surface-raised/20 p-6 sm:p-10 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto text-left">
            {giroKicker ? (
              <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
                {giroKicker}
              </span>
            ) : null}
            {giroTitle ? (
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-6 leading-tight text-balance">
                {giroTitle}
              </h2>
            ) : null}
            <div className="space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
              {giroP1 ? <p>{giroP1}</p> : null}
              {giroP2 ? <p>{giroP2}</p> : null}
              {giroP3 ? <p>{giroP3}</p> : null}
            </div>

            {historia ? (
              <div className="mt-8 pt-6 border-t border-border/40 text-sm sm:text-base text-foreground/90 italic font-light leading-relaxed whitespace-pre-line">
                «{historia}»
              </div>
            ) : null}
          </div>
        </section>

        {/* Capítulo II: Crónica Territorial en 5 Movimientos */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-12">
            {cronicaKicker ? (
              <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
                {cronicaKicker}
              </span>
            ) : null}
            {cronicaTitle ? (
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
                {cronicaTitle}
              </h2>
            ) : null}
          </div>

          <div className="relative border-l border-border/60 pl-6 sm:pl-10 ml-4 sm:ml-8 space-y-12">
            {movimientos.map((mov, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-accent bg-background group-hover:bg-accent transition-colors" />
                <div className="text-xs uppercase tracking-[0.25em] text-accent-text font-semibold mb-1">
                  {mov.year}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-light text-foreground mb-2">
                  {mov.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty whitespace-pre-line">
                  {mov.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Capítulo III: Díptico de Convicción Apícola (El Estándar de Origen & El Resguardo del Territorio) */}
        <section className="mb-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            {principiosKicker ? (
              <span className="block text-[0.65rem] uppercase tracking-[0.35em] text-accent-text mb-3">
                {principiosKicker}
              </span>
            ) : null}
            {principiosTitle ? (
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
                {principiosTitle}
              </h2>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Tarjeta 1: El Estándar de Origen */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 sm:p-10 flex flex-col justify-between hover:border-accent/50 transition-colors">
              <div>
                {misionKicker ? (
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-3">
                    {misionKicker}
                  </span>
                ) : null}
                {misionTitle ? (
                  <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                    {misionTitle}
                  </h3>
                ) : null}
                {mision ? (
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line text-pretty">
                    {mision}
                  </p>
                ) : null}
              </div>
              {misionFooterLeft || misionFooterRight ? (
                <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{misionFooterLeft}</span>
                  {misionFooterRight ? (
                    <span className="text-accent-text font-mono">{misionFooterRight}</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Tarjeta 2: El Resguardo del Territorio */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 sm:p-10 flex flex-col justify-between hover:border-accent/50 transition-colors">
              <div>
                {visionKicker ? (
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-3">
                    {visionKicker}
                  </span>
                ) : null}
                {visionTitle ? (
                  <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                    {visionTitle}
                  </h3>
                ) : null}
                {vision ? (
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line text-pretty">
                    {vision}
                  </p>
                ) : null}
              </div>
              {visionFooterLeft || visionFooterRight ? (
                <div className="mt-8 pt-6 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
                  <span>{visionFooterLeft}</span>
                  {visionFooterRight ? (
                    <span className="text-accent-text font-mono">{visionFooterRight}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Capítulo IV: Cifras de Territorio (Stats) */}
        <section className="border-t border-border/50 pt-16 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div key={`${s.label}-${idx}`} className="text-center">
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl text-accent-text mb-2 font-light tracking-tight">
                  {s.value}
                </div>
                <div className="text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          {statsDisclaimer ? (
            <p className="mt-8 text-xs text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
              {statsDisclaimer}
            </p>
          ) : null}
        </section>

        {/* ── Archivo Territorial & Memoria Viva ── */}
        <section className="border-t border-border pt-20 mb-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            {archivoKicker ? (
              <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-3">
                {archivoKicker}
              </span>
            ) : null}
            {archivoTitle ? (
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
                {archivoTitle}
              </h2>
            ) : null}
            {archivoDesc ? (
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
                {archivoDesc}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {archiveImages.map((img, idx) => (
              <Link
                key={img.id || idx}
                href="/galeria"
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-card border border-border/40 hover:border-accent/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/40"
              >
                <Image
                  src={img.url}
                  alt={img.titulo || 'Registro de Pureo'}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <h3 className="font-display text-base sm:text-lg text-foreground font-light mb-0.5 group-hover:text-accent transition-colors">
                    {img.titulo}
                  </h3>
                  {img.descripcion ? (
                    <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                      {img.descripcion}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          {archivoCtaLabel ? (
            <div className="flex justify-center">
              <Link
                href={archivoCtaHref}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-text transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                <span>{archivoCtaLabel}</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          ) : null}
        </section>

        {/* Capítulo VI: Evidencia Científica & Protocolo */}
        <section className="border-t border-border/50 pt-16 mb-16">
          <div className="rounded-3xl border border-border/40 bg-surface-raised/40 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              {cienciaKicker ? (
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text block mb-2">
                  {cienciaKicker}
                </span>
              ) : null}
              {cienciaTitle ? (
                <h3 className="font-display text-2xl font-light text-foreground mb-2">
                  {cienciaTitle}
                </h3>
              ) : null}
              {cienciaDesc ? (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {cienciaDesc}
                </p>
              ) : null}
            </div>
            {cienciaCtaLabel ? (
              <Link
                href={cienciaCtaHref}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent bg-accent/10 px-7 text-xs font-semibold uppercase tracking-wider text-accent-text hover:bg-accent hover:text-accent-foreground transition-all shrink-0 cursor-pointer"
              >
                <span>{cienciaCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
          </div>
        </section>

{/* CTA Cierre de Página — configurable desde el CMS para redirigir donde se desee */}
{ctaLabel ? (
  <section className="border-t border-border pt-16 mt-16 text-center">
    {ctaKicker ? (
      <span className="block text-[0.65rem] uppercase tracking-[0.3em] text-accent-text mb-3">
        {ctaKicker}
      </span>
    ) : null}
    {ctaTitle ? (
      <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-6 text-balance">
        {ctaTitle}
      </h2>
    ) : null}
    <div className="flex justify-center">
      <Link
        href={ctaHref}
        className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-text transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        <span>{ctaLabel}</span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  </section>
) : null}

{/* Atajo de administración directo a Editor Tienda en Núcleo */}
{isStaff && nucleoAppUrl ? (
  <div className="mt-12 flex justify-center">
    <a
      href={`${nucleoAppUrl}/editor-tienda?section=nosotros`}
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface-raised px-4 py-2 text-xs font-mono text-muted-foreground transition hover:border-accent hover:text-accent-text"
      title="Editar esta sección directamente en Núcleo"
    >
      <Edit3 size={13} />
      <span>Editar página en Editor Tienda (Núcleo)</span>
    </a>
  </div>
) : null}
</main>
<ShopFooter /></StoreShell>
);
}
