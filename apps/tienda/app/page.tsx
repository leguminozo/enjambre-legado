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

const COLECCIONES_DOBLE = [
  {
    kicker: 'Sachets',
    title: 'Gotas de néctar',
    desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.',
    href: '/catalogo',
  },
  {
    kicker: 'Frascos medios',
    title: 'Tesoros del colmenar',
    desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.',
    href: '/catalogo',
  },
] as const;

export default function TiendaLanding() {
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
    const sections = ['#collections', '#services', '#workshops', '#inquiry'];
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

        {/* COLLECTIONS (Preserved Backend Logic) */}
        <section id="collections" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Colecciones</span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8]">Extractos del Territorio</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            {COLECCIONES_DOBLE.map((c) => (
              <Link key={c.title} href={c.href} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-[#141210]">
                  <ImagePlaceholder ratio="portrait" label={c.title} className="grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#c9a227] mb-2">{c.kicker}</p>
                    <h3 className="font-display text-2xl font-light group-hover:text-[#c9a227] transition-colors">{c.title}</h3>
                    <p className="mt-2 text-sm text-[#8a8279] max-w-xs">{c.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="services" className="py-32 bg-[#0c0c0c] border-y border-white/5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-20">
              <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Servicios</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8]">Membranas de colaboración</h2>
            </div>

            <div className="divide-y divide-white/5">
              {[
                { num: '01', title: 'Distribución Mayorista', desc: 'Suministro directo para hoteles, restaurantes y selectos comercios. Volumen mínimo 50kg.' },
                { num: '02', title: 'Envasado Privado', desc: 'Etiquetado personalizado para eventos corporativos, matrimonios y regalos de alto standing.' },
                { num: '03', title: 'Exportación Selectiva', desc: 'Logística especializada para mercados de alto valor en Asia y Europa. Certificaciones sanitarias incluidas.' },
                { num: '04', title: 'Consultoría Apícola', desc: 'Asesoría técnica para nuevos apicultores y optimización de colmenares existentes en zonas húmedas.' }
              ].map((s) => (
                <div key={s.num} className="group py-10 flex flex-col md:flex-row md:items-center gap-8 hover:bg-[#141210]/50 transition-all px-4 -mx-4">
                  <span className="font-display italic text-[#c9a227] text-xl">{s.num}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-light mb-2 group-hover:translate-x-3 transition-transform">{s.title}</h3>
                    <p className="text-sm text-[#8a8279] max-w-md">{s.desc}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#c9a227] group-hover:border-[#c9a227] group-hover:text-black transition-all group-hover:-rotate-45">
                    <ArrowRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TALLERES */}
        <section id="workshops" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Talleres</span>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8]">Iniciaciones</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { date: 'Próxima fecha — Junio 2026', title: 'La Arquitectura de la Colmena', desc: 'Tres días de inmersión en el bosque de Chiloé. Aprendizaje práctico sobre el manejo respetuoso de la abeja nativa y la extracción artesanal.', action: 'Solicitar cupo' },
              { date: 'Bimensual', title: 'Cata de Mieles Oscuras', desc: 'Sesiones sensoriales guiadas para identificar notas, texturas y orígenes botánicos. Desarrollo del paladar para mieles monoflorales.', action: 'Inscribirse' },
              { date: 'A demanda', title: 'Medicina del Panal', desc: 'Elaboración de ungüentos, tinturas y remedios tradicionales a partir de productos de la colmena. Enfoque en autosuficiencia.', action: 'Consultar' }
            ].map((w) => (
              <div key={w.title} className="relative bg-[#0c0c0c] border border-white/5 p-10 group hover:-translate-y-2 transition-transform overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#c9a227] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                <span className="text-[0.6rem] tracking-[0.3em] uppercase text-[#c9a227] mb-6 block">{w.date}</span>
                <h3 className="font-display text-2xl font-light mb-4 leading-tight">{w.title}</h3>
                <p className="text-sm text-[#8a8279] mb-10 leading-relaxed">{w.desc}</p>
                <Link href="/catalogo" className="inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.2em] text-[#f5f0e8] hover:text-[#c9a227] transition-colors">
                  {w.action} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* CONSULTA */}
        <section id="inquiry" className="py-32 bg-[#0c0c0c] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-20">
            <div>
              <span className="text-[0.7rem] tracking-[0.4em] uppercase text-[#c9a227] mb-4 block">Consulta</span>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#f5f0e8] mb-8 leading-tight">Establecer contacto</h2>
              <p className="text-[#8a8279] mb-12 leading-relaxed">
                Para pedidos, alianzas comerciales o simplemente conversar sobre la textura de una buena miel, escríbenos. Respondemos con la paciencia del panal.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-sm"><Mail size={20} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-1">Correo</span>
                    <a href="mailto:hola@obrerayzangano.com" className="text-[#f5f0e8] hover:text-[#c9a227] transition-colors underline underline-offset-8 decoration-white/10">hola@obrerayzangano.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-sm"><MapPin size={20} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-1">Origen</span>
                    <span className="text-[#f5f0e8]">Chiloé, Chile</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-sm"><Globe size={20} className="text-[#c9a227]" /></div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] mb-1">Distribución</span>
                    <span className="text-[#f5f0e8]">Santiago — Dubai — Próximamente</span>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-8 bg-[#141210] p-10 border border-white/5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1">
                <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">Nombre</label>
                <input type="text" className="w-full bg-transparent border-b border-white/10 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors" placeholder="Quién eres" />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">Correo</label>
                <input type="email" className="w-full bg-transparent border-b border-white/10 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors" placeholder="tu@correo.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">Mensaje</label>
                <textarea className="w-full bg-transparent border-b border-white/10 py-3 text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors min-h-[100px]" placeholder="Cuéntanos qué necesitas..." />
              </div>
              <button className="w-full py-4 border border-[#c9a227] text-[#c9a227] text-[0.7rem] uppercase tracking-[0.3em] hover:bg-[#c9a227] hover:text-black transition-all duration-500">
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
