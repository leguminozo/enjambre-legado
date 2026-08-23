import React from 'react';
import Link from 'next/link';
import { Bell, Flame, Droplets, Wind, ArrowRight, Leaf } from 'lucide-react';

import { countActiveNotificationCategories } from '@enjambre/auth/notification-preferences';
import { getNotificationPreferences } from '@/app/actions/notification-preferences';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';

export default async function AlertasFloracionPage() {
  const preferences = await getNotificationPreferences();
  const activeCategories = countActiveNotificationCategories(preferences);

  return (
    <div className="space-y-16 animate-in">
      <PerfilPageHeader
        icon={<Bell size={20} />}
        title="Alertas Floración"
        mission="Entérate primero cuando la naturaleza ofrece lo mejor — y actúa antes que nadie"
        action={
          <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent-text font-bold">
              {activeCategories} {activeCategories === 1 ? 'Categoría Activa' : 'Categorías Activas'}
            </span>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Bell size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Alertas en Tiempo Real</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Los sensores del bosque detectan floraciones, cambios de temperatura y eventos
              bioculturales. Sé el primero en reservar cuando hay disponibilidad limitada.
            </p>

            <div className="space-y-4 mb-12">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Flame size={16} className="text-accent" />
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-foreground font-bold">
                    Floración y Recolecciones
                  </span>
                  <span className={`ml-auto text-[0.6rem] font-mono px-2 py-0.5 rounded-full border ${preferences.floracion.email || preferences.floracion.in_app ? 'border-success/30 text-success bg-success/10' : 'border-border text-muted-foreground'}`}>
                    {preferences.floracion.email || preferences.floracion.in_app ? 'Canal Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Avisos inmediatos sobre floraciones de Ulmo, Tiaca y aperturas de reservas para lotes exclusivos.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Droplets size={16} className="text-accent" />
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-foreground font-bold">
                    Eventos Territoriales
                  </span>
                  <span className={`ml-auto text-[0.6rem] font-mono px-2 py-0.5 rounded-full border ${preferences.territorio.email || preferences.territorio.in_app ? 'border-success/30 text-success bg-success/10' : 'border-border text-muted-foreground'}`}>
                    {preferences.territorio.email || preferences.territorio.in_app ? 'Canal Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Monitoreo de condiciones climáticas en el bosque nativo y alertas fitosanitarias del archipiélago.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Wind size={16} className="text-accent" />
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-foreground font-bold">
                    Seguimiento de Despachos
                  </span>
                  <span className={`ml-auto text-[0.6rem] font-mono px-2 py-0.5 rounded-full border ${preferences.pedidos.email || preferences.pedidos.in_app ? 'border-success/30 text-success bg-success/10' : 'border-border text-muted-foreground'}`}>
                    {preferences.pedidos.email || preferences.pedidos.in_app ? 'Canal Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Confirmación de envasado, sellos de cera y número de seguimiento para tus encomiendas.
                </p>
              </div>
            </div>

            <Link
              href="/perfil/ajustes#notificaciones"
              className="inline-flex w-full md:w-auto items-center justify-center gap-3 px-12 py-7 text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl bg-primary text-primary-foreground hover:shadow-glow transition-all"
            >
              Gestionar Mis Canales <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
            <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent-text mb-6">
              Tipos de Alerta
            </h4>
            <ul className="space-y-5">
              <li className="flex gap-4">
                <Flame size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Floración</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Cuando las abejas detectan néctar nuevo.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Leaf size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Recolección Limitada</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Productos exclusivos con stock reducido.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Droplets size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Clima Bosque</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Condiciones que afectan producción.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <Wind size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground font-medium">Despacho</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    Estado de tus reservas y pedidos.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <Link
            href="/perfil/ajustes#notificaciones"
            className="p-8 rounded-3xl border border-border flex items-center gap-4 group cursor-pointer hover:bg-secondary/50 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <p className="text-[0.65rem] uppercase tracking-widest text-foreground mb-1">
                Notificación Instantánea
              </p>
              <p className="text-[0.6rem] text-muted-foreground">
                Configura email y alertas en la app desde tus ajustes.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}