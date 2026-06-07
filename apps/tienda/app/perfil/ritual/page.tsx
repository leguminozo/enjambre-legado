import React from 'react';
import { Repeat, Crown, Gift, ArrowRight, Sparkles } from 'lucide-react';

export default function RitualMensualPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Repeat size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Ritual Mensual</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Tu compromiso recurrente con el bosque — y sus recompensas exclusivas</p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">Próximo Ritual: 15 Julio</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Crown size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Elige tu Frequencia Ritual</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Cada ciclo lunar, recibes una selección curada de miel y productos bioculturales
              directamente del bosque. Tu suscripción finanza la regeneración continua del ecosistema.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer group/card">
                <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Mensajero</span>
                <span className="block text-xl font-display text-foreground mt-2">$29.990<span className="text-[0.6rem] text-muted-foreground italic">/mes</span></span>
                <p className="text-xs text-muted-foreground mt-3">500g miel + 1 producto estacional</p>
              </div>
              <div className="p-6 rounded-2xl bg-accent/5 border border-accent/30 cursor-pointer ring-1 ring-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">Guardián</span>
                  <Sparkles size={12} className="text-accent" />
                </div>
                <span className="block text-xl font-display text-foreground">$54.990<span className="text-[0.6rem] text-muted-foreground italic">/mes</span></span>
                <p className="text-xs text-muted-foreground mt-3">1kg miel + 2 productos + envío gratis</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Protector</span>
                <span className="block text-xl font-display text-foreground">$89.990<span className="text-[0.6rem] text-muted-foreground italic">/mes</span></span>
                <p className="text-xs text-muted-foreground mt-3">2kg miel + 3 productos + acceso colmena</p>
              </div>
            </div>

            <button className="w-full md:w-auto px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-3">
              Activar Mi Ritual <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-3 mb-6 text-accent">
              <Gift size={18} />
              <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Beneficios Exclusivos</h4>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">Acceso prioritario a reservas de cosecha limitada.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">Descuento del 15% en toda la tienda.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">Certificado de regeneración mensual con tu impacto.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">Producto sorpresa de temporada en cada envío.</p>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Repeat size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">Sin Compromiso</p>
              <p className="text-[0.6rem] text-muted-foreground">Pausa o cancela tu ritual en cualquier momento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
