'use client';

import React, { useEffect, useRef, Suspense, useState } from 'react';
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
import { resolveLocalized } from '@/lib/shop/store-chrome';
import type { ShopProduct } from '@/lib/shop/products';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { ViewLoading } from '@enjambre/ui';

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

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
}

interface TiendaLandingProps {
  initialColecciones: ColeccionItem[];
  products: ShopProduct[];
  mediaItems: MediaItem[];
  youtubeVideoId: string;
  footerData: {
    branding: { tagline: string; email: string };
    nav: Array<{ label: string; href: string }>;
    legal: Array<{ label: string; href: string }>;
  };
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
  mediaItems,
  youtubeVideoId,
  footerData,
  ecosystemMetrics,
  locale,
}: TiendaLandingProps) {
  const t = useTranslations();
  const tHero = useTranslations('hero');
  const tConservation = useTranslations('conservation');
  const tCollections = useTranslations('collections');
  const tFooter = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tScience = useTranslations('science');
  const currentLocale = useLocale();
  const { landing } = useStoreChrome();
  const orderedSections = [...landing.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
  
  const gsapRef = useRef<GSAPInstance | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
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
    {landing.show_grain ? <GrainOverlay /> : null}
    {!isMobile && landing.show_custom_cursor ? <CustomCursor /> : null}
    <TextCarousel />
    <ShopHeader />

    <main className="relative overflow-hidden">
      {orderedSections.map((sec) => {
        if (sec.id === 'hero') {
          return (
      <section
            key="hero"
            className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))] md:pb-32 min-h-[100svh] md:min-h-[100dvh]"
          >
            <div className="absolute inset-0 pointer-events-none" aria-hidden />
        {!isMobile && landing.show_bee_canvas ? <BeeCanvas /> : null}
        <div
          className="absolute inset-0 pointer-events-none bg-background/40 md:bg-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 70%)',
            opacity: isMobile ? 0.88 : 0.6,
          }}
        />

          {/* z-20 above scroll cue; pb reserved so absolute cue never crosses copy */}
          <div className="relative z-20 mx-auto w-full max-w-4xl px-1">
            <span className="hero-eyebrow editorial-kicker mb-6 md:mb-8 block">
              {tHero('subtitle') || 'Miel Virgen del Sur del Mundo'}
            </span>
            <h1 className="hero-title font-display text-[clamp(2.75rem,7vw,5.75rem)] font-light leading-[1.05] mb-5 md:mb-6 overflow-hidden text-balance">
              <span className="block overflow-hidden">
                <span className="line-inner block">{tHero('titlePart1') || 'La Obrera'}</span>
              </span>
              <span className="block overflow-hidden">
                <span className="line-inner block">{tHero('titlePart2') || 'y el Zángano'}</span>
              </span>
            </h1>
            <p className="hero-subtitle font-display italic text-[clamp(1.05rem,2.2vw,1.4rem)] text-muted-foreground tracking-wide max-w-2xl mx-auto text-pretty leading-relaxed">
              {tHero('description') || 'Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje'}
            </p>
            <p className="hero-formula mt-5 md:mt-6 font-mono text-[clamp(0.6rem,1.1vw,0.75rem)] tracking-[0.12em] sm:tracking-[0.22em] md:tracking-[0.28em] uppercase text-accent/60 max-w-xl mx-auto leading-relaxed">
              {tHero('formula') || 'Luz solar → Néctar → Miel virgen · Sin atajos industriales'}
            </p>
            {landing.show_hero_cta ? (
              <div className="mt-10 md:mt-12">
                <Link
                  href={landing.hero_cta_href || '/catalogo'}
                  className="inline-flex min-h-[48px] min-w-[44px] items-center justify-center rounded-full border border-accent bg-accent/10 px-8 py-3.5 text-[0.65rem] uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
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
          {/* Scroll cue: side rail on md+, never center-stacked over subtitle/formula */}
          <div
            className="pointer-events-none absolute right-4 sm:right-6 md:right-8 z-10 flex flex-col items-center gap-2 md:gap-3 bottom-[max(1.5rem,env(safe-area-inset-bottom))] md:bottom-10"
            aria-hidden
          >
            <span className="hidden lg:block text-editorial-xs uppercase tracking-widest text-muted-foreground/80 [writing-mode:vertical-rl] rotate-180">
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
              <span className="editorial-kicker mb-4 block">{tConservation('kicker') || 'Conservación demostrable'}</span>
              <h2 className="font-display text-[clamp(1.75rem,6vw,3rem)] sm:text-4xl md:text-5xl font-light text-foreground mb-4 md:mb-6 text-balance leading-tight">
                {tConservation('title') || 'Impacto sin atajos'}
              </h2>
              <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                {tConservation('description') || 'No certificamos con sellos de tercera mano. Nuestro impacto se demuestra por triangulación: papers revisados por pares, datos locales de Chiloé, y cálculos abiertos que cualquier persona puede verificar.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-8 text-center mb-12 md:mb-16">
              {[
                { value: ecosystemMetrics.arboles_total, label: tConservation('treesPlanted') || 'Árboles plantados', suffix: '+' },
                { value: ecosystemMetrics.co2_evitado_total_kg, label: tConservation('co2Avoided') || 'CO₂ evitado (kg)', suffix: '', prefix: '~' },
                { value: ecosystemMetrics.colmenas_total, label: tConservation('hivesCustodied') || 'Colmenas custodiadas', suffix: '' },
                { value: ecosystemMetrics.especies_nativas, label: tConservation('nativeSpecies') || 'Especies nativas', suffix: '' },
              ].map((stat) => (
                <div key={stat.label} className="py-2 sm:py-4 px-1 min-w-0">
                  <p className="counter-value font-display text-[clamp(1.65rem,6vw,3.75rem)] sm:text-5xl md:text-6xl font-light text-accent tabular-nums tracking-tight" data-target={stat.value} data-prefix={stat.prefix || ''} data-suffix={stat.suffix}>
                    0
                  </p>
                  <p className="text-editorial-xs uppercase tracking-widest text-muted-foreground mt-2 sm:mt-3 leading-snug text-balance">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto border-t border-border/20 pt-10 mb-12 md:mb-16">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent/70 mb-6 text-center">{tScience('triangulation') || 'Triangulación de fuentes'}</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">{tScience('peerReviewed') || 'Papers revisados por pares'}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tScience('peerReviewedDesc') || 'Secuestro de carbono en bosque templado lluvioso: 10–25 kg CO₂/árbol/año (Schneider et al., 2020; Gutiérrez & Lara, 2022). Actividad antimicrobiana en mieles chilenas comparable a Manuka (Montes et al., 2019).'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">{tScience('localData') || 'Datos locales de Chiloé'}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ecosystemMetrics.arboles_total.toLocaleString(currentLocale === 'es' ? 'es-CL' : 'en-US')} {tScience('treesRegistered') || 'árboles registrados'} {tScience('withCoordinates') || 'con coordenadas y especie'} {tScience('inSectors') || 'en'} {ecosystemMetrics.sectores} {tScience('sectorsOf') || 'sectores de'} Pureo. {ecosystemMetrics.colmenas_total} {tScience('hivesMonitored') || 'colmenas monitoreadas'} {tScience('inApiaries') || 'en apiarios'} {tScience('between') || 'entre'} Quemchi, Molulco y Pureo-Quelen.
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">{tScience('openCalculation') || 'Cálculo abierto'}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tScience('openCalculationDesc') || 'IRR = CO₂ capturado / CO₂ emitido. Nuestro ecosistema registra'} {ecosystemMetrics.irr_ecosistema ? `${ecosystemMetrics.irr_ecosistema}×` : tScience('calculationInProgress') || 'cálculo en proceso'}. {ecosystemMetrics.anos_legado} {tScience('yearsOfReforestation') || 'años de reforestación nativa'}. {tScience('formulaVerifiable') || 'Fórmula y datos verificables en nuestra página de ciencia.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center border-t border-border/20 pt-10">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent/70 mb-4">{tScience('irrIndex') || 'Índice de Regeneración Relativa'}</p>
              {ecosystemMetrics.irr_ecosistema && ecosystemMetrics.irr_ecosistema > 1 ? (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    {tScience('irrPositive') || 'IRR'} {ecosystemMetrics.irr_ecosistema} · {tScience('impactGreaterThanFootprint') || 'Impacto > Huella'}
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    {tScience('irrPositiveDesc') || 'El bosque captura'} {ecosystemMetrics.irr_ecosistema}× {tScience('moreCO2ThanEmitted') || 'más CO₂ del que la cadena productiva emite.'} {tScience('verifiableBy') || 'Demostrable por registro forestal + balances de emisión.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    {tScience('irrNegative') || 'Miel de bosque + Reforestación > Huella de producción'}
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    {ecosystemMetrics.anos_legado} {tScience('yearsOfReforestation') || 'años de reforestación nativa.'} {tScience('eachOrderFunds') || 'Cada pedido financia árboles y sostiene apiarios en bosque nativo entre'} Quemchi, Molulco y Pureo-Quelen.
                  </p>
                </>
              )}
              <div className="flex items-center justify-center gap-6 mt-6">
                <Link
                  href="/ciencia"
                  className="inline-flex min-h-11 items-center rounded-md border border-accent/40 px-4 py-2 text-editorial-xs uppercase tracking-widest text-accent hover:bg-accent/10 hover:text-accent/90 transition-colors"
                >
                  {tScience('viewScience') || 'Ver la ciencia detrás'} →
                </Link>
              </div>
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'collections') {
          return (
        <section key="collections" id="collections" className="editorial-section">
          <div className="editorial-container text-center mb-12 md:mb-20 px-4 sm:px-0">
            <span className="editorial-kicker mb-4 block">{tCollections('kicker') || 'Colecciones'}</span>
            <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground mb-4 text-balance leading-tight">
              {tCollections('subtitle') || 'Explora nuestras categorías estacionales'}
            </h2>
          </div>

          <div className="editorial-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-16 px-4 sm:px-0">
            {initialColecciones.map((c, index) => {
              const imageSrc = resolveCollectionImage(c);
              return (
                <Link
                  key={c.title}
                  href={c.href}
                  prefetch={false}
                  className="group flex min-h-11 flex-col rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised mb-4 sm:mb-6 rounded-lg">
                    <Image
                      src={imageSrc}
                      alt={c.title}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-elegant"
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
        <Suspense fallback={<div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" />}><MediaCarousel items={mediaItems} /></Suspense>
      </section>
          );
        }

        if (sec.id === 'products') {
          return (
      <div key="products" id="creaciones">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label={tCommon('loadingCreations') || 'Creaciones'} hideLabel /></div></div>}><LandingProducts products={products} pageSize={8} /></Suspense>
      </div>
          );
        }

        if (sec.id === 'video') {
          return (
        <section key="video" id="central-video" className="editorial-section">
          <div className="editorial-container">
            <div className="relative w-full aspect-video max-w-5xl mx-auto rounded-lg overflow-hidden border border-border/30 bg-surface-sunken">
              <YoutubeLite videoId={youtubeVideoId} title="La Obrera y el Zángano" />
            </div>
          </div>
        </section>
          );
        }

        if (sec.id === 'map') {
          return (
      <div key="map" id="world-location">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container"><ViewLoading variant="view" label={tCommon('loadingMap') || 'Mapa'} hideLabel /></div></div>}><WorldMapBlock /></Suspense>
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