'use client';

import React, { useTransition } from 'react';
import { Gem, Star, Flame } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { redeemLoyaltyReward, type LoyaltyReward } from '@/app/actions/perfil-experiences';

type CanjeImpactoClientProps = {
  balance: number;
  tier: string;
  rewards: LoyaltyReward[];
};

export function CanjeImpactoClient({ balance, tier, rewards }: CanjeImpactoClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleRedeem = (rewardId: string, name: string, cost: number) => {
    if (balance < cost) {
      toast('Puntos insuficientes para este canje', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await redeemLoyaltyReward(rewardId);
        toast(`Canje solicitado: ${name}`, { type: 'success' });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Error al canjear', { type: 'error' });
      }
    });
  };

  return (
    <div className="space-y-16 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Gem size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">Canje Impacto</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            Transforma tu impacto biocultural en recompensas tangibles
          </p>
        </div>

        <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">
            {balance.toLocaleString('es-CL')} Puntos · {tier}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-10 rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="font-display text-3xl text-foreground mb-6">Catálogo de Canje</h3>

            {rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay recompensas activas. Sigue acumulando impacto con tus compras.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {rewards.map((reward) => (
                  <button
                    key={reward.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRedeem(reward.id, reward.name, reward.points_cost)}
                    className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {reward.reward_type === 'experience' ? (
                        <Flame size={16} className="text-accent" />
                      ) : (
                        <Star size={16} className="text-accent" />
                      )}
                      <span className="text-[0.6rem] uppercase tracking-[0.2em] text-accent font-bold">
                        {reward.points_cost.toLocaleString('es-CL')} pts
                      </span>
                    </div>
                    <h4 className="font-display text-lg text-foreground mb-2">{reward.name}</h4>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-secondary/50 border border-border">
          <h4 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent mb-6">
            Cómo Acumular
          </h4>
          <ul className="space-y-4 text-xs text-muted-foreground">
            <li>10 pts por cada $1.000 en compras.</li>
            <li>50 pts por cada referido que compra.</li>
            <li>100 pts al activar el Ritual Mensual.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}