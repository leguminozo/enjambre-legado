'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { CAMPO_NAV_ROUTES } from '@/lib/navigation/routes';

function CampoLanding() {
  return (
    <main className="min-h-dvh bg-background text-foreground selection:bg-primary selection:text-primary-foreground pb-24 font-sans">
      <section className="relative pt-24 sm:pt-32 pb-20 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] -z-10" />

        <p className="text-xs uppercase tracking-[0.4em] text-primary font-bold mb-6">
          Enjambre Legado · Terminal de Activación
        </p>

        <h1 className="text-5xl sm:text-6xl md:text-8xl font-display mb-8 max-w-5xl leading-[1.05] tracking-tight">
          Vanguardia en <br />
          <span className="italic text-primary">experiencia de marca</span>
        </h1>

        <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl font-light leading-relaxed">
          Transforma cada transacción en una conexión profunda. POS diseñado para ferias,
          pop-ups y eventos de lujo. Fidelización sin fricción mediante QR dinámico.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full justify-center max-w-lg mb-16">
          <Link
            href="/pos"
            className="inline-flex justify-center items-center gap-3 w-full sm:w-auto px-10 py-5 min-h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-2xl shadow-primary/20 transition-all"
          >
            Abrir POS
            <Zap className="w-5 h-5 fill-current" aria-hidden />
          </Link>
          <Link
            href="/pos/catalogo"
            className="inline-flex justify-center items-center w-full sm:w-auto px-8 py-5 min-h-11 rounded-full border border-border bg-card/50 text-muted-foreground font-medium hover:bg-card transition-all"
          >
            Ver Catálogo
          </Link>
        </div>

        {/* Grafo de herramientas del rep — misma fuente que sidebar/bottom nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-6xl text-left">
          {CAMPO_NAV_ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className="group bg-card/40 backdrop-blur-xl p-6 rounded-2xl border border-border/50 shadow-lg hover:border-primary/30 transition-all min-h-11"
              >
                <Icon
                  className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform"
                  aria-hidden
                />
                <h2 className="font-display text-lg mb-1 text-foreground">{route.label}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  {route.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default CampoLanding;
