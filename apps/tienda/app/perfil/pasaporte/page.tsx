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
  peso_kg: z.number().nullable().default(null),
  apiarios: ApiarioSchema.nullable().default(null),
});

export default async function PasaportePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subConfig } = await supabase
    .from('suscriptor_config')
    .select('*, colmenas(*, apiarios(*))')
    .eq('user_id', user?.id)
    .single();

  const hiveRaw = subConfig?.colmenas;
  const hiveParsed = ColmenaSchema.safeParse(hiveRaw);
  const hive = hiveParsed.success ? hiveParsed.data : null;

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
    ? `Las abejas de ${hive.name || 'esta colmena'} registran actividad de pecoreo orientada a la floración de ${hive.floracion}. Monitoreo biocultural continuo.`
    : `Colmena ${hive?.name ?? ''} activa en el ecosistema nativo de Chiloé. Monitoreo biocultural y sanitario al día.`;

  return (
    <div className="space-y-16 animate-in">
      <PerfilPageHeader
        icon={<Compass size={20} />}
        title="Pasaporte de Colmena"
        mission="Trazabilidad profunda de tu vínculo con el ecosistema"
      />

      {!hive ? (
        <div className="p-12 rounded-3xl bg-secondary/50 border border-border text-center">
          <p className="text-muted-foreground font-display italic text-lg mb-8">
            Aún no has vinculado tu legado a una colmena específica.
          </p>
          <Link
            href="/club-cosecha"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:scale-105 transition-all"
          >
            Explorar Suscripciones
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-12">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={120} className="text-accent" />
              </div>

              <div className="relative z-10">
                <span className="text-[0.6rem] uppercase tracking-[0.4em] text-accent-text mb-8 block">Estado Vital</span>
                <h3 className="font-display text-5xl text-foreground mb-4">{hive.name ?? ''}</h3>
                <div className="flex items-center gap-4 text-muted-foreground mb-8">
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
      )}
    </div>
  );
}
