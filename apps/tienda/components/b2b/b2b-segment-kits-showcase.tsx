'use client';

import React from 'react';
import { formatCLP } from '@enjambre/ui';
import {
  Package,
  QrCode,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Store,
} from 'lucide-react';
import type { SegmentKit, B2BCodeModule } from '@/lib/b2b/segment-content';
import type { B2BToolItem, B2BCommercialStrategy } from '@enjambre/shop-chrome';

export interface B2BSegmentKitsShowcaseProps {
  kits: SegmentKit[];
  codeModules?: B2BCodeModule[];
  segmentLabel: string;
  segmentSlug: string;
  selectedKitId?: string;
  onSelectKit?: (kitId: string) => void;
}

export function B2BSegmentKitsShowcase({
  kits,
  codeModules,
  segmentLabel,
  segmentSlug,
  selectedKitId,
  onSelectKit,
}: B2BSegmentKitsShowcaseProps) {
  if (!kits || kits.length === 0) return null;

  const handleSelect = (kitId: string) => {
    if (onSelectKit) {
      onSelectKit(kitId);
    }
    const target = document.getElementById('registro');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="kits-planificados" className="py-20 md:py-28 px-4 border-t border-border/20 bg-surface-raised/20">
      <div className="max-w-6xl mx-auto">
        {/* ── Kits de Inicio para tu Espacio ── */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-primary font-semibold mb-3">
            Formatos de Selección & Abastecimiento
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
            Kits de Inicio para {segmentLabel}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed text-pretty">
            Selecciones listas de miel cruda y cremas batidas en frío para integrarse directamente a tu espacio, combinando formatos de degustación en mesa, vitrina de venta y trazabilidad digital de lote.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {kits.map((kit) => {
            const isSelected = selectedKitId === kit.id;
            const isRecommended = kit.tier === 'growth' || kit.tier === 'medio';

            return (
              <div
                key={kit.id}
                className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isSelected
                    ? 'border-primary bg-card ring-2 ring-primary/40 shadow-2xl scale-[1.01]'
                    : isRecommended
                    ? 'border-primary/50 bg-card shadow-xl'
                    : 'border-border/60 bg-card/90 hover:border-border-hover'
                }`}
              >
                {/* Badge superior */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-medium uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="w-3 h-3" />
                    {kit.badge}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {kit.moqSummary}
                  </span>
                </div>

                {/* Título y Tagline */}
                <div className="mb-6">
                  <h3 className="font-display text-2xl font-light text-foreground mb-1">
                    {kit.nombre}
                  </h3>
                  <p className="text-xs text-primary font-medium tracking-wide mb-3">
                    {kit.tagline}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {kit.descripcion}
                  </p>

                  {/* Detalle de Despliegue del Kit */}
                  {kit.salesStrategy ? (
                    <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-3 mb-2">
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {kit.salesStrategy}
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Formatos de Miel Incluidos */}
                <div className="rounded-2xl border border-border/40 bg-surface-raised/60 p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span>Formatos de Miel Incluidos</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {kit.componentesFisicos
                      .filter((comp) => {
                        const lower = comp.item.toLowerCase();
                        return (
                          !lower.includes('tótem') &&
                          !lower.includes('totem') &&
                          !lower.includes('madera') &&
                          !lower.includes('estante') &&
                          !lower.includes('exhibidor') &&
                          !lower.includes('paleta') &&
                          !lower.includes('cuchara') &&
                          !lower.includes('dosificador') &&
                          !lower.includes('tablilla')
                        );
                      })
                      .map((comp, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono text-primary font-semibold shrink-0">
                            {comp.cantidad}
                          </span>
                          <div>
                            <span className="text-foreground font-medium">{comp.item}</span>
                            {comp.detalle && (
                              <span className="block text-[11px] text-muted-foreground">
                                {comp.detalle}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Sección Digital & Trazabilidad Local */}
                <div className="rounded-2xl border border-border/40 bg-surface-sunken/40 p-4 mb-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <QrCode className="w-4 h-4 text-primary" />
                    <span>Trazabilidad Digital de Lote</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    {kit.integracionesDigitales.map((dig, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-foreground font-medium">{dig.titulo}:</span>{' '}
                          <span>{dig.descripcion}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resumen Financiero & Acción */}
                <div className="border-t border-border/40 pt-5 mt-auto">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                        Inversión Inicial
                      </span>
                      <span className="font-mono text-2xl font-light text-foreground">
                        {formatCLP(kit.precioNetoClp)}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">neto</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                        Retorno Estimado
                      </span>
                      <span className="text-xs font-mono font-medium text-primary">
                        ~{kit.margenEstimadoPct}% margen
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        (PVP {formatCLP(kit.pvpEstimadoClp)})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleSelect(kit.id)}
                      className={`w-full min-h-12 rounded-xl text-xs uppercase tracking-[0.2em] font-medium transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Kit Seleccionado</span>
                        </>
                      ) : (
                        <>
                          <span>Seleccionar este Kit</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

