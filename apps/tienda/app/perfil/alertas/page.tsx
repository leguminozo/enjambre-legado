import React from 'react';
import Link from 'next/link';
import { Bell, Flame, Droplets, Wind, ArrowRight, Leaf, Sparkles, Calendar, Compass, ShieldCheck } from 'lucide-react';

import { countActiveNotificationCategories } from '@enjambre/auth/notification-preferences';
import { getNotificationPreferences } from '@/app/actions/notification-preferences';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';
import { createClient } from '@/utils/supabase/server';

interface AlertaFloracionQueryResult {
  id: string;
  fecha_predicha: string;
  estado: string;
  gdd_calculado: number | null;
  especies_fenologicas?: {
    nombre_comun?: string | null;
    nombre_cientifico?: string | null;
    familia?: string | null;
  } | null;
}

export default async function AlertasFloracionPage() {
  const preferences = await getNotificationPreferences();
  const activeCategories = countActiveNotificationCategories(preferences);

  const supabase = await createClient();
  const { data: alertasDb } = await supabase
    .from('alertas_floracion')
    .select('*, especies_fenologicas(nombre_comun, nombre_cientifico, familia)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fallbacks fenológicos del bosque nativo si aún no se calibran alertas automáticas
  const liveAlerts = (alertasDb && alertasDb.length > 0)
    ? alertasDb.map((a: AlertaFloracionQueryResult) => ({
        id: a.id,
        especie: a.especies_fenologicas?.nombre_comun || 'Floración Nativa',
        cientifico: a.especies_fenologicas?.nombre_cientifico || 'Ecosistema Chiloé',
        fecha: new Date(a.fecha_predicha).toLocaleDateString('es-CL', { month: 'long', day: 'numeric', year: 'numeric' }),
        estado: a.estado,
        gdd: a.gdd_calculado ? `${Math.round(a.gdd_calculado)} GDD` : 'GDD Óptimo',
        zona: 'Archipiélago de Chiloé',
      }))
    : [
        {
          id: '1',
          especie: 'Ulmo de Altura (Eucryphia cordifolia)',
          cientifico: 'Eucryphia cordifolia',
          fecha: 'Febrero – Marzo 2027',
          estado: 'activo',
          gdd: '450 GDD acumulados',
          zona: 'Apiario Pureo / Cordillera de Piuchén',
        },
        {
          id: '2',
          especie: 'Tiaca Nativa (Caldcluvia paniculata)',
          cientifico: 'Caldcluvia paniculata',
          fecha: 'Diciembre 2026 – Enero 2027',
          estado: 'activo',
          gdd: '320 GDD acumulados',
          zona: 'Apiario Notuco / Chonchi',
        },
        {
          id: '3',
          especie: 'Avellano Chileno (Gevuina avellana)',
          cientifico: 'Gevuina avellana',
          fecha: 'Noviembre 2026',
          estado: 'proximo',
          gdd: '210 GDD acumulados',
          zona: 'Apiario Compu / Quellón',
        },
      ];

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
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

      {/* Feed en Vivo de Floración */}
      <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <span className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-accent-text block mb-1">
              Monitoreo Biocultural en Tiempo Real
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground font-light">
              Ventanas de Floración y Cosecha
            </h2>
          </div>
          <Link
            href="/perfil/reservas"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0"
          >
            <Sparkles size={14} /> Ir a Reserva Anual
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {liveAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-6 rounded-2xl bg-secondary/40 border border-border/80 hover:border-accent/40 transition-colors space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-text uppercase font-bold tracking-wider">
                    {alert.gdd}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} /> {alert.fecha}
                  </span>
                </div>
                <h4 className="font-display text-lg text-foreground font-semibold pt-1">
                  {alert.especie}
                </h4>
                <p className="text-xs text-muted-foreground italic">{alert.cientifico}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                  <Compass size={13} className="text-accent" />
                  <span>{alert.zona}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                  <ShieldCheck size={13} /> Monitoreo Activo
                </span>
                <Link
                  href="/perfil/reservas"
                  className="text-xs font-bold text-accent-text hover:underline flex items-center gap-1"
                >
                  Reservar <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Bell size={200} className="text-accent" />
          </div>

          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Tus Canales de Notificación</h3>
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