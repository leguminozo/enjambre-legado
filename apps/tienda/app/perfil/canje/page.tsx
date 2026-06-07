import React from 'react';
import { Gem, ArrowRight, Star, Flame } from 'lucide-react';

export default function CanjeImpactoPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Gem size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Canje Impacto</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Transforma tu impacto biocultural en recompensas tangibles</p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">2,450 Puntos Disponibles</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Gem size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Catálogo de Canje</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Cada compra en Enjambre Legado acumula puntos de impacto.
              Cada m² regenerado, cada kg de CO2 compensado, cada referido exitoso suma.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={16} className="text-accent" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">500 pts</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-2">Miel de Bosque 250g</h4>
                <p className="text-xs text-muted-foreground">Blend exclusivo de temporada, solo por canje.</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <Flame size={16} className="text-accent" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">1,200 pts</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-2">Visita Apiario</h4>
                <p className="text-xs text-muted-foreground">Experiencia presencial en el bosque con los apicultores.</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <Gem size={16} className="text-accent" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">2,000 pts</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-2">Adopta una Colmena</h4>
                <p className="text-xs text-muted-foreground">Una colmena bajo tu nombre por una temporada completa.</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={16} className="text-accent" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">800 pts</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-2">Crédito Tienda $15.000</h4>
                <p className="text-xs text-muted-foreground">Saldo aplicable a cualquier producto del catálogo.</p>
              </div>
            </div>

            <button className="w-full md:w-auto px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-3">
              Ver Catálogo Completo <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent mb-6">Cómo Acumular</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">10 pts por cada $1.000 en compras.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">50 pts por cada referido que compra.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">100 pts al activar el Ritual Mensual.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">25 pts por reseña de producto.</p>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Gem size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">Los Puntos No Expiran</p>
              <p className="text-[0.6rem] text-muted-foreground">Tu impacto es permanente, tus recompensas también.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
