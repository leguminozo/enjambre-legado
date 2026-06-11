'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { TextCarousel } from '@/components/shop/text-carousel';
import type { ShopProduct } from '@/lib/shop/products';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

const BeeCanvas = dynamic(
  () => import('@/components/shop/bee-canvas').then((m) => m.BeeCanvas),
  { ssr: false },
);
const CustomCursor = dynamic(
  () => import('@/components/shop/custom-cursor').then((m) => m.CustomCursor),
  { ssr: false },
);
const LandingLoader = dynamic(
  () => import('@/components/shop/landing-loader').then((m) => m.LandingLoader),
  { ssr: false },
);
const WorldMapBlock = dynamic(
  () => import('@/components/shop/world-map-block').then((m) => m.WorldMapBlock),
  { ssr: false },
);
const MediaCarousel = dynamic(
  () => import('@/components/shop/media-carousel').then((m) => m.MediaCarousel),
  { ssr: false, loading: () => <div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" /> },
);
const LandingProducts = dynamic(
  () => import('@/components/shop/landing-products').then((m) => m.LandingProducts),
  { loading: () => <div className="editorial-section"><div className="editorial-container text-center text-muted-foreground italic">Cargando creaciones…</div></div> },
);

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ColeccionItem {
  kicker: string;
  title: string;
  desc: string;
  href: string;
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

export function TiendaLandingView({
  initialColecciones,
  products,
  mediaItems,
  youtubeVideoId,
  footerData,
  ecosystemMetrics,
}: TiendaLandingProps) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.to('.hero-eyebrow', {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.5,
      })
      .to('.hero-title .line-inner', {
        y: 0,
        duration: 1.4,
        stagger: 0.15,
        ease: 'power4.out',
      }, '-=0.8')
      .to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      }, '-=0.6')
      .to('.hero-formula', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      }, '-=0.3');

      const sections = ['#collections', '#media-carousel', '#creaciones', '#central-video', '#world-location'];
      sections.forEach((section) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
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
            el.textContent = prefix + Math.round(obj.val).toLocaleString('es-CL') + suffix;
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <StoreShell>
    <LandingLoader />
    <GrainOverlay />
    <CustomCursor />
    <TextCarousel />
    <ShopHeader />

    <main className="relative overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <BeeCanvas />
          <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 70%)',
          opacity: 0.6,
        }}
      />

          <div className="relative z-10 max-w-4xl">
            <span className="hero-eyebrow editorial-kicker mb-8 opacity-0 translate-y-5 block">
              Miel Virgen del Sur del Mundo
            </span>
            <h1 className="hero-title font-display text-[clamp(3rem,8vw,7rem)] font-light leading-tight mb-6 overflow-hidden">
              <span className="block overflow-hidden">
                <span className="line-inner block translate-y-full">La Obrera</span>
              </span>
              <span className="block overflow-hidden">
                <span className="line-inner block translate-y-full">y el Zángano</span>
              </span>
            </h1>
            <p className="hero-subtitle font-display italic text-[clamp(1.1rem,2.5vw,1.5rem)] text-muted-foreground tracking-wide opacity-0 translate-y-7">
              Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje
            </p>
            <p className="hero-formula mt-6 font-mono text-[clamp(0.65rem,1.2vw,0.8rem)] tracking-[0.3em] uppercase text-accent/60 opacity-0 translate-y-5">
              Luz solar → Néctar → Miel virgen · Sin atajos industriales
            </p>
          </div>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="text-editorial-xs uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">Descender</span>
            <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent animate-bounce" />
          </div>
        </section>

        {/* ── CONSERVACION DEMOSTRABLE ── */}
        <section className="editorial-section bg-surface-raised/50 border-y border-border/30">
          <div className="editorial-container">
            <div className="text-center mb-16">
              <span className="editorial-kicker mb-4 block">Conservación demostrable</span>
              <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-6">
                Impacto sin atajos
              </h2>
              <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto leading-relaxed">
                No certificamos con sellos de tercera mano. Nuestro impacto se demuestra por triangulación: papers revisados por pares, datos locales de Chiloé, y cálculos abiertos que cualquier persona puede verificar.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
              {[
                { value: ecosystemMetrics.arboles_total, label: 'Árboles plantados', suffix: '+' },
                { value: ecosystemMetrics.co2_evitado_total_kg, label: 'CO₂ evitado (kg)', suffix: '', prefix: '~' },
                { value: ecosystemMetrics.colmenas_total, label: 'Colmenas custodiadas', suffix: '' },
                { value: ecosystemMetrics.especies_nativas, label: 'Especies nativas', suffix: '' },
              ].map((stat) => (
                <div key={stat.label} className="py-4">
                  <p className="counter-value font-display text-5xl md:text-6xl font-light text-accent" data-target={stat.value} data-prefix={stat.prefix || ''} data-suffix={stat.suffix}>
                    0
                  </p>
                  <p className="text-editorial-xs uppercase tracking-widest text-muted-foreground mt-3">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto border-t border-border/20 pt-10 mb-16">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent/70 mb-6 text-center">Triangulación de fuentes</p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">Papers revisados por pares</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Secuestro de carbono en bosque templado lluvioso: 10–25 kg CO₂/árbol/año (Schneider et al., 2020; Gutiérrez & Lara, 2022). Actividad antimicrobiana en mieles chilenas comparable a Manuka (Montes et al., 2019).
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">Datos locales de Chiloé</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ecosystemMetrics.arboles_total.toLocaleString('es-CL')} árboles registrados con coordenadas y especie en {ecosystemMetrics.sectores} sectores de Pureo. {ecosystemMetrics.colmenas_total} colmenas monitoreadas en apiarios entre Quemchi, Molulco y Pureo-Quelen.
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/60 mb-3">Cálculo abierto</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    IRR = CO₂ capturado / CO₂ emitido. Nuestro ecosistema registra {ecosystemMetrics.irr_ecosistema ? `${ecosystemMetrics.irr_ecosistema}×` : 'cálculo en proceso'}. {ecosystemMetrics.anos_legado} de reforestación nativa. Fórmula y datos verificables en nuestra página de ciencia.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto text-center border-t border-border/20 pt-10">
              <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent/70 mb-4">Índice de Regeneración Relativa</p>
              {ecosystemMetrics.irr_ecosistema && ecosystemMetrics.irr_ecosistema > 1 ? (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    IRR {ecosystemMetrics.irr_ecosistema} · Impacto &gt; Huella
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    El bosque captura {ecosystemMetrics.irr_ecosistema}× más CO₂ del que la cadena productiva emite. Demostrable por registro forestal + balances de emisión.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide">
                    Miel de bosque + Reforestación &gt; Huella de producción
                  </p>
                  <p className="text-sm text-muted-foreground italic mt-4 max-w-lg mx-auto">
                    {ecosystemMetrics.anos_legado} de reforestación nativa. Cada pedido financia árboles y sostiene apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen.
                  </p>
                </>
              )}
              <div className="flex items-center justify-center gap-6 mt-6">
                <Link href="/ciencia" className="text-editorial-xs uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
                  Ver la ciencia detrás →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── COLECCIONES — Explora nuestras categorías estacionales ── */}
        <section id="collections" className="editorial-section">
          <div className="editorial-container text-center mb-24">
            <span className="editorial-kicker mb-4 block">Colecciones</span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-foreground mb-4">
              Explora nuestras categorías estacionales
            </h2>
          </div>

          <div className="editorial-container grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {initialColecciones.map((c) => {
              const imageSrc = getCollectionImage(c.kicker);
              return (
                <Link key={c.title} href={c.href} className="group flex flex-col">
            <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised mb-6 rounded-lg">
                  <img
                    src={imageSrc}
                    alt={c.title}
                    className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-elegant"
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
                  </div>
                  <div className="text-center px-2">
                    <p className="editorial-kicker mb-2">{c.kicker}</p>
                    <h3 className="font-display text-2xl md:text-3xl font-light mb-2 group-hover:text-accent transition-colors duration-base">{c.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{c.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      {/* ── CARRUSEL DE MEDIAS (imágenes/videos) ── */}
      <section id="media-carousel">
        <Suspense fallback={<div className="w-full h-[50vh] md:h-[70vh] bg-surface-raised" />}><MediaCarousel items={mediaItems} /></Suspense>
      </section>

      {/* ── CREACIONES — Productos directos 2x4 ── */}
      <div id="creaciones">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container text-center text-muted-foreground italic">Cargando creaciones…</div></div>}><LandingProducts products={products} pageSize={8} /></Suspense>
      </div>

        {/* ── VIDEO CENTRAL YOUTUBE ── */}
        <section id="central-video" className="editorial-section">
          <div className="editorial-container">
            <div className="relative w-full aspect-video max-w-5xl mx-auto rounded-lg overflow-hidden border border-border/30 bg-surface-sunken">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`}
                title="La Obrera y el Zángano"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
              />
            </div>
          </div>
        </section>

      {/* ── NUESTRO LUGAR EN EL MUNDO ── */}
      <div id="world-location">
        <Suspense fallback={<div className="editorial-section"><div className="editorial-container text-center text-muted-foreground italic">Cargando mapa…</div></div>}><WorldMapBlock /></Suspense>
      </div>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
