import React from 'react';
import { Users, ArrowRight, Share2, Heart } from 'lucide-react';

export default function CircularColmenaPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Users size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Circular Colmena</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Invita guardianes, fortalece la red, gana miel y crédito biocultural</p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">3 Invitaciones Activas</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Share2 size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Tu Enlace de Invitación</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Cada guardián que se una mediante tu enlace fortalece la colmena.
              Por cada 3 compras completadas de tus referidos, recibes 250g de miel de regalo.
            </p>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border mb-10">
              <code className="text-xs text-accent font-mono flex-1 truncate">enjambrelegado.cl/inv/guardian-abc123</code>
              <button className="px-4 py-2 bg-accent text-accent-foreground text-[0.6rem] uppercase tracking-[0.2em] font-bold rounded-lg hover:shadow-glow transition-all">
                Copiar
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Invitados Activos</span>
                <span className="text-xl font-display text-foreground">7</span>
              </div>
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Compras Referidas</span>
                <span className="text-xl font-display text-accent">12</span>
              </div>
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Miel Ganada</span>
                <span className="text-xl font-display text-foreground">1.0 kg</span>
              </div>
            </div>

            <button className="w-full md:w-auto px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-3">
              Compartir Mi Enlace <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-6 text-accent">
              <Heart size={18} />
              <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Cómo Funciona</h4>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">1</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Comparte tu enlace personal con futuros guardianes.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">2</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Ellos reciben 10% de descuento en su primera compra.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">3</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Cada 3 compras referidas, ganas 250g de miel premium.</p>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">Efecto Colmena</p>
              <p className="text-[0.6rem] text-muted-foreground">Cada referido amplifica tu impacto de regeneración.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
