'use client';

import React, { useState, useTransition } from 'react';
import { Repeat, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from '@enjambre/ui';
import {
  subscribeToPlan,
  type SubscriptionPlan,
  type UserSubscription,
} from '@/app/actions/perfil-experiences';

type RitualMensualClientProps = {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
};

function formatPrice(clp: number): string {
  return clp.toLocaleString('es-CL');
}

export function RitualMensualClient({ subscription, plans }: RitualMensualClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[1]?.id ?? plans[0]?.id ?? '');
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = () => {
    if (!selectedPlanId) {
      toast('Selecciona un plan', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await subscribeToPlan(selectedPlanId);
        toast('Ritual activado', { type: 'success' });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'No se pudo activar', { type: 'error' });
      }
    });
  };

  const nextDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Repeat size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Ritual Mensual</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            Tu compromiso recurrente con el bosque
          </p>
        </div>

        {subscription && nextDate ? (
          <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">
              Próximo ciclo: {nextDate}
            </span>
          </div>
        ) : null}
      </div>

      {subscription ? (
        <div className="p-8 rounded-3xl bg-card border border-border">
          <p className="text-sm text-foreground">
            Ritual activo:{' '}
            <strong>{subscription.subscription_plans?.name ?? 'Plan guardián'}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-2">Estado: {subscription.status}</p>
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-card border border-border">
          <h3 className="font-display text-3xl text-foreground mb-6">Elige tu frecuencia ritual</h3>

          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Los planes se están configurando. Vuelve pronto.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {plans.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-6 rounded-2xl border text-left transition-colors ${
                        selected
                          ? 'bg-accent/5 border-accent/30 ring-1 ring-accent/20'
                          : 'bg-secondary/50 border-border hover:border-accent/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">
                          {plan.name}
                        </span>
                        {plan.key === 'quarterly' ? <Sparkles size={12} className="text-accent" /> : null}
                      </div>
                      <span className="block text-xl font-display text-foreground">
                        ${formatPrice(plan.price_clp)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-3">{plan.description}</p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={handleSubscribe}
                className="px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isPending ? 'Activando…' : 'Activar Mi Ritual'} <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}