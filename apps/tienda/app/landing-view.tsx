'use client';

import React, { useEffect, useMemo, useRef, Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowRight,
  Home,
  Waves,
  UtensilsCrossed,
  Coffee,
  Hotel,
  ShoppingBag,
  Users,
  Compass,
} from 'lucide-react';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { YoutubeLite } from '@/components/shop/youtube-lite';
import { IdentidadOyzSection } from '@/components/shop/identidad-oyz-section';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import {
  type ConservationContent,
  type HomeMediaItem,
  type MapSettings,
  type ProductsSettings,
  type VideoSettings,
  type CollectionsSettings,
  type IdentidadSettings,
  type MediaSettings,
  type ClubLegadoSettings,
  type ExperienciasHomeSettings,
  type AlianzasHomeSettings,
  DEFAULT_CONSERVATION_CONTENT,
  DEFAULT_MAP_SETTINGS,
  DEFAULT_PRODUCTS_SETTINGS,
  DEFAULT_COLLECTIONS_SETTINGS,
  DEFAULT_CLUB_LEGADO_SETTINGS,
  DEFAULT_EXPERIENCIAS_HOME_SETTINGS,
  DEFAULT_ALIANZAS_HOME_SETTINGS,
  resolveLocalized,
  alignToClass,
} from '@/lib/shop/store-chrome';
import type { ShopProduct } from '@/lib/shop/products';
import type { ProductRatingAggregate } from '@/lib/shop/catalog-ratings';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { ViewLoading, useLegacyDevice } from '@enjambre/ui';

const BeeCanvas = dynamic(
  () => import('@/components/shop/bee-canvas').then((m) => m.BeeCanvas),
  { ssr: false },
);
const HeroHuecoGL = dynamic(
  () => import('@/components/shop/hero-hueco-gl').then((m) => m.HeroHuecoGL),
  { ssr: false },
);
const CustomCursor = dynamic(
  () => import('@/components/shop/custom-cursor').then((m) => m.CustomCursor),
  { ssr: false },
);

