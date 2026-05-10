import React from 'react';
import { Settings, User, Mail, Shield, Bell } from 'lucide-react';

export default function AjustesPage() {
  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Settings size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Ajustes Guardián</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">Gestiona tu identidad y coordenadas en el ecosistema</p>
      </div>

      <div className="max-w-2xl space-y-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 text-accent">
            <User size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Identidad Pública</h3>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: Gabriel Miranda"
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">Correo Electrónico</label>
              <input
                type="email"
                disabled
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-muted-foreground cursor-not-allowed"
                placeholder="guardian@bosque.cl"
              />
            </div>
          </div>
        </section>

        <section className="space-y-8 border-t border-border pt-12">
          <div className="flex items-center gap-3 text-accent">
            <Bell size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Comunicaciones del Bosque</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-secondary/50 border border-border rounded-2xl">
              <div>
                <p className="text-sm text-foreground mb-1">Avisos de Floración</p>
                <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">Recibe alertas sobre el estado de tu colmena</p>
              </div>
              <div className="w-10 h-5 bg-accent rounded-full relative">
                <div className="absolute top-1 right-1 w-3 h-3 bg-foreground rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-secondary/50 border border-border rounded-2xl">
              <div>
                <p className="text-sm text-foreground mb-1">Ritual de Cosecha</p>
                <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest">Aviso prioritario para reservas de lotes</p>
              </div>
              <div className="w-10 h-5 bg-accent rounded-full relative">
                <div className="absolute top-1 right-1 w-3 h-3 bg-foreground rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <button className="px-10 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all">
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
