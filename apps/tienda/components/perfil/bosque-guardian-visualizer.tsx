'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TreePine, MapPin, ShieldCheck, Compass, ArrowRight, ExternalLink } from 'lucide-react';

interface BosqueGuardianVisualizerProps {
  bosqueM2: number;
  arbolesPlantados: number;
  co2EvitadoKg: number;
  especiesArboles?: string[];
  comunaReferencial?: string;
}

export function BosqueGuardianVisualizer({
  bosqueM2,
  arbolesPlantados,
  co2EvitadoKg,
  especiesArboles = ['Ulmo (Eucryphia cordifolia)', 'Tiaca (Caldcluvia paniculata)', 'Coigüe de Chiloé (Nothofagus nitida)'],
  comunaReferencial = 'Quemchi, Archipiélago de Chiloé',
}: BosqueGuardianVisualizerProps) {
  const [selectedTree, setSelectedTree] = useState<string | null>(null);

  // Cada m² de bosque templado lluvioso protegido alberga aprox 25 visitas de pecoreo por temporada
  const abejasSustentadas = Math.max(120, Math.round(bosqueM2 * 25));
  const displayM2 = Math.max(15, bosqueM2);
  const displayArboles = Math.max(1, arbolesPlantados);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card/80 to-surface-sunken/40 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-[0.25em] text-primary font-bold mb-1">
            <TreePine size={13} />
            <span>Santuario Territorial · Predio Pureo</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl text-foreground font-light">
            Tu Huella en el Bosque Nativo
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
            Cada recolección de miel y suscripción al Club Legado salvaguarda una superficie medible de selva valdiviana en Chiloé, protegiendo las colmenas sin trashumancia.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface-raised text-xs text-muted-foreground self-start sm:self-center">
          <MapPin size={13} className="text-primary" />
          <span className="font-mono text-[11px]">{comunaReferencial}</span>
        </div>
      </div>

      {/* Métricas Territoriales Destacadas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/60 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Bosque Protegido
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {displayM2} <span className="text-sm font-sans font-normal text-muted-foreground">m²</span>
          </p>
          <p className="text-[10px] text-primary/90 font-mono">Dosel Siempreverde</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/60 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Árboles Nativos
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {displayArboles}
          </p>
          <p className="text-[10px] text-primary/90 font-mono">Financiados en Terreno</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/60 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            Visitas de Pecoreo
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {abejasSustentadas.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400/90 font-mono">Abeja Austral</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-raised/60 border border-border/60 text-center space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
            CO₂ Fijado
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">
            {co2EvitadoKg.toFixed(1)} <span className="text-sm font-sans font-normal text-muted-foreground">kg</span>
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">Captura Biológica</p>
        </div>
      </div>

      {/* Representación Simbólica de la Parcela de Bosque */}
      <div className="p-5 rounded-2xl bg-surface-sunken/40 border border-border/60 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <TreePine size={14} className="text-primary" />
            <span>Parcela de Biodiversidad en Monitoreo</span>
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Lat -42.28° · Lng -73.49°
          </span>
        </div>

        {/* Grilla visual interactiva de árboles */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {Array.from({ length: Math.min(12, Math.max(6, displayArboles * 2)) }).map((_, i) => {
            const especie = especiesArboles[i % especiesArboles.length];
            const isSelected = selectedTree === especie;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedTree(isSelected ? null : especie)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isSelected
                    ? 'bg-primary/20 border-primary shadow-sm scale-105'
                    : 'bg-surface-raised/50 border-border/70 hover:border-primary/40 hover:bg-surface-raised'
                }`}
              >
                <TreePine
                  size={20}
                  className={i < displayArboles ? 'text-primary' : 'text-muted-foreground/40'}
                />
                <span className="text-[10px] font-mono text-muted-foreground truncate w-full">
                  #{i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {selectedTree && (
          <div className="p-3 rounded-xl bg-surface-raised border border-primary/30 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                Especie Seleccionada
              </span>
              <p className="font-medium text-foreground">{selectedTree}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTree(null)}
              className="text-[11px] text-muted-foreground hover:text-foreground font-mono"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground border-t border-border/40">
          <span>
            Árboles nativos certificados por el plan de regeneración territorial de Chiloé.
          </span>
          <Link
            href="/origen"
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold uppercase tracking-wider text-[11px] shrink-0"
          >
            <span>Explorar el Origen</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
