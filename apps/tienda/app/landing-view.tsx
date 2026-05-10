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
}

export default function TiendaLandingView({
  initialServicios,
  initialTalleres,
  initialColecciones,
  footerData,
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
      }, '-=0.6');

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
      gsap.to(el, {
        textContent: target,
        duration: 2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true,
        },
      });
    });
  }, []);

  return (
    <StoreShell>
      <LandingLoader />
      <GrainOverlay />
      <CustomCursor />
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
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="text-editorial-xs uppercase tracking-widest text-muted-foreground [writing-mode:vertical-rl]">Descender</span>
            <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent animate-bounce" />
          </div>
        </section>

        {/* ── IMPACT COUNTERS ── */}
        <section className="editorial-section bg-surface-raised/50 border-y border-border/30">
          <div className="editorial-container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 2400, label: 'Colmenas custodiadas', suffix: '+' },
              { value: 12000, label: 'Árboles plantados', suffix: '+' },
              { value: 8, label: 'Apiarios en Chiloé', suffix: '' },
              { value: 100, label: '% Miel virgen cruda', suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <p className="counter-value font-display text-5xl md:text-6xl font-light text-accent" data-target={stat.value}>
                  0
                </p>
                <p className="text-editorial-xs uppercase tracking-widest text-muted-foreground mt-3">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COLLECTIONS ── */}
        <section id="collections" className="editorial-section">
          <div className="editorial-container text-center mb-24">
            <span className="editorial-kicker mb-4 block">Catálogo</span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-foreground mb-4">Creaciones</h2>
            <p className="text-muted-foreground italic font-display text-lg">La materia de nuestras búsquedas.</p>
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

      <ShopFooter data={footerData} />
    </StoreShell>
  );
}
