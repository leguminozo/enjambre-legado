'use client';

import React from 'react';
import { formatStampMessage, type StampProgressView } from '@enjambre/wallet';
import { Gift, Check, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface GuardianStampProgressProps {
  programs: StampProgressView[];
  activeFilter?: string | null;
  onFilterChange?: (filterId: string | null) => void;
  onRedeemProgram?: (programId: string) => Promise<void>;
  redeemingProgramId?: string | null;
}

export function GuardianStampProgress({
  programs,
  activeFilter = null,
  onFilterChange,
  onRedeemProgram,
  redeemingProgramId = null,
}: GuardianStampProgressProps) {
  if (programs.length === 0) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/60 p-8 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-accent mx-auto" />
        <p className="font-display text-xl text-foreground font-light">Sin rutas de sellos activas</p>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Cada compra de un producto o formato de miel nativa suma un sello en tu credencial.
          Al juntar 10 sellos de cualquiera, recibes una unidad de cortesía y tu ciclo se reinicia.
        </p>
        <div className="pt-2">
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ShoppingBag size={14} />
            <span>Ver catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  // Filtrado por segmento de producto
  const filteredPrograms = activeFilter
    ? programs.filter((p) => p.programId === activeFilter)
    : programs;

  return (
    <div className="space-y-6">
      {/* Selector de Segmento / Filtros Rápidos */}
      {programs.length > 1 && onFilterChange && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist" aria-label="Segmentos de producto">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === null}
            onClick={() => onFilterChange(null)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
              activeFilter === null
                ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                : 'bg-surface-raised/70 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            Todos los productos ({programs.length})
          </button>
          {programs.map((p) => {
            const isSelected = p.programId === activeFilter;
            return (
              <button
                key={p.programId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onFilterChange(p.programId)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'bg-surface-raised/70 border border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : p.eligibleForFree
                        ? 'bg-accent/20 text-accent-text font-bold'
                        : 'bg-surface-sunken text-muted-foreground'
                  }`}
                >
                  {p.accumulated}/{p.required}
                </span>
                {p.eligibleForFree && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Tarjetas Segmentadas estilo Punch Card */}
      <div className="space-y-6">
        {filteredPrograms.map((p) => {
          const isRedeemingThis = redeemingProgramId === p.programId;
          const required = p.required || 10;
          const accumulated = p.accumulated || 0;
          const eligible = p.eligibleForFree || false;
          const remaining = Math.max(0, required - accumulated);

          return (
            <div
              key={p.programId}
              className={`rounded-3xl border transition-all overflow-hidden p-6 sm:p-7 space-y-5 ${
                eligible
                  ? 'border-accent/60 bg-gradient-to-br from-card via-surface-sunken to-card shadow-lg ring-1 ring-accent/20'
                  : 'border-border/80 bg-card/70 hover:border-border'
              }`}
            >
              {/* Encabezado del Segmento */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.65rem] font-mono uppercase tracking-[0.2em] text-accent-text font-bold">
                      Ruta de Producto
                    </span>
                    {p.cyclesCompleted && p.cyclesCompleted > 0 ? (
                      <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-surface-raised border border-border/60">
                        {p.cyclesCompleted} {p.cyclesCompleted === 1 ? 'ciclo completado' : 'ciclos completados'}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl text-foreground font-light">
                    {p.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                    {formatStampMessage(p)}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  {eligible ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent-text font-semibold text-xs animate-pulse">
                      <Gift size={14} className="text-accent" />
                      <span>¡Unidad gratis disponible!</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-sunken border border-border/70 text-muted-foreground text-xs font-mono">
                      <span>Progreso:</span>
                      <strong className="text-foreground font-bold">
                        {accumulated} / {required}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Matriz Visual de los 10 Sellos (Punch Card) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Tarjeta de Recolección (10 compras = 1 unidad de cortesía)</span>
                  <span>{p.progressPct}%</span>
                </div>

                {/* Cuadrícula de 10 Sellos */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 items-center justify-items-center p-4 sm:p-5 rounded-2xl bg-surface-sunken/80 border border-border/70 shadow-inner">
                  {Array.from({ length: required }, (_, i) => {
                    const isLast = i === required - 1;
                    const isStamped = i < accumulated;

                    // Slot 10: Recompensa de cortesía
                    if (isLast) {
                      return (
                        <div
                          key={`slot-${p.programId}-${i}`}
                          role="status"
                          aria-label={eligible ? 'Recompensa de cortesía lista: Unidad Gratis' : 'Recompensa final: Unidad Gratis'}
                          title="Slot 10: Unidad Gratis de Cortesía"
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 select-none ${
                            eligible
                              ? 'bg-accent text-accent-foreground border-2 border-accent shadow-lg shadow-accent/40 scale-105 animate-bounce font-bold'
                              : isStamped
                                ? 'bg-accent/80 text-accent-foreground border-2 border-accent'
                                : 'bg-card/40 border border-border/70 text-muted-foreground/50'
                          }`}
                        >
                          <Gift size={18} />
                          <span className="text-[8px] font-mono font-bold uppercase leading-none mt-0.5">Gratis</span>
                        </div>
                      );
                    }

                    // Slots 1 al 9 estampados
                    if (isStamped) {
                      return (
                        <div
                          key={`slot-${p.programId}-${i}`}
                          role="status"
                          aria-label={`Sello ${i + 1} de ${required} completado`}
                          title={`Sello ${i + 1} registrado`}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent text-accent-foreground border-2 border-accent shadow-md shadow-accent/20 flex flex-col items-center justify-center font-bold transition-all duration-300 select-none"
                        >
                          <Check size={16} className="stroke-[3]" />
                          <span className="text-[8px] font-mono leading-none mt-0.5">{i + 1}</span>
                        </div>
                      );
                    }

                    // Slots 1 al 9 pendientes
                    return (
                      <div
                        key={`slot-${p.programId}-${i}`}
                        role="status"
                        aria-label={`Sello ${i + 1} de ${required} pendiente`}
                        title={`Sello ${i + 1} pendiente`}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-card/40 border border-border/70 text-muted-foreground/60 font-mono text-xs flex items-center justify-center transition-colors select-none"
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Barra de Progreso y Acciones del Segmento */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {eligible
                      ? 'Has completado los 10 sellos de esta ruta. Al canjear tu unidad de cortesía, tu tarjeta se renueva y tu ciclo se reinicia a cero.'
                      : remaining === 1
                        ? 'Estás a solo 1 compra de este producto para desbloquear tu unidad de cortesía.'
                        : `Faltan ${remaining} compras de este producto para desbloquear tu unidad de cortesía.`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {eligible && onRedeemProgram ? (
                    <button
                      type="button"
                      disabled={isRedeemingThis}
                      onClick={() => void onRedeemProgram(p.programId)}
                      className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-accent text-accent-foreground text-xs font-mono uppercase tracking-wider font-bold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Gift size={16} />
                      <span>{isRedeemingThis ? 'Canjeando...' : 'Canjear Unidad Gratis'}</span>
                    </button>
                  ) : (
                    <Link
                      href="/catalogo"
                      className="w-full sm:w-auto inline-flex min-h-[40px] items-center justify-center gap-1.5 px-5 py-2 rounded-full border border-border/80 bg-surface-raised/60 text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors"
                    >
                      <span>Sumar en tienda</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
