'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Mail, MapPin, Globe } from 'lucide-react';

import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ImagePlaceholder } from '@/components/shop/image-placeholder';
import { BeeCanvas } from '@/components/shop/bee-canvas';
import { GrainOverlay } from '@/components/shop/grain-overlay';
import { CustomCursor } from '@/components/shop/custom-cursor';
import { LandingLoader } from '@/components/shop/landing-loader';

// Registramos ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type TiendaLandingProps = {
  initialServicios: Array<{ num: string; title: string; desc: string }>;
  initialTalleres: Array<{ date: string; title: string; desc: string; action: string }>;
  initialColecciones: Array<{ kicker: string; title: string; desc: string; href: string }>;
  footerData: {
    branding: { tagline: string; email: string };
    nav: Array<{ label: string; href: string }>;
    legal: Array<{ label: string; href: string }>;
  };
};


export default function TiendaLandingView({ 
  initialServicios, 
  initialTalleres, 
  initialColecciones,
  footerData 
}: TiendaLandingProps) {
  useEffect(() => {
    // Animaciones de entrada
    const tl = gsap.timeline();
    
    tl.to('.hero-eyebrow', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.5
    })
    .to('.hero-title .line-inner', {
      y: 0,
      duration: 1.4,
      stagger: 0.15,
      ease: 'power4.out'
    }, '-=0.8')
    .to('.hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.6');

    // Revelación de secciones al hacer scroll
    const sections = ['#collections', '#immersion', '#services', '#workshops', '#inquiry'];
    sections.forEach((section) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
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
        {/* HERO SECTION */}
        <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4">
          <BeeCanvas />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#050505] opacity-60 pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl">
            <span className="hero-eyebrow block text-[0.7rem] tracking-[0.5em] uppercase text-[#c9a227] mb-8 opacity-0 transform translate-y-5">
              Miel Virgen del Sur del Mundo
            </span>
            <h1 className="hero-title font-display text-[clamp(3rem,8vw,7rem)] font-light leading-[1.1] mb-6 overflow-hidden">
              <span className="block overflow-hidden">
                <span className="line-inner block transform translate-y-full">La Obrera</span>
              </span>
              <span className="block overflow-hidden">
                <span className="line-inner block transform translate-y-full">y el Zángano</span>
              </span>
            </h1>
            <p className="hero-subtitle font-display italic text-[clamp(1.1rem,2.5vw,1.5rem)] text-[#8a8279] tracking-wide opacity-0 transform translate-y-7">
              Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje
            </p>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-[#8a8279] vertical-rl">Descender</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-[#c9a227] to-transparent animate-bounce" />
          </div>
        </section>

        {/* COLLECTIONS - Expanded Grid */}
        <section id="collections" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Catálogo</span>
            <h2 className="font-display text-4xl md:text-6xl font-light text-[#f5f0e8] mb-4">Creaciones</h2>
            <p className="text-[#8a8279] italic font-display text-lg">La materia de nuestras búsquedas.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-24">
            {initialColecciones.map((c) => {
              const imageSrc = c.kicker.toLowerCase().includes('sachet') || c.kicker.toLowerCase().includes('cofre')
                ? '/assets/editorial/sachets.png'
                : '/assets/editorial/honey-jar.png';
              
              return (
                <Link key={c.title} href={c.href} className="group flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#141210] mb-8">
                    <img 
                      src={imageSrc} 
                      alt={c.title} 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-center md:text-left px-4">
                    <p className="text-[0.65rem] tracking-[0.3em] uppercase text-[#c9a227] mb-3">{c.kicker}</p>
                    <h3 className="font-display text-3xl font-light mb-3 group-hover:text-[#c9a227] transition-colors">{c.title}</h3>
                    <p className="text-sm text-[#8a8279] max-w-sm mx-auto md:mx-0 leading-relaxed">{c.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* IMMERSION - Full Width Asset */}
        <section id="immersion" className="relative h-[80vh] w-full overflow-hidden">
          <img 
            src="/assets/editorial/immersion.png" 
            alt="Inmersión: El Latido del Bosque" 
            className="h-full w-full object-cover border-none" 
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
            <div className="max-w-2xl border-y border-white/10 py-12 px-8 backdrop-blur-sm bg-black/10">
              <span className="text-[0.7rem] tracking-[0.5em] uppercase text-[#c9a227] mb-6 block">Biocultura</span>
              <h2 className="font-display italic text-3xl md:text-4xl font-light text-[#f5f0e8] leading-relaxed">
                "No solo extraemos miel; custodiamos el ritmo de un ecosistema que respira a través del néctar."
              </h2>
            </div>
          </div>
        </section>

        {/* SERVICIOS - Dynamic Content */}
        <section id="services" className="py-32 bg-[#0c0c0c] border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-20">
              <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Servicios</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8]">Membranas de colaboración</h2>
            </div>

            <div className="divide-y divide-white/5">
              {initialServicios.map((s) => (
                <div key={s.num} className="group py-12 flex flex-col md:flex-row md:items-center gap-8 hover:bg-[#141210]/50 transition-all px-8 -mx-8 rounded-sm">
                  <span className="font-display italic text-[#c9a227] text-2xl w-12">{s.num}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-3xl font-light mb-3 group-hover:translate-x-3 transition-transform">{s.title}</h3>
                    <p className="text-sm text-[#8a8279] max-w-md leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#c9a227] group-hover:border-[#c9a227] group-hover:text-black transition-all group-hover:-rotate-45">
                    <ArrowRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TALLERES - Dynamic Content */}
        <section id="workshops" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-24 text-center">
            <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Talleres</span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8]">Iniciaciones</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {initialTalleres.map((w) => (
              <div key={w.title} className="relative bg-[#0c0c0c] border border-white/5 p-12 group hover:-translate-y-2 transition-transform overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#c9a227] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <span className="text-[0.6rem] tracking-[0.3em] uppercase text-[#c9a227] mb-8 block">{w.date}</span>
                <h3 className="font-display text-3xl font-light mb-6 leading-tight">{w.title}</h3>
                <p className="text-sm text-[#8a8279] mb-12 leading-relaxed flex-1">{w.desc}</p>
                <Link href="/catalogo" className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.3em] text-[#f5f0e8] hover:text-[#c9a227] transition-colors mt-auto">
                  {w.action} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CONSULTA */}
        <section id="inquiry" className="py-32 bg-[#0c0c0c] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-24">
            <div>
              <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Consulta</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8] mb-10 leading-tight">Establecer contacto</h2>
              <p className="text-[#8a8279] mb-12 text-lg leading-relaxed">
                Para pedidos, alianzas comerciales o simplemente conversar sobre la textura de una buena miel, escríbenos. Respondemos con la paciencia del panal.
              </p>
              
              <div className="space-y-10">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-white/5 rounded-sm border border-white/5"><Mail size={22} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-2">Correo</span>
                    <a href="mailto:hola@obrerayzangano.com" className="text-lg text-[#f5f0e8] hover:text-[#c9a227] transition-colors underline underline-offset-8 decoration-white/10">hola@obrerayzangano.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-white/5 rounded-sm border border-white/5"><MapPin size={22} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-2">Origen</span>
                    <span className="text-lg text-[#f5f0e8]">Chiloé, Chile</span>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-white/5 rounded-sm border border-white/5"><Globe size={22} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-2">Distribución</span>
                    <span className="text-lg text-[#f5f0e8]">Santiago — Dubai — Próximamente</span>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-10 bg-[#141210] p-12 border border-white/5 shadow-2xl" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-[#8a8279]">Nombre</label>
                <input type="text" className="w-full bg-transparent border-b border-white/10 py-4 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors text-lg" placeholder="Quién eres" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-[#8a8279]">Correo</label>
                <input type="email" className="w-full bg-transparent border-b border-white/10 py-4 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors text-lg" placeholder="tu@correo.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[0.6rem] uppercase tracking-[0.3em] text-[#8a8279]">Mensaje</label>
                <textarea className="w-full bg-transparent border-b border-white/10 py-4 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors min-h-[120px] text-lg" placeholder="Cuéntanos qué necesitas..." />
              </div>
              <button className="w-full py-5 border border-[#c9a227] text-[#c9a227] text-[0.8rem] uppercase tracking-[0.4em] hover:bg-[#c9a227] hover:text-black transition-all duration-700 font-medium">
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
