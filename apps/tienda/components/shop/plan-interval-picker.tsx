'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Repeat, Sparkles } from 'lucide-react';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { translateFrequency } from '@/lib/shop/replenishment-i18n';
import { formatCLP } from '@/lib/shop/format';

type PlanIntervalPickerProps = {
  plans: ReplenishmentPlan[];
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  variant?: 'compact' | 'profile';
};

function isClubPlan(plan: ReplenishmentPlan): boolean {
  return plan.key.startsWith('club_') || plan.name.toLowerCase().includes('club');
}

export function PlanIntervalPicker({
  plans,
  selectedPlanId,
  onSelect,
  variant = 'compact',
}: PlanIntervalPickerProps) {
  const t = useTranslations('perfil.reposicion');

  const ritmoPlans = useMemo(() => plans.filter((p) => !isClubPlan(p)), [plans]);
  const clubPlans = useMemo(() => plans.filter((p) => isClubPlan(p)), [plans]);

  const hasBothCategories = ritmoPlans.length > 0 && clubPlans.length > 0;

  const [activeTab, setActiveTab] = useState<'ritmo' | 'club'>(() => {
    const selected = plans.find((p) => p.id === selectedPlanId);
    return selected && isClubPlan(selected) ? 'club' : 'ritmo';
  });

  if (plans.length === 0) return null;

  const isProfile = variant === 'profile';
  const visiblePlans = isProfile && hasBothCategories
    ? activeTab === 'club' ? clubPlans : ritmoPlans
    : plans;

  return (
    <div className="space-y-6">
      {isProfile && hasBothCategories && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="inline-flex p-1 bg-secondary/80 rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ritmo');
                if (ritmoPlans.length > 0 && !ritmoPlans.some((p) => p.id === selectedPlanId)) {
                  onSelect(ritmoPlans[0].id);
                }
              }}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'ritmo'
                  ? 'bg-accent/20 text-accent-text font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Repeat size={14} />
              <span>Ritmo Continuo ({ritmoPlans.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('club');
                if (clubPlans.length > 0 && !clubPlans.some((p) => p.id === selectedPlanId)) {
                  onSelect(clubPlans[0].id);
                }
              }}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                activeTab === 'club'
                  ? 'bg-accent/20 text-accent-text font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles size={14} />
              <span>Club de la Cosecha ({clubPlans.length})</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {activeTab === 'ritmo'
              ? 'Miel Nativa Silvestre · Consumo continuo en tu hogar'
              : 'Ediciones Mono-florales · Cosechas estacionales por floración'}
          </p>
        </div>
      )}

      <div className={isProfile ? 'grid md:grid-cols-3 gap-6' : 'grid gap-2 sm:grid-cols-3'}>
        {visiblePlans.map((plan) => {
          const active = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              className={
                isProfile
                  ? `min-h-11 p-6 rounded-2xl border text-left transition-all relative ${
                      active
                        ? 'bg-accent/10 border-accent ring-2 ring-accent shadow-md'
                        : 'bg-secondary/40 border-border hover:border-accent/40 hover:bg-secondary/70'
                    }`
                  : `min-h-11 rounded-xl border p-4 text-left transition-all relative ${
                      active
                        ? 'border-accent bg-accent/10 ring-2 ring-accent shadow-sm'
                        : 'border-border bg-card hover:border-accent/25'
                    }`
              }
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`block uppercase tracking-[0.2em] text-accent-text font-bold ${
                    isProfile ? 'text-[0.65rem]' : 'text-[0.6rem]'
                  }`}
                >
                  {translateFrequency(t, plan.frequency)}
                </span>
                {active ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-text bg-accent/20 px-2 py-0.5 rounded-full shrink-0">
                    <Check size={12} strokeWidth={2.5} /> Seleccionado
                  </span>
                ) : null}
              </div>

              <span
                className={`block font-display text-foreground font-medium ${
                  isProfile ? 'text-xl' : 'mt-1 text-sm'
                }`}
              >
                {plan.name}
              </span>

              <span
                className={`block text-foreground ${
                  isProfile
                    ? 'text-xl mt-1 font-mono font-semibold'
                    : 'mt-2 text-sm text-foreground font-semibold'
                }`}
              >
                {formatCLP(plan.price_clp)}
                <span className="text-xs text-muted-foreground font-sans font-normal ml-1">/ ciclo</span>
              </span>

              {isProfile && plan.description ? (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border/40 pt-3">
                  {plan.description}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}