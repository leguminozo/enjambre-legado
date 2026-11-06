import React from 'react';
import Link from 'next/link';
import { Compass, MapPin, Zap, Activity } from 'lucide-react';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';

export const revalidate = 3600;

export const metadata = {
  title: 'Pasaporte de Colmena — Demostración Agéntica',
  description:
    'Visualización interactiva del pasaporte de colmena con telemetría de muestra en Chiloé.',
};

export default function DemoPasaportePage() {
  const hive = {
    name: 'Colmena Centinela #04 — Bosque Nativo',
    health: 'optimal',
    notes:
      'Colmena centinela ubicada en el dosel de Ulmos antiguos. Actividad óptima con pecoreo constante hacia néctar de flora nativa y producción de cera virgen.',
    floracion: 'Ulmo y Tiaca',
    production_total: 28.5,
    peso_kg: 28.5,
    apiarios: {
      name: 'Bosque Nativo de Chiloé',
      details: 'Sector Cordillera de Piuchén, Chiloé',
      lat: -42.88,
      lng: -73.75,
    },
  };

  const sectorName = hive.apiarios.name || hive.apiarios.details;
  const isHealthy = true;
  const coordsText = `${sectorName} · Lat ${hive.apiarios.lat.toFixed(2)} · Lon ${hive.apiarios.lng.toFixed(2)}`;
  const bitacoraText = hive.notes;

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <PerfilPageHeader
        icon={<Compass size={20} />}
        title="Pasaporte de Colmena"
        mission="Trazabilidad profunda de tu vínculo con el ecosistema"
        action={
          <span className="text-[0.65rem] font-mono px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-text uppercase font-bold">
            Vista Demostración Centinela
          </span>
        }
      />

      <div className="p-8 sm:p-10 rounded-3xl bg-secondary/50 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="font-display text-xl sm:text-2xl text-foreground font-semibold">
            Colmena Centinela de Demostración
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Como miembro del <strong>Club Legado del Bosque</strong>, al activar una suscripción de reposición o adopción de colmena, se vincula tu propia colmena con monitoreo de salud, pecoreo de flora nativa y despacho prioritario de tu recolección de temporada.
          </p>
        </div>
        <Link
          href="/club-legado-del-bosque"
          className="px-8 py-4 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
        >
          Conocer Club Legado
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={120} className="text-accent" />
            </div>

            <div className="relative z-10">
              <span className="text-[0.6rem] uppercase tracking-[0.4em] text-accent-text mb-8 block">
                Estado Vital
              </span>
              <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4 font-light">
                {hive.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-accent" />
                  <span className="text-xs uppercase tracking-widest">{sectorName}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-accent" />
                  <span className="text-xs uppercase tracking-widest">
                    {isHealthy ? 'Ritmo Estable' : 'En Observación'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    Peso Estimado
                  </span>
                  <span className="text-3xl font-display text-foreground">
                    {String(hive.peso_kg)}{' '}
                    <span className="text-sm italic text-muted-foreground">kg</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    Último Reporte
                  </span>
                  <span className="text-3xl font-display text-foreground">Hoy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border bg-secondary/30">
            <h4 className="text-[0.7rem] uppercase tracking-[0.3em] text-accent-text mb-6">
              Bitácora del Apiario
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed italic font-display">
              &ldquo;{bitacoraText}&rdquo;
            </p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="aspect-square rounded-3xl bg-card border border-border overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-secondary/30 flex items-center justify-center">
              <div className="text-center">
                <Compass size={40} className="text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                  Coordenadas Protegidas
                </p>
              </div>
            </div>
            <div className="absolute bottom-8 left-8 right-8 p-4 bg-background/60 backdrop-blur-md rounded-2xl border border-border">
              <p className="text-[0.6rem] text-foreground leading-relaxed uppercase tracking-widest">
                {coordsText}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/catalogo"
              className="flex-1 py-4 border border-border rounded-xl text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all"
            >
              Explorar Catálogo
            </Link>
            <Link
              href="/galeria"
              className="flex-1 py-4 border border-border rounded-xl text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all"
            >
              Galería Territorial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
