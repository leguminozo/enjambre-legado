import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Compass, MapPin, Zap, Activity } from 'lucide-react';

export default async function PasaportePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subConfig } = await supabase
    .from('suscriptor_config')
    .select('*, colmenas(*)')
    .eq('user_id', user?.id)
    .single();

  const hive = subConfig?.colmenas as Record<string, unknown> | null;

  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Compass size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Pasaporte de Colmena</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">Trazabilidad profunda de tu vínculo con el ecosistema</p>
      </div>

      {!hive ? (
        <div className="p-12 rounded-3xl bg-secondary/50 border border-border text-center">
          <p className="text-muted-foreground font-display italic text-lg mb-8">
            Aún no has vinculado tu legado a una colmena específica.
          </p>
          <button className="px-8 py-4 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.3em] font-bold rounded-xl hover:scale-105 transition-all">
            Explorar Suscripciones
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-12">
            <div className="p-8 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap size={120} className="text-accent" />
              </div>

              <div className="relative z-10">
                <span className="text-[0.6rem] uppercase tracking-[0.4em] text-accent mb-8 block">Estado Vital</span>
                <h3 className="font-display text-5xl text-foreground mb-4">{String(hive.name ?? '')}</h3>
                <div className="flex items-center gap-4 text-muted-foreground mb-8">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-accent" />
                    <span className="text-xs uppercase tracking-widest">Sector Pureo</span>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-accent" />
                    <span className="text-xs uppercase tracking-widest">{hive.estado === 'optima' ? 'Ritmo Estable' : 'En Observación'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Peso Estimado</span>
                    <span className="text-3xl font-display text-foreground">{hive.peso_kg ? String(hive.peso_kg) : '--'} <span className="text-sm italic text-muted-foreground">kg</span></span>
                  </div>
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-1">Último Reporte</span>
                    <span className="text-3xl font-display text-foreground">Hoy</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-border bg-secondary/30">
              <h4 className="text-[0.7rem] uppercase tracking-[0.3em] text-accent mb-6">Bitácora Biocultural</h4>
              <p className="text-sm text-muted-foreground leading-relaxed italic font-display">
                "Las abejas de {String(hive.name ?? '')} han mostrado una actividad excepcional durante la floración del Ulmo.
                La humedad relativa en el Sector Pureo ha favorecido una néctar de alta densidad que será
                cosechado en el próximo ciclo ritual."
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
                  Pureo Central · Lat -42.612 · Lon -73.841
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-4 border border-border rounded-xl text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all">
                Ver Certificado
              </button>
              <button className="flex-1 py-4 border border-border rounded-xl text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:border-accent/30 transition-all">
                Galería Histórica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
