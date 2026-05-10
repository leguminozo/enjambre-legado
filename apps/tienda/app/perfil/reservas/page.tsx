import React from 'react';
import { Calendar, Leaf, ArrowRight, Info } from 'lucide-react';

export default function ReservasPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Calendar size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Reserva de Cosecha</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Asegura tu parte del legado antes de que la naturaleza lo entregue</p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">Temporada 2026 Abierta</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Leaf size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Miel de Ulmo Virgen · Batch #2026-A</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Este batch proviene exclusivamente del Sector Pureo, con una floración de Ulmo tardía que promete
              notas cremosas y una pureza del 98%. Al reservar hoy, financias directamente el mantenimiento
              biocultural de las colmenas durante el invierno.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Entrega Estimada</span>
                <span className="text-xl font-display text-foreground">Julio 2026</span>
              </div>
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Cupos Disponibles</span>
                <span className="text-xl font-display text-accent">42 / 100</span>
              </div>
              <div>
                <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Valor Reserva</span>
                <span className="text-xl font-display text-foreground">$12.000 <span className="text-[0.6rem] text-muted-foreground italic">/ kg</span></span>
              </div>
            </div>

            <button className="w-full md:w-auto px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-3">
              Garantizar Mi Cupo <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-6 text-accent">
              <Info size={18} />
              <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Cómo funciona</h4>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">1</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Pagas el valor de reserva ahora para asegurar tu batch.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">2</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Monitoreas el progreso de la floración desde tu Pasaporte.</p>
              </li>
              <li className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[0.6rem] text-accent shrink-0">3</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Liquidamos el saldo restante 15 días antes del despacho.</p>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Leaf size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">Impacto Indirecto</p>
              <p className="text-[0.6rem] text-muted-foreground">Esta reserva protege 15m² adicionales de bosque.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
