import React from 'react';
import { Bell, Flame, Droplets, Wind, ArrowRight, Leaf } from 'lucide-react';
import { toast, Button } from '@enjambre/ui';

export default function AlertasFloracionPage() {
  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Bell size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Alertas Floración</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Entérate primero cuando la naturaleza ofrece lo mejor — y actúa antes que nadie</p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">2 Alertas Activas</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Bell size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Alertas en Tiempo Real</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Los sensores del bosque detectan floraciones, cambios de temperatura y eventos bioculturales.
              Sé el primero en reservar cuando hay disponibilidad limitada.
            </p>

            <div className="space-y-4 mb-12">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-accent/20">
                <div className="flex items-center gap-3 mb-3">
                  <Flame size={16} className="text-accent" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">Floración Activa</span>
                  <span className="ml-auto text-[0.5rem] text-muted-foreground">Hace 2h</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-1">Ulmo en Sector Pureo</h4>
                <p className="text-xs text-muted-foreground">Temperatura 18°C, néctar estimado alto. Ventana de 48h para reservar batch exclusivo.</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Droplets size={16} className="text-muted-foreground" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-bold">Condiciones</span>
                  <span className="ml-auto text-[0.5rem] text-muted-foreground">Hace 6h</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-1">Lluvia en Bosque Nativo</h4>
                <p className="text-xs text-muted-foreground">Precipitación moderada detectada. Posible floración de Tiaca en 5-7 días.</p>
              </div>
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Wind size={16} className="text-muted-foreground" />
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-bold">Cosecha</span>
                  <span className="ml-auto text-[0.5rem] text-muted-foreground">Hace 1d</span>
                </div>
                <h4 className="font-display text-lg text-foreground mb-1">Batch #2026-A Listo</h4>
                <p className="text-xs text-muted-foreground">Tu reserva del batch de Ulmo está lista para despacho. Confirma tu dirección.</p>
              </div>
            </div>

            <Button
              onClick={() => {
                toast('Preferencias actualizadas. Recibirás alertas de floración y despachos en tiempo real.', { type: 'success', duration: 6000 });
              }}
              className="w-full md:w-auto px-12 py-7 text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-3"
              size="lg"
            >
              Configurar Mis Alertas <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent mb-6">Tipos de Alerta</h4>
            <ul className="space-y-5">
              <li className="flex gap-4">
                <Flame size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Floración</p>
                  <p className="text-[0.6rem] text-muted-foreground">Cuando las abejas detectan néctar nuevo.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Leaf size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Cosecha Limitada</p>
                  <p className="text-[0.6rem] text-muted-foreground">Productos exclusivos con stock reducido.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Droplets size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Clima Bosque</p>
                  <p className="text-[0.6rem] text-muted-foreground">Condiciones que afectan producción.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Wind size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Despacho</p>
                  <p className="text-[0.6rem] text-muted-foreground">Estado de tus reservas y pedidos.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">Notificación Instantánea</p>
              <p className="text-[0.6rem] text-muted-foreground">Recibe alertas por email y push sin demora.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
