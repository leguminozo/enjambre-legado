'use client';

import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

export type ReplenishmentIntervalKey = 'monthly' | 'quarterly' | 'annual' | 'custom';

export type CustomFrequencyOption = 'biweekly' | 'bimonthly' | 'fourmonthly' | 'semiannual';

export interface PlanIntervalPickerProps {
  selectedInterval: ReplenishmentIntervalKey;
  onSelectInterval: (interval: ReplenishmentIntervalKey) => void;
  customFrequency?: CustomFrequencyOption;
  onChangeCustomFrequency?: (freq: CustomFrequencyOption) => void;
  className?: string;
}

const INTERVAL_OPTIONS: {
  key: ReplenishmentIntervalKey;
  kicker: string;
  title: string;
  cadence: string;
}[] = [
  {
    key: 'monthly',
    kicker: 'Mensual',
    title: 'Reposición mensual',
    cadence: 'Cada 1 mes',
  },
  {
    key: 'quarterly',
    kicker: 'Trimestral',
    title: 'Reposición trimestral',
    cadence: 'Cada 3 meses',
  },
  {
    key: 'annual',
    kicker: 'Anual',
    title: 'Reposición anual',
    cadence: 'Cada 1 año',
  },
  {
    key: 'custom',
    kicker: 'Personalizada',
    title: 'Reposición a medida',
    cadence: 'Frecuencia flexible',
  },
];

const CUSTOM_CADENCE_OPTIONS: {
  key: CustomFrequencyOption;
  label: string;
  desc: string;
}[] = [
  { key: 'biweekly', label: 'Quincenal', desc: 'Cada 2 semanas' },
  { key: 'bimonthly', label: 'Bimestral', desc: 'Cada 2 meses' },
  { key: 'fourmonthly', label: 'Cuatrimestral', desc: 'Cada 4 meses' },
  { key: 'semiannual', label: 'Semestral', desc: 'Cada 6 meses' },
];

export function PlanIntervalPicker({
  selectedInterval,
  onSelectInterval,
  customFrequency = 'bimonthly',
  onChangeCustomFrequency,
  className = '',
}: PlanIntervalPickerProps) {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* 4 opciones de intervalo en cuadrícula equilibrada */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {INTERVAL_OPTIONS.map((opt) => {
          const isSelected = selectedInterval === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelectInterval(opt.key)}
              className={`rounded-2xl border p-3.5 sm:p-4 text-left transition-all relative cursor-pointer min-h-[96px] flex flex-col justify-between ${
                isSelected
                  ? 'border-accent bg-accent/15 ring-2 ring-accent/30 shadow-sm'
                  : 'border-border/80 bg-card/60 hover:border-accent/40 hover:bg-surface-raised'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-accent">
                  {opt.kicker}
                </span>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded-full shrink-0">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </div>

              <div>
                <p className="font-display font-semibold text-foreground text-xs sm:text-sm leading-snug">
                  {opt.title}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">
                  {opt.cadence}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selector de frecuencia expandido cuando se elige Personalizada */}
      {selectedInterval === 'custom' && (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-accent" />
            <span className="text-xs font-semibold text-foreground">
              Selecciona tu ritmo de entrega personalizado
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CUSTOM_CADENCE_OPTIONS.map((sub) => {
              const active = customFrequency === sub.key;
              return (
                <button
                  key={sub.key}
                  type="button"
                  onClick={() => onChangeCustomFrequency?.(sub.key)}
                  className={`px-3 py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'border-accent bg-accent/25 text-foreground font-semibold shadow-xs'
                      : 'border-border/70 bg-card/70 text-muted-foreground hover:text-foreground hover:border-accent/30'
                  }`}
                >
                  <p className="text-xs font-medium">{sub.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
