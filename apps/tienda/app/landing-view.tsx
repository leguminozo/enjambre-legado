'use client';

import React, { useEffect, useMemo, useRef, Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { TextCarousel } from '@/components/shop/text-carousel';
import { YoutubeLite } from '@/components/shop/youtube-lite';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import {
  type ConservationContent,
  type HomeMediaItem,
  type MapSettings,
  type ProductsSettings,
  type CollectionsSettings,
  type MediaSettings,
  DEFAULT_CONSERVATION_CONTENT,
  DEFAULT_MAP_SETTINGS,
  DEFAULT_PRODUCTS_SETTINGS,
  DEFAULT_COLLECTIONS_SETTINGS,
  resolveLocalized,
} from '@/lib/shop/store-chrome';
import type { ShopProduct } from '@/lib/shop/products';
import type { ProductRatingAggregate } from '@/lib/shop/catalog-ratings';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { ViewLoading, useLegacyDevice } from '@enjambre/ui';

const BeeCanvas = dynamic(
  () => import('@/components/shop/bee-canvas').then((m) => m.BeeCanvas),
  { ssr: false },
);
const CustomCursor = dynamic(
  () => import('@/components/shop/custom-cursor').then((m) => m.CustomCursor),
  { ssr: false },
);

const WorldMapBlock = dynamic(
  () => import('@/components/shop/world-map-block').then((m) => m.WorldMapBlock),
  { ssr: false },
);
const MediaCarousel = dynamic(
  () => import('@/components/shop/media-carousel').then((m) => m.MediaCarousel),
  { loading: () => <div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" /> },
);
const LandingProducts = dynamic(
  () => import('@/components/shop/landing-products').then((m) => m.LandingProducts),
  { loading: () => <div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label="Creaciones" hideLabel /></div></div> },
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
  ecosystemMetrics: EcosystemMetrics;
  locale: string;
}

const COLLECTION_IMAGES: Record<string, string> = {
  sachets: '/assets/editorial/sachets.png',
  cofres: '/assets/editorial/sachets.png',
  cajas: '/assets/editorial/sachets.png',
  default: '/assets/editorial/honey-jar.png',
};

function getCollectionImage(kicker: string): string {
  const lower = kicker.toLowerCase();
  if (lower.includes('sachet') || lower.includes('cofre') || lower.includes('caja')) {
    return COLLECTION_IMAGES.sachets;
  }
  return COLLECTION_IMAGES.default;
}

/** Prioriza la imagen del CMS; cae al hardcodeado si no hay ninguna. */
function resolveCollectionImage(c: ColeccionItem): string {
  if (c.image && c.image.startsWith('http')) return c.image;
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
  ecosystemMetrics,
  locale,
}: TiendaLandingProps) {
  const t = useTranslations();
  const tHero = useTranslations('hero');
  const tConservation = useTranslations('conservation');
  const tCollections = useTranslations('collections');
  const tCommon = useTranslations('common');
  const tScience = useTranslations('science');
  const currentLocale = useLocale();
  const { landing } = useStoreChrome();
  // CMS vacío (o sección sin inicializar) → defaults con el copy actual
  const conservation = conservationContent ?? DEFAULT_CONSERVATION_CONTENT;
  const map = mapSettings ?? DEFAULT_MAP_SETTINGS;
  const productsHeader = {
    kicker:
      resolveLocalized(productsSettings?.kicker, productsSettings?.kicker_en, currentLocale) ||
      'Creaciones',
    title:
      resolveLocalized(productsSettings?.title, productsSettings?.title_en, currentLocale) ||
      'La materia de nuestras búsquedas',
    desc:
      resolveLocalized(productsSettings?.desc, productsSettings?.desc_en, currentLocale) ||
      'Creaciones cargadas de experiencias y legado.',
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
    if (isMobile || motionReduced) {
      // Sin GSAP en móvil / reduced-motion: escribir el valor final para que los contadores de impacto
      // no muestren "0" falso (la animación desktop depende de ScrollTrigger).
      document
        .querySelectorAll<HTMLElement>('.counter-value')
        .forEach((el) => {
          const target = parseInt(el.dataset.target || '0', 10);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          el.textContent =
            prefix +
            target.toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US') +
            suffix;
        });
      return;
    }
    let ctx: ReturnType<typeof import('gsap')['gsap']['context']> | undefined;
    let cancelled = false;

    import('gsap').then((gsapMod) => {
      import('gsap/ScrollTrigger').then((scrollTriggerMod) => {
        if (cancelled) return;
        const gsap = gsapMod.gsap;
        const ScrollTrigger = scrollTriggerMod.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        gsapRef.current = { gsap, ScrollTrigger };

        ctx = gsap.context(() => {
          const tl = gsap.timeline();

          tl.from('.hero-eyebrow', {
            opacity: 0,
            y: 20,
            duration: 1.2,
            ease: 'power3.out',
            delay: 0.2,
          })
          .from('.hero-title .line-inner', {
            y: '100%',
            duration: 1.4,
            stagger: 0.15,
            ease: 'power4.out',
          }, '-=0.8')
          .from('.hero-subtitle', {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: 'power3.out',
          }, '-=0.6')
          .from('.hero-formula', {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power3.out',
          }, '-=0.3');

          setTimeout(() => {
            const sections = ['#collections', '#media-carousel', '#creaciones', '#central-video', '#world-location'];
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
              });
            });

            gsap.utils.toArray<HTMLElement>('.counter-value').forEach((el) => {
              const target = parseInt(el.dataset.target || '0', 10);
              const prefix = el.dataset.prefix || '';
              const suffix = el.dataset.suffix || '';
              const obj = { val: 0 };
              gsap.to(obj, {
                val: target,
                duration: 2,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: el,
                  start: 'top 80%',
                  once: true,
                },
                onUpdate: () => {
                  el.textContent = prefix + Math.round(obj.val).toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US') + suffix;
                },
              });
            });
            
            ScrollTrigger.refresh();
          }, 2000);
        });

        setTimeout(() => {
          ScrollTrigger.refresh();
        }, 1500);
      });
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [currentLocale, isMobile]);

  return (
    <StoreShell>
    {landing.show_grain && !legacy ? <GrainOverlay /> : null}
    {!isMobile && !legacy && !motionReduced && landing.show_custom_cursor ? <CustomCursor /> : null}
    <TextCarousel />
    <ShopHeader />

    <main className="relative overflow-hidden">
      {orderedSections.map((sec) => {
        if (sec.id === 'hero') {
          return (
          // Sintaxis v3 de var(): `min-h-(--vh-full)` (v4) no genera CSS en Tailwind 3.
          // tokens.css define --svh-full/--vh-full con fallback 100vh → svh/dvh vía @supports.
          <section
            key="hero"
            className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] min-h-[var(--svh-full)] md:min-h-[var(--vh-full)]"
          >
            <div className="absolute inset-0 pointer-events-none" aria-hidden />
        {!isMobile && !legacy && !motionReduced && landing.show_bee_canvas ? <BeeCanvas /> : null}
        <div
          className="absolute inset-0 pointer-events-none bg-background/40 md:bg-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 70%)',
            opacity: isMobile ? 0.88 : 0.55,
          }}
        />

          {/* z-20 above scroll cue; pb reserved so absolute cue never crosses copy */}
          <div className="relative z-20 mx-auto w-full max-w-4xl px-1">
            <span className="hero-eyebrow editorial-kicker mb-5 md:mb-7 block">
              {resolveLocalized(landing.hero_eyebrow, landing.hero_eyebrow_en, currentLocale) ||
                tHero('subtitle') ||
                'Miel Virgen del Sur del Mundo'}
            </span>
            <h1 className="hero-title font-display text-[clamp(2.5rem,6vw,5rem)] font-light leading-[1.05] mb-6 md:mb-8 overflow-hidden text-balance">
              <span className="block overflow-hidden">
                <span className="line-inner block">
                  {resolveLocalized(landing.hero_title_line1, landing.hero_title_line1_en, currentLocale) ||
                    tHero('titlePart1') ||
                    'La Obrera'}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="line-inner block">
                  {resolveLocalized(landing.hero_title_line2, landing.hero_title_line2_en, currentLocale) ||
                    tHero('titlePart2') ||
                    'y el Zángano'}
                </span>
              </span>
            </h1>
            <p className="hero-subtitle font-display italic text-[clamp(1.05rem,2.2vw,1.4rem)] text-muted-foreground tracking-wide max-w-2xl mx-auto text-pretty leading-relaxed">
              {resolveLocalized(landing.hero_subtitle, landing.hero_subtitle_en, currentLocale) ||
                tHero('description') ||
                'Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje'}
            </p>
            <p className="hero-formula mt-5 md:mt-7 font-mono text-[clamp(0.6rem,1.1vw,0.75rem)] tracking-[0.12em] sm:tracking-[0.22em] md:tracking-[0.28em] uppercase text-accent-text max-w-xl mx-auto leading-relaxed">
              {resolveLocalized(landing.hero_formula, landing.hero_formula_en, currentLocale) ||
                tHero('formula') ||
                'Luz solar → Néctar → Miel virgen · Sin atajos industriales'}
            </p>
            {landing.show_hero_cta ? (
              <div className="mt-9 md:mt-11">
                <Link
                  href={landing.hero_cta_href || '/catalogo'}
                  className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
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
          {/* Scroll cue: rail centrado en el borde inferior del hero, nunca solapado con copy */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 md:gap-3 bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:bottom-10"
            aria-hidden
          >
            <span className="hidden lg:block text-editorial-xs uppercase tracking-widest text-muted-foreground/80 [writing-mode:vertical-rl]">
              {tCommon('scrollDown') || 'Descender'}
            </span>
            <div className="w-px h-10 md:h-14 bg-gradient-to-b from-accent/80 to-transparent" />
          </div>
        </section>
          );
        }

        if (sec.id === 'conservation') {
          return (
        <section key="conservation" className="editorial-section bg-surface-raised/50 border-y border-border/30">
          <div className="editorial-container">
            <div className="text-center mb-10 md:mb-16">
              <span className="editorial-kicker mb-4 block">
                {resolveLocalized(conservation.kicker, conservation.kicker_en, currentLocale) ||
                  tConservation('kicker') ||
                  'Conservación demostrable'}
              </span>
              <h2 className="font-display text-[clamp(1.75rem,6vw,3rem)] sm:text-4xl md:text-5xl font-light text-foreground mb-4 md:mb-6 text-balance leading-tight">
                {resolveLocalized(conservation.title, conservation.title_en, currentLocale) ||
                  tConservation('title') ||
                  'Impacto sin atajos'}
              </h2>
              <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                {resolveLocalized(conservation.desc, conservation.desc_en, currentLocale) ||
                  tConservation('description') ||
                  'No certificamos con sellos de tercera mano. Nuestro impacto se demuestra por triangulación: papers revisados por pares, datos locales de Chiloé, y cálculos abiertos que cualquier persona puede verificar.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8 text-center mb-12 md:mb-16">
              {[
                { value: ecosystemMetrics.arboles_total, label: resolveLocalized(conservation.stat1_label, conservation.stat1_label_en, currentLocale) || tConservation('treesPlanted') || 'Árboles plantados', suffix: '+' },
                { value: ecosystemMetrics.co2_evitado_total_kg, label: resolveLocalized(conservation.stat2_label, conservation.stat2_label_en, currentLocale) || tConservation('co2Avoided') || 'CO₂ evitado (kg)', suffix: '', prefix: '~' },
                { value: ecosystemMetrics.colmenas_total, label: resolveLocalized(conservation.stat3_label, conservation.stat3_label_en, currentLocale) || tConservation('hivesCustodied') || 'Colmenas custodiadas', suffix: '' },
                { value: ecosystemMetrics.especies_nativas, label: resolveLocalized(conservation.stat4_label, conservation.stat4_label_en, currentLocale) || tConservation('nativeSpecies') || 'Especies nativas', suffix: '' },
              ].map((stat) => (
                <div key={stat.label} className="py-2 sm:py-4 px-1 min-w-0">
                  <p className="counter-value font-display text-[clamp(1.65rem,6vw,3.75rem)] sm:text-5xl md:text-6xl font-light text-accent-text tabular-nums tracking-tight" data-target={stat.value} data-prefix={stat.prefix || ''} data-suffix={stat.suffix}>
                    0
                  </p>
                  <p className="text-editorial-xs uppercase tracking-widest text-muted-foreground mt-2 sm:mt-3 leading-snug text-balance">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto border-t border-border/20 pt-10 mb-12 md:mb-16">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent-text mb-6 text-center">
                {resolveLocalized(conservation.tri_label, conservation.tri_label_en, currentLocale) ||
                  tScience('triangulation') ||
                  'Triangulación de fuentes'}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent-text mb-3">
                    {resolveLocalized(conservation.tri1_label, conservation.tri1_label_en, currentLocale) ||
                      tScience('peerReviewed') ||
                      'Papers revisados por pares'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resolveLocalized(conservation.tri1_desc, conservation.tri1_desc_en, currentLocale) ||
                      tScience('peerReviewedDesc') ||
                      'Secuestro de carbono en bosque templado lluvioso: 10–25 kg CO₂/árbol/año (Schneider et al., 2020; Gutiérrez & Lara, 2022). Actividad antimicrobiana en mieles chilenas comparable a Manuka (Montes et al., 2019).'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent-text mb-3">
                    {resolveLocalized(conservation.tri2_label, conservation.tri2_label_en, currentLocale) ||
                      tScience('localData') ||
                      'Datos locales de Chiloé'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resolveLocalized(conservation.tri2_desc, conservation.tri2_desc_en, currentLocale) ||
                      `${ecosystemMetrics.arboles_total.toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US')} ${tScience('treesRegistered') || 'árboles registrados'} ${tScience('withCoordinates') || 'con coordenadas y especie'} ${tScience('inSectors') || 'en'} ${ecosystemMetrics.sectores} ${tScience('sectorsOf') || 'sectores de'} Pureo. ${ecosystemMetrics.colmenas_total} ${tScience('hivesMonitored') || 'colmenas monitoreadas'} ${tScience('inApiaries') || 'en apiarios'} ${tScience('between') || 'entre'} Quemchi, Molulco y Pureo-Quelen.`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent-text mb-3">
                    {resolveLocalized(conservation.tri3_label, conservation.tri3_label_en, currentLocale) ||
                      tScience('openCalculation') ||
                      'Cálculo abierto'}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resolveLocalized(conservation.tri3_desc, conservation.tri3_desc_en, currentLocale) ||
                      `${tScience('openCalculationDesc') || 'IRR = CO₂ capturado / CO₂ emitido. Nuestro ecosistema registra'} ${ecosystemMetrics.irr_ecosistema ? `${ecosystemMetrics.irr_ecosistema}×` : tScience('calculationInProgress') || 'cálculo en proceso'}. ${ecosystemMetrics.anos_legado} ${tScience('yearsOfReforestation') || 'años de reforestación nativa'}. ${tScience('formulaVerifiable') || 'Fórmula y datos verificables en nuestra página de ciencia.'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center border-t border-border/20 pt-10">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent-text mb-4">
                {resolveLocalized(conservation.irr_label, conservation.irr_label_en, currentLocale) ||
                  tScience('irrIndex') ||
                  'Índice de Regeneración Relativa'}
              </p>
              {ecosystemMetrics.irr_ecosistema && ecosystemMetrics.irr_ecosistema > 1 ? (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    {resolveLocalized(conservation.irr_pos_title, conservation.irr_pos_title_en, currentLocale) ||
                      `${tScience('irrPositive') || 'IRR'} ${ecosystemMetrics.irr_ecosistema} · ${tScience('impactGreaterThanFootprint') || 'Impacto > Huella'}`}
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    {resolveLocalized(conservation.irr_pos_desc, conservation.irr_pos_desc_en, currentLocale) ||
                      `${tScience('irrPositiveDesc') || 'El bosque captura'} ${ecosystemMetrics.irr_ecosistema}× ${tScience('moreCO2ThanEmitted') || 'más CO₂ del que la cadena productiva emite.'} ${tScience('verifiableBy') || 'Demostrable por registro forestal + balances de emisión.'}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    {resolveLocalized(conservation.irr_neg_title, conservation.irr_neg_title_en, currentLocale) ||
                      tScience('irrNegative') ||
                      'Miel de bosque + Reforestación > Huella de producción'}
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    {resolveLocalized(conservation.irr_neg_desc, conservation.irr_neg_desc_en, currentLocale) ||
                      `${ecosystemMetrics.anos_legado} ${tScience('yearsOfReforestation') || 'años de reforestación nativa.'} ${tScience('eachOrderFunds') || 'Cada pedido financia árboles y sostiene apiarios en bosque nativo entre'} Quemchi, Molulco y Pureo-Quelen.`}
                  </p>
                </>
              )}
              <div className="flex items-center justify-center gap-6 mt-6">
                <Link
                  href="/ciencia"
                  className="inline-flex min-h-11 items-center rounded-md border border-accent/40 px-4 py-2 text-editorial-xs uppercase tracking-widest text-accent-text hover:bg-accent/10 hover:text-accent/90 transition-colors"
                >
                  {resolveLocalized(conservation.cta_label, conservation.cta_label_en, currentLocale) ||
                    tScience('viewScience') ||
                    'Ver la ciencia detrás'} →
                </Link>
              </div>
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'collections') {
          const colKicker =
            resolveLocalized(collectionsSettings.kicker, collectionsSettings.kicker_en, currentLocale) ||
            tCollections('kicker') ||
            'Colecciones';
          const colTitle =
            resolveLocalized(collectionsSettings.title, collectionsSettings.title_en, currentLocale) ||
            tCollections('subtitle') ||
            'Explora nuestras categorías estacionales';
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
        <section key="collections" id="collections" className="editorial-section">
          <div className="editorial-container text-center mb-12 md:mb-20 px-4 sm:px-0 max-w-3xl mx-auto">
            <span className="editorial-kicker mb-4 block">{colKicker}</span>
            <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground mb-4 text-balance leading-tight">
              {colTitle}
            </h2>
            {colSubtitle ? (
              <p className="text-muted-foreground italic font-display text-base sm:text-lg max-w-xl mx-auto leading-relaxed text-pretty">
                {colSubtitle}
              </p>
            ) : null}
          </div>

          <div className={`editorial-container grid grid-cols-1 sm:grid-cols-2 ${gridClass} gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-16 px-4 sm:px-0`}>
            {initialColecciones.map((c, index) => {
              const imageSrc = resolveCollectionImage(c);
              return (
                <Link
                  key={c.title}
                  href={c.href}
                  prefetch={false}
                  className="group flex min-h-11 flex-col rounded-[var(--tienda-radius,0.5rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className={`relative ${aspectClass} overflow-hidden bg-surface-raised mb-4 sm:mb-6 rounded-[var(--tienda-radius,0.5rem)]`}>
                    <Image
                      src={imageSrc}
                      alt={c.title}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={`${fitClass} grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-elegant`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
                  </div>
                  <div className="text-center px-2">
                    <p className="editorial-kicker mb-2">{c.kicker}</p>
                    <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-light mb-2 group-hover:text-accent transition-colors duration-base text-balance">
                      {c.title}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed text-pretty">
                      {c.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
          );
        }

        if (sec.id === 'media') {
          return (
      <section key="media" id="media-carousel">
        <Suspense fallback={<div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" />}><MediaCarousel items={mediaItems} settings={mediaSettings} /></Suspense>
      </section>
          );
        }

        if (sec.id === 'products') {
          return (
      <div key="products" id="creaciones">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label={tCommon('loadingCreations') || 'Creaciones'} hideLabel /></div></div>}><LandingProducts products={orderedProducts} pageSize={8} ratings={ratings} header={productsHeader} /></Suspense>
      </div>
          );
        }

        if (sec.id === 'video') {
          return (
        <section key="video" id="central-video" className="editorial-section">
          <div className="editorial-container">
            <div className="relative w-full aspect-video max-w-5xl mx-auto rounded-lg overflow-hidden border border-border/30 bg-surface-sunken">
              <YoutubeLite videoId={videoId} title={videoTitle} />
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'map') {
          if (isMobile || legacy) {
            // Leaflet raster full-bleed es caro en móvil/legacy: tarjeta estática con datos del CMS.
            const { lat, lng, popup_title, popup_body } = map;
            return (
              <section key="map" id="world-location" className="editorial-section">
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
      <div key="map" id="world-location">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label={tCommon('loadingMap') || 'Mapa'} hideLabel /></div></div>}><WorldMapBlock mapSettings={map} /></Suspense>
      </div>
          );
        }

        return null;
      })}
      </main>

      <ShopFooter />
    </StoreShell>
  );
}