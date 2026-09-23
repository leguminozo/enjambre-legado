'use client';

import React, { useState } from 'react';
import { Button } from '@enjambre/ui';
import { Star, Award, Compass, MessageSquare } from 'lucide-react';
import { ResenaComposer } from '@/components/shop/resena-composer';

interface TrazabilidadSensorialSectionProps {
  product: {
    id: string;
    name: string;
    slug: string;
    nombre_lote?: string | null;
    lote_id?: string | null;
    perfil_sensorial?: unknown;
  };
}

function resolveSensoryDisplay(ps: unknown): {
  aroma?: string;
  sabor?: string;
  textura?: string;
  maridaje?: string;
} | null {
  if (!ps || typeof ps !== 'object') return null;
  const p = ps as Record<string, unknown>;

  let aroma: string | undefined;
  if (typeof p.aroma === 'string' && p.aroma.trim()) {
    aroma = p.aroma;
  } else if (Array.isArray(p.notas_aromaticas) && p.notas_aromaticas.length > 0) {
    aroma = (p.notas_aromaticas as string[]).slice(0, 3).join(' · ');
  }

  let sabor: string | undefined;
  if (typeof p.sabor === 'string' && p.sabor.trim()) {
    sabor = p.sabor;
  } else if (p.descriptores_dulzor && typeof p.descriptores_dulzor === 'object') {
    const d = p.descriptores_dulzor as { izq?: string; der?: string };
    sabor = [d.izq, d.der].filter(Boolean).join(' / ');
  }

  let texturaStr: string | undefined;
  if (typeof p.textura === 'string' && p.textura.trim()) {
    texturaStr = p.textura;
  } else if (p.descriptores_textura && typeof p.descriptores_textura === 'object') {
    const dt = p.descriptores_textura as { izq?: string; der?: string };
    texturaStr = [dt.izq, dt.der].filter(Boolean).join(' – ');
  } else if (typeof p.textura === 'number') {
    texturaStr = p.textura > 50 ? 'Cremosa y densa' : 'Fluida y sedosa';
  }

  let maridaje: string | undefined;
  if (typeof p.maridaje === 'string' && p.maridaje.trim()) {
    maridaje = p.maridaje;
  } else if (Array.isArray(p.maridajes) && p.maridajes.length > 0) {
    maridaje = p.maridajes
      .map((m: unknown) => (typeof m === 'string' ? m : (m as { titulo?: string })?.titulo ?? ''))
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');
  }

  if (!aroma && !sabor && !texturaStr && !maridaje) {
    return null;
  }

  return { aroma, sabor, textura: texturaStr, maridaje };
}

export function TrazabilidadSensorialSection({ product }: TrazabilidadSensorialSectionProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const perfil = resolveSensoryDisplay(product.perfil_sensorial);

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-1">
            <Compass size={13} />
            <span>Perfil Organoléptico & Cata</span>
          </div>
          <h3 className="font-display text-2xl text-foreground">
            Percepción Sensorial del Lote {product.nombre_lote ? `· ${product.nombre_lote}` : ''}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Cada recolección en el bosque templado lluvioso de Chiloé posee una firma aromática irrepetible.
            Compara las notas de cata oficiales y registra tu propia percepción.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-xs tracking-wider uppercase hover:opacity-90 transition-opacity shadow-sm self-start sm:self-center shrink-0 min-h-11"
        >
          <Award size={15} />
          <span>Iniciar Cata Guiada</span>
        </button>
      </div>

      {/* Descriptores sensoriales si están disponibles */}
      {perfil && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {perfil.aroma && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Aroma</span>
              <p className="text-xs font-medium text-foreground leading-snug">{perfil.aroma}</p>
            </div>
          )}
          {perfil.sabor && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sabor en boca</span>
              <p className="text-xs font-medium text-foreground leading-snug">{perfil.sabor}</p>
            </div>
          )}
          {perfil.textura && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Textura</span>
              <p className="text-xs font-medium text-foreground leading-snug">{perfil.textura}</p>
            </div>
          )}
          {perfil.maridaje && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Maridaje sugerido</span>
              <p className="text-xs font-medium text-foreground leading-snug">{perfil.maridaje}</p>
            </div>
          )}
        </div>
      )}

      {/* Invitación interactiva de degustación */}
      <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
            <Compass size={18} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              ¿Degustando este frasco ahora mismo?
            </p>
            <p className="text-muted-foreground text-[11px] mt-0.5">
              Evalúa la cristalización, intensidad y notas en boca para enriquecer la trazabilidad de origen de este lote.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setComposerOpen(true)}
          className="shrink-0 text-xs gap-1.5 border-accent/40 text-accent hover:bg-accent/10"
        >
          <Star size={13} className="fill-accent" />
          <span>Evaluar</span>
        </Button>
      </div>

      {/* Modal de Cata y Reseña Profunda */}
      <ResenaComposer
        productoId={product.id}
        productName={product.name}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSubmitted={() => {
          setComposerOpen(false);
        }}
      />
    </section>
  );
}
