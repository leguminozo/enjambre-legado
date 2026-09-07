import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { Compass, MapPin, Zap, Activity } from 'lucide-react';
import { z } from 'zod';
import { PerfilPageHeader } from '@/components/perfil/perfil-page-header';

const ApiarioSchema = z.object({
  name: z.string().nullable().default(null),
  details: z.string().nullable().default(null),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
});

const ColmenaSchema = z.object({
  name: z.string().nullable().default(null),
  health: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  floracion: z.string().nullable().default(null),
  production_total: z.number().nullable().default(null),
  apiarios: ApiarioSchema.nullable().default(null),
}).transform(data => ({
  ...data,
  peso_kg: data.production_total
}));

export default async function PasaportePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subConfig } = await supabase
    .from('suscriptor_config')
    .select('*, colmenas(*, apiarios(*))')
    .eq('user_id', user?.id)
    .maybeSingle();

  const hiveRaw = subConfig?.colmenas;
  const hiveParsed = ColmenaSchema.safeParse(hiveRaw);
  const isLinked = hiveParsed.success && hiveParsed.data;

  // Si no tiene colmena vinculada, usamos la Colmena Centinela de demostración
  const hive = isLinked
    ? hiveParsed.data
    : {
        name: 'Colmena Centinela #04 — Bosque Nativo',
        health: 'optimal',
        notes: 'Colmena centinela ubicada en el dosel de Ulmos antiguos. Actividad óptima con pecoreo constante hacia néctar de flora nativa y producción de cera virgen.',
        floracion: 'Ulmo y Tiaca',
        production_total: 28.5,
        peso_kg: 28.5,
        apiarios: {
          name: 'Apiario Pureo',
          details: 'Sector Cordillera de Piuchén, Chiloé',
          lat: -42.88,
          lng: -73.75,
        },
      };

  const sectorName =
    hive?.apiarios?.name || hive?.apiarios?.details || 'Archipiélago de Chiloé';
  const isHealthy =
    hive?.health === 'optimal' || hive?.health === 'optima';
  const coordsText =
    hive?.apiarios?.lat != null && hive?.apiarios?.lng != null
      ? `${sectorName} · Lat ${hive.apiarios.lat.toFixed(2)} · Lon ${hive.apiarios.lng.toFixed(2)}`
      : 'Ubicación Protegida · Archipiélago de Chiloé';

  const bitacoraText = hive?.notes
    ? hive.notes
    : hive?.floracion
    ? `Las abejas de ${hive.name || 'esta colmena'} registran actividad de pecoreo orientada a la floración de ${hive.floracion}. Monitoreo técnico de colmena continuo.`
    : `Colmena ${hive?.name ?? ''} activa en el ecosistema nativo de Chiloé. Monitoreo técnico y sanitario al día.`;

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <PerfilPageHeader
        icon={<Compass size={20} />}
        title="Pasaporte de Colmena"
        mission="Trazabilidad profunda de tu vínculo con el ecosistema"
        action={
          !isLinked ? (
            <span className="text-[0.65rem] font-mono px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-text uppercase font-bold">
              Vista Demostración Centinela
            </span>
          ) : undefined
        }
      />

      {!isLinked && (
        <div className="p-8 sm:p-10 rounded-3xl bg-secondary/50 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display text-xl sm:text-2xl text-foreground font-semibold">
              Estás viendo una Colmena Centinela de muestra
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Al unirte al <strong>Club Legado del Bosque</strong>, se te asignará tu propia colmena custodiada con sello de trazabilidad, fotos satelitales y despacho de tu recolección con firma de lote.
            </p>
          </div>
          <Link
            href="/club-legado-del-bosque"
            className="px-8 py-4 bg-primary text-primary-foreground text-xs uppercase tracking-[0.25em] font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
          >
            Vincular Mi Propia Colmena
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={120} className="text-accent" />
            </div>

            <div className="relative z-10">
              <span className="text-[0.6rem] uppercase tracking-[0.4em] text-accent-text mb-8 block">Estado Vital</span>
              <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4 font-light">{hive.name ?? ''}</h3>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-accent" />
                  <span className="text-xs uppercase tracking-widest">{sectorName}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-accent" />
                  <span className="text-xs uppercase tracking-widest">{isHealthy ? 'Ritmo Estable' : 'En Observación'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Peso Estimado</span>
                  <span className="text-3xl font-display text-foreground">{hive.peso_kg != null ? String(hive.peso_kg) : '--'} <span className="text-sm italic text-muted-foreground">kg</span></span>
                </div>
                <div>
                  <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Último Reporte</span>
                  <span className="text-3xl font-display text-foreground">Hoy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border bg-secondary/30">
            <h4 className="text-[0.7rem] uppercase tracking-[0.3em] text-accent-text mb-6">Bitácora Biocultural</h4>
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
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">Coordenadas Protegidas</p>
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
              href="/perfil/trazabilidad"
              className="flex-1 py-4 border border-border rounded-xl text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all"
            >
              Ver Certificado
            </Link>
            <Link
              href="/galeria"
              className="flex-1 py-4 border border-border rounded-xl text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all"
            >
              Galería Histórica
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
