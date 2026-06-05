'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Mail, MapPin, Globe } from 'lucide-react';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { BeeCanvas } from '@/components/shop/bee-canvas';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { CustomCursor } from '@/components/shop/custom-cursor';
import { LandingLoader } from '@/components/shop/landing-loader';
import { TextCarousel } from '@/components/shop/text-carousel';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ServicioItem {
  num: string;
  title: string;
  desc: string;
}

interface TallerItem {
  date: string;
  title: string;
  desc: string;
  action: string;
}

interface ColeccionItem {
  kicker: string;
  title: string;
  desc: string;
  href: string;
}

interface TiendaLandingProps {
  initialServicios: ServicioItem[];
  initialTalleres: TallerItem[];
  initialColecciones: ColeccionItem[];
  footerData: {
    branding: { tagline: string; email: string };
    nav: Array<{ label: string; href: string }>;
    legal: Array<{ label: string; href: string }>;
  };
  ecosystemMetrics: EcosystemMetrics;
}

export function TiendaLandingView({
  initialServicios,
  initialTalleres,
  initialColecciones,
  footerData,
  ecosystemMetrics,
}: TiendaLandingProps) {
  useEffect(() => {
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

    const sections = ['#collections', '#immersion', '#services', '#workshops', '#inquiry'];
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
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-background opacity-60 pointer-events-none" />

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
                { value: ecosystemMetrics.co2_ton, label: 'Ton CO₂ capturado', suffix: '', prefix: '~' },
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

        {/* ── COLLECTIONS ── */}
        <section id="collections" className="editorial-section">
          <div className="editorial-container text-center mb-24">
            <span className="editorial-kicker mb-4 block">Catálogo</span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-foreground mb-4">Creaciones</h2>
            <p className="text-muted-foreground italic font-display text-lg">La materia de nuestra búsqueda Experiencias que se transforman en productos cargados de legado</p>
          </div>

          <div className="editorial-container grid md:grid-cols-2 gap-x-12 gap-y-24">
            {initialColecciones.map((c) => {
              const imageSrc = c.kicker.toLowerCase().includes('sachet') || c.kicker.toLowerCase().includes('cofre')
                ? '/assets/editorial/sachets.png'
                : '/assets/editorial/honey-jar.png';

              return (
                <Link key={c.title} href={c.href} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-raised mb-8 rounded-lg">
                    <img
                      src={imageSrc}
                      alt={c.title}
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-elegant"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
                  </div>
                  <div className="text-center md:text-left px-4">
                    <p className="editorial-kicker mb-3">{c.kicker}</p>
                    <h3 className="font-display text-3xl font-light mb-3 group-hover:text-accent transition-colors duration-base">{c.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto md:mx-0 leading-relaxed">{c.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── RITUALES ── */}
      <section className="editorial-section border-t border-border/20">
        <div className="editorial-container text-center mb-16">
          <span className="editorial-kicker mb-4 block">Rituales</span>
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">Cómo habitar esta miel</h2>
        </div>
        <div className="editorial-container grid md:grid-cols-3 gap-12">
          {[
            { momento: 'Mañana', desc: 'Una cucharada en agua tibia antes de que el día empiece. Un ritual lento para quienes necesitan calma antes del ruido.' },
            { momento: 'Tarde', desc: 'En lugar del azúcar en tu infusión. La miel se disuelve con la paciencia que la tarde merece.' },
            { momento: 'Noche', desc: 'Directa del frasco, sin intermediarios. Una reserva de calma para noches largas.' },
          ].map((r) => (
            <div key={r.momento} className="text-center px-4">
              <p className="editorial-kicker mb-4 block">{r.momento}</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IMMERSION ── */}
        <section id="immersion" className="relative h-[80vh] w-full overflow-hidden">
          <img
            src="/assets/editorial/immersion.png"
            alt="Inmersión: El Latido del Bosque"
            className="h-full w-full object-cover border-none"
          />
          <div className="absolute inset-0 bg-foreground/40 flex flex-col items-center justify-center text-center p-6">
            <div className="max-w-2xl editorial-rule border-foreground/10 backdrop-blur-sm bg-background/10 px-8">
              <span className="editorial-kicker mb-6 block">Biocultura</span>
              <h2 className="font-display italic text-3xl md:text-4xl font-light text-foreground leading-relaxed">
                &ldquo;No solo extraemos miel; custodiamos el ritmo de un ecosistema que respira a través del néctar.&rdquo;
              </h2>
            </div>
          </div>
        </section>

        {/* ── SERVICIOS ── */}
        <section id="services" className="editorial-section bg-surface-raised border-y border-border/30">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-20">
              <span className="editorial-kicker mb-4 block">Servicios</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-foreground">Membranas de colaboración</h2>
            </div>

            <div className="divide-y divide-border/30">
              {initialServicios.map((s) => (
                <div key={s.num} className="group py-12 flex flex-col md:flex-row md:items-center gap-8 hover:bg-surface-raised/50 transition-all duration-base px-8 -mx-8 rounded-sm">
                  <span className="font-display italic text-accent text-2xl w-12">{s.num}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-3xl font-light mb-3 group-hover:translate-x-3 transition-transform duration-base">{s.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-accent group-hover:border-accent group-hover:text-accent-foreground transition-all duration-base group-hover:-rotate-45">
                    <ArrowRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TALLERES ── */}
        <section id="workshops" className="editorial-section">
          <div className="editorial-container text-center mb-24">
            <span className="editorial-kicker mb-4 block">Talleres</span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-foreground">Iniciaciones</h2>
          </div>

          <div className="editorial-container grid lg:grid-cols-3 gap-8">
            {initialTalleres.map((w) => (
              <div key={w.title} className="relative bg-surface-raised border border-border/30 p-12 group hover:-translate-y-2 transition-all duration-spring overflow-hidden flex flex-col rounded-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-elegant origin-left" />
                <span className="editorial-kicker mb-8 block">{w.date}</span>
                <h3 className="font-display text-3xl font-light mb-6 leading-tight text-foreground">{w.title}</h3>
                <p className="text-sm text-muted-foreground mb-12 leading-relaxed flex-1">{w.desc}</p>
                <Link href="/catalogo" className="inline-flex items-center gap-3 text-editorial-xs uppercase tracking-widest text-foreground hover:text-accent transition-colors duration-base mt-auto">
                  {w.action} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONSULTA ── */}
        <section id="inquiry" className="editorial-section bg-surface-raised border-t border-border/30">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-24">
            <div>
              <span className="editorial-kicker mb-4 block">Consulta</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-10 leading-tight">Establecer contacto</h2>
              <p className="text-muted-foreground mb-12 text-lg leading-relaxed">
                Para pedidos, alianzas comerciales o simplemente conversar sobre la textura de una buena miel, escríbenos. Respondemos con la paciencia del panal.
              </p>

              <div className="space-y-10">
                {[
                  { icon: Mail, label: 'Correo', value: 'hola@obrerayzangano.com', href: 'mailto:hola@obrerayzangano.com' },
                  { icon: MapPin, label: 'Origen', value: 'Chiloé, Chile' },
                  { icon: Globe, label: 'Distribución', value: 'Santiago — Dubai — Próximamente' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-5">
                    <div className="p-4 bg-surface-raised rounded-sm border border-border/30">
                      <item.icon size={22} className="text-accent" />
                    </div>
                    <div>
                      <span className="block text-editorial-xs uppercase tracking-widest text-muted-foreground mb-2">{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className="text-lg text-foreground hover:text-accent transition-colors underline underline-offset-8 decoration-border">
                          {item.value}
                        </a>
                      ) : (
                        <span className="text-lg text-foreground">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form className="space-y-10 glass-panel p-12" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="block text-editorial-xs uppercase tracking-widest text-muted-foreground">Nombre</label>
                <input type="text" className="w-full bg-transparent border-b border-border py-4 text-foreground focus:outline-none focus:border-accent transition-colors duration-base text-lg placeholder:text-muted-foreground/40" placeholder="Quién eres" />
              </div>
              <div className="space-y-2">
                <label className="block text-editorial-xs uppercase tracking-widest text-muted-foreground">Correo</label>
                <input type="email" className="w-full bg-transparent border-b border-border py-4 text-foreground focus:outline-none focus:border-accent transition-colors duration-base text-lg placeholder:text-muted-foreground/40" placeholder="tu@correo.com" />
              </div>
              <div className="space-y-2">
                <label className="block text-editorial-xs uppercase tracking-widest text-muted-foreground">Mensaje</label>
                <textarea className="w-full bg-transparent border-b border-border py-4 text-foreground focus:outline-none focus:border-accent transition-colors duration-base min-h-[120px] text-lg placeholder:text-muted-foreground/40" placeholder="Cuéntanos qué necesitas..." />
              </div>
              <button className="w-full py-5 border border-accent text-accent text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant font-medium rounded-md" type="submit">
                Enviar consulta
              </button>
            </form>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
