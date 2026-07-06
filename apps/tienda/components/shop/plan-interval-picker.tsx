'use client';

import { useTranslations } from 'next-intl';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { translateFrequency } from '@/lib/shop/replenishment-i18n';
import { formatCLP } from '@/lib/shop/format';

type PlanIntervalPickerProps = {
  plans: ReplenishmentPlan[];
  selectedPlanId: string;
  onSelect: (planId: string) => void;
  variant?: 'compact' | 'profile';
};

export function PlanIntervalPicker({
  plans,
  selectedPlanId,
  onSelect,
  variant = 'compact',
}: PlanIntervalPickerProps) {
  const t = useTranslations('perfil.reposicion');

  if (plans.length === 0) return null;

  const isProfile = variant === 'profile';

  return (
    <div className={isProfile ? 'grid md:grid-cols-3 gap-6' : 'grid gap-2 sm:grid-cols-3'}>
      {plans.map((plan) => {
        const active = plan.id === selectedPlanId;
        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={
              isProfile
                ? `p-6 rounded-2xl border text-left transition-colors ${
                    active
                      ? 'bg-accent/5 border-accent/30 ring-1 ring-accent/20'
                      : 'bg-secondary/50 border-border hover:border-accent/30'
                  }`
                : `rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20'
                      : 'border-border bg-card hover:border-accent/25'
                  }`
            }
          >
            <span
              className={`block uppercase tracking-[0.2em] text-accent font-bold ${
                isProfile ? 'text-[0.6rem] mb-2' : 'text-[0.6rem]'
              }`}
            >
              {translateFrequency(t, plan.frequency)}
            </span>
            <span
              className={`block font-display text-foreground ${
                isProfile ? 'text-xl' : 'mt-1 text-sm'
              }`}
            >
              {plan.name}
            </span>
            <span
              className={`block text-foreground ${isProfile ? 'text-xl mt-1' : 'mt-2 text-sm text-muted-foreground'}`}
            >
              {formatCLP(plan.price_clp)}
            </span>
            {isProfile && plan.description ? (
              <p className="text-xs text-muted-foreground mt-3">{plan.description}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}