const ClubLegadoSection = dynamic(
  () => import('@/components/shop/club-legado-section').then((m) => m.ClubLegadoSection),
  { loading: () => <div className="editorial-section bg-surface-sunken" /> },
);
const MapaIdentidadHero = dynamic(
  () => import('@/components/shop/mapa-identidad-hero').then((m) => m.MapaIdentidadHero),
  {
    ssr: false,
    loading: () => (
      <div className="editorial-section">
        <div className="editorial-container">
          <div className="h-[min(46vh,400px)] sm:h-[460px] bg-surface-sunken rounded-lg" />
        </div>
      </div>
    ),
  },
);
const MediaCarousel = dynamic(
  () => import('@/components/shop/media-carousel').then((m) => m.MediaCarousel),
  { loading: () => <div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" /> },
);
const LandingProducts = dynamic(
  () => import('@/components/shop/landing-products').then((m) => m.LandingProducts),
  {
    loading: () => (
      <div className="editorial-section" aria-busy="true" aria-label="Creaciones">
        <div className="editorial-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    ),
  },
);

interface GSAPInstance {
  gsap: typeof import('gsap')['gsap'];
  ScrollTrigger: typeof import('gsap/ScrollTrigger')['ScrollTrigger'];
}

interface ColeccionItem {
  kicker: string;
  title: string;
  desc: string;
  href: string;
  /** URL de imagen subida desde el editor CMS de Núcleo. Opcional: si no existe usa el fallback hardcodeado. */
  image?: string;
}

interface TiendaLandingProps {
  initialColecciones: ColeccionItem[];
  products: ShopProduct[];
  /** Agregados de reseñas por producto (estrellas en cards del home). */
  ratings?: Record<string, ProductRatingAggregate>;
  mediaItems: HomeMediaItem[];
  mediaSettings?: MediaSettings;
  /** ID de YouTube resuelto: video_settings → env → default. */
  videoId: string;
  videoTitle: string;
  /** Copy del bloque Impacto/Conservación (CMS; vacío = i18n messages). */
  conservationContent: ConservationContent;
  mapSettings: MapSettings;
  productsSettings: ProductsSettings;
  collectionsSettings?: CollectionsSettings;
  identidadSettings?: IdentidadSettings;
  clubLegadoSettings?: ClubLegadoSettings;
  experienciasHomeSettings?: ExperienciasHomeSettings;
  alianzasHomeSettings?: AlianzasHomeSettings;
  ecosystemMetrics: EcosystemMetrics;
  /** Base URL de Núcleo para mapa territorial público. */
  nucleoMapUrl?: string | null;
  locale: string;
}

const COLLECTION_IMAGES = {
  sachet: '/assets/editorial/sachets.png',
  inmersion: '/assets/editorial/immersion.png',
  frasco: '/assets/editorial/honey-jar.png',
} as const;

function extractYoutubeId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

function getCollectionImage(kicker: string): string {
  const lower = kicker.toLowerCase();
  if (lower.includes('sachet')) return COLLECTION_IMAGES.sachet;
  if (
    lower.includes('inmers') ||
    lower.includes('taller') ||
    lower.includes('experiencia') ||
    lower.includes('cofre') ||
    lower.includes('caja')
  ) {
    return COLLECTION_IMAGES.inmersion;
  }
  return COLLECTION_IMAGES.frasco;
}

/** CMS (http o /assets) primero; si no, foto por tipo de colección — no reciclar sachets. */
function resolveCollectionImage(c: ColeccionItem): string {
  if (c.image && (c.image.startsWith('http') || c.image.startsWith('/'))) return c.image;
  return getCollectionImage(c.kicker);
}

export function TiendaLandingView({
  initialColecciones,
  products,
  ratings,
  mediaItems,
  mediaSettings,
  videoId,
  videoTitle,
  conservationContent,
  mapSettings,
  productsSettings,
  collectionsSettings = DEFAULT_COLLECTIONS_SETTINGS,
  identidadSettings,
  clubLegadoSettings = DEFAULT_CLUB_LEGADO_SETTINGS,
  experienciasHomeSettings = DEFAULT_EXPERIENCIAS_HOME_SETTINGS,
  alianzasHomeSettings = DEFAULT_ALIANZAS_HOME_SETTINGS,
  ecosystemMetrics,
  nucleoMapUrl,
  locale,
}: TiendaLandingProps) {
  const t = useTranslations();
  const tHero = useTranslations('hero');
  const tConservation = useTranslations('conservation');
  const tCollections = useTranslations('collections');
  const tCreations = useTranslations('creationsSection');
  const tCommon = useTranslations('common');
  const tScience = useTranslations('science');
  const currentLocale = useLocale();
  const { landing } = useStoreChrome();
  // CMS vacío (o sección sin inicializar) → defaults con el copy actual
  const conservation = conservationContent ?? DEFAULT_CONSERVATION_CONTENT;
  const map = mapSettings ?? DEFAULT_MAP_SETTINGS;
  const productsHeader = {
    kicker: resolveLocalized(productsSettings?.kicker, productsSettings?.kicker_en, currentLocale),
    title: resolveLocalized(productsSettings?.title, productsSettings?.title_en, currentLocale),
    desc: resolveLocalized(productsSettings?.desc, productsSettings?.desc_en, currentLocale),
    align: productsSettings?.text_align,
  };
  // Destacados (featured_ids del CMS) primero; el resto mantiene su orden.
  const orderedProducts = useMemo(() => {
    const featured = productsSettings?.featured_ids ?? [];
    if (featured.length === 0) return products;
    const rank = new Map(featured.map((id, i) => [id, i]));
    return [...products].sort((a, b) => {
      const ra = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }, [products, productsSettings?.featured_ids]);
  const orderedSections = [...landing.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  
  const gsapRef = useRef<GSAPInstance | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { legacy, motionReduced } = useLegacyDevice();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const localeTag = currentLocale === 'es' ? 'es-CL' : 'en-US';
    const paintCounters = () => {
      document.querySelectorAll<HTMLElement>('.counter-value').forEach((el) => {
        const target = parseInt(el.dataset.target || '0', 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        el.textContent = prefix + target.toLocaleString(localeTag) + suffix;
      });
    };
    const revealHero = () => {
      document
        .querySelectorAll<HTMLElement>(
          '.hero-eyebrow, .hero-title .line-inner, .hero-subtitle, .hero-formula',
        )
        .forEach((el) => {
          el.style.opacity = '';
          el.style.transform = '';
        });
    };

    // Los números viven en el HTML. Si GSAP no corre (móvil, reduced-motion,
    // hidratación #418, import fallido) no pueden quedarse en "0".
    paintCounters();

    if (isMobile || motionReduced) {
      revealHero();
      return;
    }
    let ctx: ReturnType<typeof import('gsap')['gsap']['context']> | undefined;
    let cancelled = false;
    const safety = window.setTimeout(revealHero, 2800);

    import('gsap').then((gsapMod) => {
      import('gsap/ScrollTrigger').then((scrollTriggerMod) => {
        if (cancelled) return;
        const gsap = gsapMod.gsap;
        const ScrollTrigger = scrollTriggerMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        gsapRef.current = { gsap, ScrollTrigger };

        ctx = gsap.context(() => {
          const tl = gsap.timeline({ onComplete: revealHero });

          // Solo las líneas del H1: kicker/subtítulo/fórmula quedan siempre
          // visibles. Animar opacity en el kicker lo dejaba invisible si GSAP
          // se cortaba (hero "sin mostrar" con título sí visible).
          tl.fromTo(
            '.hero-title .line-inner',
            { y: '100%' },
            { y: '0%', duration: 1.4, stagger: 0.15, ease: 'power4.out', delay: 0.15, clearProps: 'transform' },
          );

          setTimeout(() => {
            const sections = ['#collections', '#media-carousel', '#creaciones', '#central-video', '#club-legado', '#world-location'];
            sections.forEach((section) => {
              gsap.from(section, {
                scrollTrigger: {
                  trigger: section,
                  start: 'top 85%',
                  once: true,
                },
                y: 60,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                immediateRender: false,
                clearProps: 'transform,opacity',
              });
            });

            ScrollTrigger.refresh();
          }, 2000);
        });

        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 1500);
      });
    }).catch(() => {
      revealHero();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      ctx?.revert();
      revealHero();
    };
  }, [currentLocale, isMobile, motionReduced]);

  return (
    <StoreShell>
    {landing.show_grain && !legacy ? <GrainOverlay /> : null}
    {!isMobile && !legacy && !motionReduced && landing.show_custom_cursor ? <CustomCursor /> : null}
    <ShopHeader />

    <main className="relative overflow-hidden">
      {orderedSections.map((sec) => {
        if (sec.id === 'hero') {
          const heroEyebrow =
            resolveLocalized(landing.hero_eyebrow, landing.hero_eyebrow_en, currentLocale) ||
            tHero('subtitle') ||
            'Miel Virgen del Sur del Mundo';
          const heroTitle1 =
            resolveLocalized(landing.hero_title_line1, landing.hero_title_line1_en, currentLocale) ||
            tHero('titlePart1') ||
            'La Obrera';
          const heroTitle2 =
            resolveLocalized(landing.hero_title_line2, landing.hero_title_line2_en, currentLocale) ||
            tHero('titlePart2') ||
            'y el Zángano';
          const heroSubtitle =
            resolveLocalized(landing.hero_subtitle, landing.hero_subtitle_en, currentLocale) ||
            tHero('description') ||
            'Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje';
          const heroFormula =
            resolveLocalized(landing.hero_formula, landing.hero_formula_en, currentLocale) ||
            tHero('formula') ||
            'Luz solar → Néctar → Miel virgen · Sin atajos industriales';

          return (
          <section
            key="hero"
            data-cms-section="hero"
            className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] min-h-[var(--svh-full)] md:min-h-[var(--vh-full)] overflow-hidden"
          >
            <div className="hero-atmosphere absolute inset-0 z-0 overflow-hidden" aria-hidden style={{ contain: 'strict' }}>
              {!legacy && (!landing.hero_variant || landing.hero_variant === 'hueco') ? (
                <HeroHuecoGL live={!motionReduced} />
              ) : null}
              {landing.hero_variant === 'video' && extractYoutubeId(landing.hero_video_url) ? (
                <>
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-background">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(landing.hero_video_url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${extractYoutubeId(landing.hero_video_url)}&playsinline=1&rel=0&modestbranding=1`}
                      allow="autoplay; encrypted-media"
                      className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] min-w-[177vh] min-h-[56vw] -translate-x-1/2 -translate-y-1/2 object-cover opacity-50"
                      style={{ border: 0 }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-background/30 mix-blend-overlay pointer-events-none z-10" />
                </>
              ) : null}
            </div>
            {!legacy && (!landing.hero_variant || landing.hero_variant === 'hueco') ? (
              <BeeCanvas live={!motionReduced} bees={!motionReduced} />
            ) : null}

          {/* z-20 above scroll cue; pb reserved so absolute cue never crosses copy */}
          <div className="relative z-20 mx-auto w-full max-w-4xl px-1">
            {heroEyebrow ? (
              <span className="hero-eyebrow editorial-kicker mb-5 md:mb-7 block">
                {heroEyebrow}
              </span>
            ) : null}
            <h1 className="hero-title font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[1.05] mb-6 md:mb-8 overflow-hidden text-balance">
              <span className="block overflow-hidden">
                <span className="line-inner block">{heroTitle1}</span>
              </span>
              <span className="block overflow-hidden">
                <span className="line-inner block">{heroTitle2}</span>
              </span>
            </h1>
            {heroSubtitle ? (
              <p className="hero-subtitle text-[clamp(1.05rem,2.2vw,1.4rem)] text-muted-foreground tracking-wide max-w-2xl mx-auto text-pretty leading-relaxed">
                {heroSubtitle}
              </p>
            ) : null}
            {heroFormula ? (
              <p className="hero-formula mt-5 md:mt-7 font-mono text-[clamp(0.6rem,1.1vw,0.75rem)] tracking-[0.12em] sm:tracking-[0.22em] md:tracking-[0.28em] uppercase text-accent-text max-w-xl mx-auto leading-relaxed">
                {heroFormula}
              </p>
            ) : null}
            {landing.show_hero_cta ? (
              <div className="mt-9 md:mt-11">
                <Link
                  href={landing.hero_cta_href || '/catalogo'}
                  className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-all duration-300 active:scale-[0.97] shadow-[0_0_24px_rgba(201,162,39,0.08)]"
                >
                  {resolveLocalized(
                    landing.hero_cta_label,
                    landing.hero_cta_label_en,
                    currentLocale,
                  )}
                </Link>
              </div>
            ) : null}
          </div>

          {/* Scroll Cue Orgánico */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-20 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.24em] text-accent-text font-mono">
              {currentLocale === 'en' ? 'Scroll to explore' : 'Desliza para explorar'}
            </span>
            <div className="w-[1px] h-5 sm:h-6 bg-gradient-to-b from-accent/80 via-accent/30 to-transparent animate-pulse" />
          </div>
        </section>
          );
        }

        if (sec.id === 'identidad') {
          return (
            <div key="identidad" data-cms-section="identidad">
              <IdentidadOyzSection settings={identidadSettings} />
            </div>
          );
        }

        if (sec.id === 'conservation') {
          const trees = ecosystemMetrics.arboles_total;
          const irr = ecosystemMetrics.irr_ecosistema;
          const co2Tons = ecosystemMetrics.co2_ton > 0
            ? Math.round(ecosystemMetrics.co2_ton)
            : Math.round(trees * 0.05);

          const conservationTitle = resolveLocalized(conservation.title, conservation.title_en, currentLocale);
          const conservationStat1 = resolveLocalized(conservation.stat1_label, conservation.stat1_label_en, currentLocale);
          const conservationBoxText = resolveLocalized(conservation.box_text, conservation.box_text_en, currentLocale);
          const conservationCta1Label = resolveLocalized(conservation.box_cta1_label, conservation.box_cta1_label_en, currentLocale);
          const conservationCta2Label =
            resolveLocalized(conservation.box_cta2_label, conservation.box_cta2_label_en, currentLocale) ||
            resolveLocalized(conservation.cta_label, conservation.cta_label_en, currentLocale);

          return (
            <section key="conservation" data-cms-section="conservation" className="editorial-section border-y border-border/30">
              <div className="editorial-container max-w-4xl text-center mx-auto px-4">
                {conservationTitle ? (
                  <h2 className="font-display text-[clamp(1.5rem,4vw,2.25rem)] font-light text-foreground mb-3 text-balance">
                    {conservationTitle}
                  </h2>
                ) : null}
                {conservationStat1 ? (
                  <p className={`text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed text-pretty whitespace-pre-line ${alignToClass(conservation.text_align)}`}>
                    {conservationStat1}
                  </p>
                ) : null}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 my-8 text-center border-y border-border/20 py-8">
                  <div>
                    <p className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-accent-text tabular-nums leading-none mb-2">
                      {trees.toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US')}+
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {tConservation('treesPlanted') || 'Árboles plantados'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ecosystemMetrics.sectores > 0
                        ? `${ecosystemMetrics.sectores} sectores censados`
                        : 'Predios en Chiloé'}
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-accent-text tabular-nums leading-none mb-2">
                      ~{co2Tons.toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US')} ton
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {tConservation('co2Captured') || 'CO₂ capturado'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {irr && irr > 1 ? `IRR ${irr}× regenerativo` : 'Biomasa leñosa viva'}
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-accent-text tabular-nums leading-none mb-2">
                      {ecosystemMetrics.especies_nativas > 0 ? `${ecosystemMetrics.especies_nativas}+` : '18+'}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {tConservation('nativeSpecies') || 'Especies nativas'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {currentLocale === 'en' ? 'Valdivian rainforest' : 'Bosque templado lluvioso'}
                    </p>
                  </div>

                  <div>
                    <p className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-accent-text tabular-nums leading-none mb-2">
                      {ecosystemMetrics.anos_legado || '2004–2026'}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {currentLocale === 'en' ? 'Years of regeneration' : 'Años de regeneración'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {ecosystemMetrics.colmenas_total > 0
                        ? `${ecosystemMetrics.colmenas_total} colmenas activas`
                        : 'Patrimonio forestal'}
                    </p>
                  </div>
                </div>

                {(conservationBoxText || conservationCta1Label || conservationCta2Label) ? (
                  <div className="my-8 rounded-2xl border border-border/40 bg-surface-sunken p-6 text-center max-w-2xl mx-auto space-y-3">
                    {conservationBoxText ? (
                      <p className={`text-xs sm:text-sm text-foreground/80 leading-relaxed text-pretty whitespace-pre-line ${alignToClass(conservation.text_align)}`}>
                        {conservationBoxText}
                      </p>
                    ) : null}
                    {(conservationCta1Label || conservationCta2Label) ? (
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {conservationCta1Label ? (
                          <Link
                            href={conservation.box_cta1_href?.trim() || '/club-legado-del-bosque'}
                            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold tracking-wide text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            {conservationCta1Label}
                          </Link>
                        ) : null}
                        {conservationCta2Label ? (
                          <Link
                            href={conservation.box_cta2_href?.trim() || '/ciencia'}
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/60 bg-card px-5 py-2 text-xs font-medium text-foreground hover:border-accent/60 hover:text-accent transition-colors"
                          >
                            {conservationCta2Label}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          );
        }

        if (sec.id === 'collections') {
          const colKicker = resolveLocalized(collectionsSettings.kicker, collectionsSettings.kicker_en, currentLocale);
          const colTitle = resolveLocalized(collectionsSettings.title, collectionsSettings.title_en, currentLocale);
          const colSubtitle = resolveLocalized(
            collectionsSettings.subtitle,
            collectionsSettings.subtitle_en,
            currentLocale,
          );
          const aspectClassMap: Record<string, string> = {
            '16/10': 'aspect-[16/10]',
            '4/3': 'aspect-[4/3]',
            '1/1': 'aspect-square',
            '3/4': 'aspect-[3/4]',
            'auto': 'aspect-auto',
          };
          const fitClassMap: Record<string, string> = {
            cover: 'object-cover',
            contain: 'object-contain p-2',
          };
          const gridClassMap: Record<number, string> = {
            2: 'lg:grid-cols-2',
            3: 'lg:grid-cols-3',
            4: 'lg:grid-cols-4',
          };
          const aspectClass = aspectClassMap[collectionsSettings.image_aspect_ratio] || 'aspect-[4/3]';
          const fitClass = fitClassMap[collectionsSettings.image_fit] || 'object-cover';
          const gridClass = gridClassMap[collectionsSettings.grid_columns] || 'lg:grid-cols-3';

          return (
        <section key="collections" id="collections" data-cms-section="collections" className="editorial-section">
          {(colKicker || colTitle || colSubtitle) ? (
            <div className="editorial-container text-center mb-10 md:mb-20 px-4 sm:px-0 max-w-3xl mx-auto">
              {colKicker ? <span className="editorial-kicker mb-3 sm:mb-4 block">{colKicker}</span> : null}
              {colTitle ? (
                <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground mb-3 sm:mb-4 text-balance leading-tight">
                  {colTitle}
                </h2>
              ) : null}
              {colSubtitle ? (
                <p className={`text-muted-foreground italic font-display text-sm sm:text-lg max-w-xl mx-auto leading-relaxed text-pretty whitespace-pre-line ${alignToClass(collectionsSettings.text_align)}`}>
                  {colSubtitle}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="editorial-container px-4 sm:px-0">
            <div className={`flex sm:grid overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none gap-4 sm:gap-x-8 sm:gap-y-16 pb-4 sm:pb-0 scrollbar-none sm:grid-cols-2 ${gridClass} -mx-4 px-4 sm:mx-0 sm:px-0`}>
              {initialColecciones.map((c, index) => {
                const imageSrc = resolveCollectionImage(c);
                const rawHref = c.href?.trim();
                const href =
                  rawHref && rawHref !== '/catalogo' && rawHref !== ''
                    ? rawHref
                    : c.kicker || c.title
                      ? `/catalogo?q=${encodeURIComponent((c.kicker || c.title).split(/\s+/)[0] ?? '')}`
                      : '/catalogo';
                return (
                  <Link
                    key={c.title}
                    href={href}
                    prefetch={false}
                    className="group flex min-h-11 flex-col rounded-[var(--tienda-radius,0.5rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shrink-0 w-[78vw] max-w-[320px] sm:w-auto sm:max-w-none snap-center active:scale-[0.99] transition-transform"
                  >
                    <div className={`relative ${aspectClass} overflow-hidden bg-surface-raised mb-3 sm:mb-6 rounded-[var(--tienda-radius,0.5rem)]`}>
                      {aspectClass === 'aspect-auto' ? (
                        <img
                          src={imageSrc}
                          alt={c.title}
                          className={`${fitClass.includes('p-2') ? 'p-2 ' : ''}w-full h-auto sm:grayscale-[30%] sm:group-hover:grayscale-0 sm:group-hover:scale-105 transition-all duration-elegant`}
                          loading={index < 3 ? 'eager' : 'lazy'}
                        />
                      ) : (
                        <Image
                          src={imageSrc}
                          alt={c.title}
                          fill
                          priority={index < 3}
                          sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                          className={`${fitClass} sm:grayscale-[30%] sm:group-hover:grayscale-0 sm:group-hover:scale-105 transition-all duration-elegant`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-base" />
                    </div>
                    <div className="text-center px-1">
                      <p className="editorial-kicker mb-1.5 sm:mb-2">{c.kicker}</p>
                      <h3 className="font-display text-lg sm:text-2xl md:text-3xl font-light mb-1.5 sm:mb-2 sm:group-hover:text-accent transition-colors duration-base text-balance">
                        {c.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-pretty line-clamp-3 sm:line-clamp-none whitespace-pre-line">
                        {c.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Indicador táctil de deslizamiento móvil */}
            <div className="flex sm:hidden justify-center items-center gap-1.5 mt-4" aria-hidden="true">
              {initialColecciones.map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-border"
                />
              ))}
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'media') {
          return (
      <section key="media" id="media-carousel" data-cms-section="media">
        <Suspense fallback={<div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" />}><MediaCarousel items={mediaItems} settings={mediaSettings} /></Suspense>
      </section>
          );
        }

        if (sec.id === 'products') {
          return (
      <div key="products" id="creaciones" data-cms-section="products">
        <Suspense
          fallback={
            <div className="editorial-section" aria-busy="true" aria-label={tCommon('loadingCreations') || 'Creaciones'}>
              <div className="editorial-container">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <LandingProducts
            products={orderedProducts}
            pageSize={8}
            ratings={ratings}
            header={productsHeader}
            imageAspectRatio={productsSettings?.image_aspect_ratio}
            imageFit={productsSettings?.image_fit}
          />
        </Suspense>
      </div>
          );
        }

        if (sec.id === 'video') {
          return (
        <section key="video" id="central-video" data-cms-section="video" className="editorial-section">
          <div className="editorial-container">
            <div className="relative w-full aspect-video max-w-5xl mx-auto rounded-lg overflow-hidden border border-border/30 bg-surface-sunken">
              <YoutubeLite videoId={videoId} title={videoTitle} />
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'club_legado') {
          return (
            <div key="club_legado" id="club-legado" data-cms-section="club_legado">
              <Suspense fallback={<div className="editorial-section bg-surface-sunken" />}>
                <ClubLegadoSection settings={clubLegadoSettings} />
              </Suspense>
            </div>
          );
        }

        if (sec.id === 'map') {
          if (legacy) {
            // Dispositivos legacy: el iframe del mapa público es caro (Leaflet);
            // tarjeta estática con datos del CMS y acceso a Google Maps.
            const { lat, lng, popup_title, popup_body } = map;
            return (
              <section key="map" id="world-location" data-cms-section="map" className="editorial-section">
                <div className="editorial-container max-w-2xl mx-auto text-center">
                  <span className="editorial-kicker mb-4 block">
                    {tCommon('ourLocation') || 'Ubicación'}
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground mb-4">
                    {popup_title || tCommon('ourLocation') || 'Dónde estamos'}
                  </h2>
                  {popup_body ? (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">{popup_body}</p>
                  ) : null}
                  {lat && lng ? (
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Ver en Google Maps
                    </a>
                  ) : null}
                </div>
              </section>
            );
          }
          return (
            <div key="map" id="world-location" data-cms-section="map">
              <Suspense fallback={<div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label={tCommon('loadingMap') || 'Mapa'} hideLabel /></div></div>}>
                <MapaIdentidadHero mapSettings={map} />
              </Suspense>
            </div>
          );
        }

        if (sec.id === 'experiencias') {
          const exp = experienciasHomeSettings ?? DEFAULT_EXPERIENCIAS_HOME_SETTINGS;
          const kicker = resolveLocalized(exp.kicker, exp.kicker_en, currentLocale);
          const title = resolveLocalized(exp.title, exp.title_en, currentLocale);
          const subtitle = resolveLocalized(exp.subtitle, exp.subtitle_en, currentLocale);
          const card1Tag = resolveLocalized(exp.card1_tag, exp.card1_tag_en, currentLocale);
          const card1Title = resolveLocalized(exp.card1_title, exp.card1_title_en, currentLocale);
          const card1Desc = resolveLocalized(exp.card1_desc, exp.card1_desc_en, currentLocale);
          const card1Cta = resolveLocalized(exp.card1_cta, exp.card1_cta_en, currentLocale);
          const card1Href = exp.card1_href || '/experiencias/territorio';

          const card2Tag = resolveLocalized(exp.card2_tag, exp.card2_tag_en, currentLocale);
          const card2Title = resolveLocalized(exp.card2_title, exp.card2_title_en, currentLocale);
          const card2Desc = resolveLocalized(exp.card2_desc, exp.card2_desc_en, currentLocale);
          const card2Cta = resolveLocalized(exp.card2_cta, exp.card2_cta_en, currentLocale);
          const card2Href = exp.card2_href || '/experiencias/degustaciones';

          const card3Tag = resolveLocalized(exp.card3_tag, exp.card3_tag_en, currentLocale);
          const card3Title = resolveLocalized(exp.card3_title, exp.card3_title_en, currentLocale);
          const card3Desc = resolveLocalized(exp.card3_desc, exp.card3_desc_en, currentLocale);
          const card3Cta = resolveLocalized(exp.card3_cta, exp.card3_cta_en, currentLocale);
          const card3Href = exp.card3_href || '/experiencias/talleres';

          return (
            <section
              key="experiencias"
              id="experiencias"
              data-cms-section="experiencias"
              className="editorial-section border-t border-border/30 bg-surface-raised/20"
            >
              <div className="editorial-container">
                {(kicker || title || subtitle) ? (
                  <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 px-4">
                    {kicker ? <span className="editorial-kicker mb-3 block">{kicker}</span> : null}
                    {title ? (
                      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-4 text-balance">
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? (
                      <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed ${alignToClass(exp.text_align)}`}>
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-0">
                  {/* Territorio */}
                  <Link
                    href={card1Href}
                    className="group rounded-2xl border border-border/40 bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                        <Home className="w-5 h-5" />
                      </div>
                      {card1Tag ? (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold">
                          {card1Tag}
                        </span>
                      ) : null}
                      {card1Title ? (
                        <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2 group-hover:text-accent transition-colors">
                          {card1Title}
                        </h3>
                      ) : null}
                      {card1Desc ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card1Desc}
                        </p>
                      ) : null}
                    </div>
                    {card1Cta ? (
                      <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text">
                        <span>{card1Cta}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ) : null}
                  </Link>

                  {/* Degustaciones */}
                  <Link
                    href={card2Href}
                    className="group rounded-2xl border border-border/40 bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      {card2Tag ? (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold">
                          {card2Tag}
                        </span>
                      ) : null}
                      {card2Title ? (
                        <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2 group-hover:text-accent transition-colors">
                          {card2Title}
                        </h3>
                      ) : null}
                      {card2Desc ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card2Desc}
                        </p>
                      ) : null}
                    </div>
                    {card2Cta ? (
                      <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text">
                        <span>{card2Cta}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ) : null}
                  </Link>

                  {/* Talleres */}
                  <Link
                    href={card3Href}
                    className="group sm:col-span-2 lg:col-span-1 rounded-2xl border border-border/40 bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text mb-4">
                        <Compass className="w-5 h-5" />
                      </div>
                      {card3Tag ? (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold">
                          {card3Tag}
                        </span>
                      ) : null}
                      {card3Title ? (
                        <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2 group-hover:text-accent transition-colors">
                          {card3Title}
                        </h3>
                      ) : null}
                      {card3Desc ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card3Desc}
                        </p>
                      ) : null}
                    </div>
                    {card3Cta ? (
                      <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text">
                        <span>{card3Cta}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ) : null}
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        if (sec.id === 'alianzas') {
          const ali = alianzasHomeSettings ?? DEFAULT_ALIANZAS_HOME_SETTINGS;
          const kicker = resolveLocalized(ali.kicker, ali.kicker_en, currentLocale);
          const title = resolveLocalized(ali.title, ali.title_en, currentLocale);
          const subtitle = resolveLocalized(ali.subtitle, ali.subtitle_en, currentLocale);
          const tag1 = resolveLocalized(ali.tag1_label, ali.tag1_label_en, currentLocale);
          const tag1Href = ali.tag1_href || '/alianzas/cafeterias';
          const tag2 = resolveLocalized(ali.tag2_label, ali.tag2_label_en, currentLocale);
          const tag2Href = ali.tag2_href || '/alianzas/hoteles';
          const tag3 = resolveLocalized(ali.tag3_label, ali.tag3_label_en, currentLocale);
          const tag3Href = ali.tag3_href || '/alianzas/tiendas-gourmet';
          const tag4 = resolveLocalized(ali.tag4_label, ali.tag4_label_en, currentLocale);
          const tag4Href = ali.tag4_href || '/alianzas/revendedores';
          const ctaKicker = resolveLocalized(ali.cta_kicker, ali.cta_kicker_en, currentLocale);
          const ctaButton = resolveLocalized(ali.cta_button_label, ali.cta_button_label_en, currentLocale);
          const ctaHref = ali.cta_button_href || '/alianzas';

          return (
            <section
              key="alianzas"
              id="alianzas"
              data-cms-section="alianzas"
              className="editorial-section border-t border-border/30 bg-surface-sunken/40"
            >
              <div className="editorial-container">
                <div className="max-w-4xl mx-auto rounded-3xl border border-border/40 bg-card p-8 sm:p-12">
                  <div className="grid md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-7 space-y-4">
                      {kicker ? <span className="editorial-kicker block">{kicker}</span> : null}
                      {title ? (
                        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground text-balance">
                          {title}
                        </h2>
                      ) : null}
                      {subtitle ? (
                        <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed ${alignToClass(ali.text_align)}`}>
                          {subtitle}
                        </p>
                      ) : null}

                      {(tag1 || tag2 || tag3 || tag4) ? (
                        <div className="pt-2 flex flex-wrap gap-2 text-xs">
                          {tag1 ? (
                            <Link
                              href={tag1Href}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-raised px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                            >
                              <Coffee className="w-3.5 h-3.5 text-accent-text" />
                              <span>{tag1}</span>
                            </Link>
                          ) : null}
                          {tag2 ? (
                            <Link
                              href={tag2Href}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-raised px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                            >
                              <Hotel className="w-3.5 h-3.5 text-accent-text" />
                              <span>{tag2}</span>
                            </Link>
                          ) : null}
                          {tag3 ? (
                            <Link
                              href={tag3Href}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-raised px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-accent-text" />
                              <span>{tag3}</span>
                            </Link>
                          ) : null}
                          {tag4 ? (
                            <Link
                              href={tag4Href}
                              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-raised px-3 py-1.5 text-foreground hover:border-accent transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 text-accent-text" />
                              <span>{tag4}</span>
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {(ctaKicker || ctaButton) ? (
                      <div className="md:col-span-5 flex flex-col justify-center items-start md:items-end border-t md:border-t-0 md:border-l border-border/20 pt-6 md:pt-0 md:pl-8 space-y-4">
                        {ctaKicker ? (
                          <span className="text-xs text-muted-foreground">
                            {ctaKicker}
                          </span>
                        ) : null}
                        {ctaButton ? (
                          <Link
                            href={ctaHref}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity w-full sm:w-auto"
                          >
                            <span>{ctaButton}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
      </main>

      <ShopFooter />
    </StoreShell>
  );
}