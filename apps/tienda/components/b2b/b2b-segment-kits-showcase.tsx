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
  TrendingUp,
} from 'lucide-react';
import type { SegmentKit, B2BCodeModule } from '@/lib/b2b/segment-content';
import type { B2BToolItem, B2BCommercialStrategy } from '@enjambre/shop-chrome';

export interface B2BSegmentKitsShowcaseProps {
  kits: SegmentKit[];
  tools?: B2BToolItem[];
  strategy?: B2BCommercialStrategy | null;
  codeModules?: B2BCodeModule[];
  segmentLabel: string;
  segmentSlug: string;
  selectedKitId?: string;
  onSelectKit?: (kitId: string) => void;
}

export function B2BSegmentKitsShowcase({
  kits,
  tools,
  strategy,
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
        {/* ── 1. Estrategia Comercial de Crecimiento por Segmento ── */}
        {strategy && strategy.titulo ? (
          <div className="mb-20 rounded-3xl border border-primary/25 bg-gradient-to-br from-surface-raised/90 via-card to-surface-sunken/90 p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-[0.25em] bg-primary/15 border border-primary/30 text-primary">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Estrategia Comercial · {segmentLabel}
                </span>
                {strategy.aumento_ticket ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[0.65rem] font-mono uppercase tracking-wider bg-surface-sunken border border-border/60 text-accent-text">
                    Ticket Boost: {strategy.aumento_ticket}
                  </span>
                ) : null}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground text-balance mb-4">
                {strategy.titulo}
              </h3>

              {strategy.bajada ? (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl mb-8">
                  {strategy.bajada}
                </p>
              ) : null}

              {/* Herramienta clave y métrica */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {strategy.aumento_ticket ? (
                  <div className="rounded-2xl border border-border/60 bg-surface-raised/70 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground block">
                        Impacto en Ticket Promedio
                      </span>
                      <span className="font-display text-xl text-foreground font-light block mt-0.5">
                        {strategy.aumento_ticket}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Monetización comprobada del gesto de origen en tu espacio.
                      </span>
                    </div>
                  </div>
                ) : null}

                {strategy.herramienta_clave ? (
                  <div className="rounded-2xl border border-border/60 bg-surface-raised/70 p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-text/10 border border-accent-text/25 flex items-center justify-center text-accent-text shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground block">
                        Herramienta Clave de Servicio
                      </span>
                      <span className="font-display text-xl text-foreground font-light block mt-0.5">
                        {strategy.herramienta_clave}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Diseñada en maderas nativas para anclar la experiencia territorial.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mecánica de ventas paso a paso */}
              {strategy.mecanica_ventas && strategy.mecanica_ventas.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-primary block">
                    Mecánica de Venta & Despliegue en 4 Pasos
                  </span>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {strategy.mecanica_ventas.map((paso, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-border/40 bg-surface-raised/50 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <span className="font-mono text-xl font-light text-primary/70 block mb-2">
                            0{idx + 1}
                          </span>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {paso}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* ── 2. Herramientas Territoriales Únicas de Chiloé ── */}
        {tools && tools.length > 0 ? (
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-primary font-semibold mb-3">
                Mano Física · Artesanía Territorial de Chiloé
              </span>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground text-balance">
                Herramientas de Servicio en Madera Nativa
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty">
                Diseñadas y talladas en maderas nobles recuperadas (roble de demolición, tepa, avellano y canelo),
                curadas con cera virgen de abejas para una puesta en escena de alta gama.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-border/60 bg-surface-raised/60 p-6 flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
                        {tool.rol || 'Servicio'}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-surface-sunken px-2.5 py-0.5 rounded-full border border-border/40">
                        {tool.material}
                      </span>
                    </div>

                    <h4 className="font-display text-xl font-light text-foreground mb-2">
                      {tool.nombre}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {tool.descripcion}
                    </p>
                  </div>

                  {tool.impacto_ventas ? (
                    <div className="border-t border-border/40 pt-3 flex items-center gap-2 text-xs text-accent-text font-medium">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{tool.impacto_ventas}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── 3. Ecosistema Tecnológico de Código Local (@enjambre) ── */}
        {codeModules && codeModules.length > 0 ? (
          <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-primary font-semibold mb-3">
                Arquitectura de Software Propia · Red @enjambre
              </span>
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground text-balance">
                El Ecosistema Tecnológico de Código Local
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty">
                Nuestra plataforma no depende de intermediarios genéricos. Cada aliado accede a módulos de software
                diseñados en nuestro propio monorepo para resolver trazabilidad en mesa, fidelización móvil, validación analítica y facturación instantánea.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {codeModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-border/60 bg-surface-raised/60 p-6 flex flex-col justify-between hover:border-primary/40 transition-colors group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        {mod.package_name}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-surface-sunken px-2.5 py-0.5 rounded-full border border-border/40">
                        {mod.badge}
                      </span>
                    </div>

                    <h4 className="font-display text-lg font-light text-foreground mb-2 leading-snug">
                      {mod.titulo}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {mod.descripcion}
                    </p>
                  </div>

                  {mod.beneficio_comercial ? (
                    <div className="border-t border-border/40 pt-3 relative z-10">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block mb-1">
                        Impacto Comercial
                      </span>
                      <p className="text-xs text-accent-text font-medium leading-relaxed">
                        {mod.beneficio_comercial}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── 4. Kits Comerciales Listos (3 a 5 Variantes) ── */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-primary font-semibold mb-3">
            Planes de Inicio & Abastecimiento
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-foreground text-balance">
            Kits Planificados para {segmentLabel}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed text-pretty">
            Configuraciones de valor diseñadas para resolver simultáneamente la disponibilidad de producto,
            las herramientas físicas de servicio en tu espacio y la trazabilidad digital con el código de nuestra red.
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

                  {/* Estrategia de Venta del Kit */}
                  {kit.salesStrategy ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-[11px] text-foreground font-medium leading-snug">
                        {kit.salesStrategy}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Sección Mano Física */}
                <div className="rounded-2xl border border-border/40 bg-surface-raised/60 p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <Store className="w-4 h-4 text-primary" />
                    <span>Mano Física en Punto de Venta</span>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {kit.componentesFisicos.map((comp, idx) => (
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

                  {/* Herramientas de Servicio en Madera */}
                  {kit.herramientasServicio && kit.herramientasServicio.length > 0 && (
                    <div className="border-t border-border/30 pt-2.5 mt-2">
                      <span className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">
                        Herramientas de Servicio en Madera Nativa
                      </span>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        {kit.herramientasServicio.map((tool, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-primary text-[10px]">•</span>
                            <span>{tool}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Material de Exhibición */}
                  {kit.materialesExhibicion && kit.materialesExhibicion.length > 0 && (
                    <div className="border-t border-border/30 pt-2.5 mt-2">
                      <span className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">
                        Material de Exhibición Incluido
                      </span>
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        {kit.materialesExhibicion.map((mat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-primary text-[10px]">•</span>
                            <span>{mat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sección Digital & Trazabilidad Local */}
                <div className="rounded-2xl border border-border/40 bg-surface-sunken/40 p-4 mb-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <QrCode className="w-4 h-4 text-primary" />
                    <span>Lo Digital & Trazabilidad Local</span>
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

