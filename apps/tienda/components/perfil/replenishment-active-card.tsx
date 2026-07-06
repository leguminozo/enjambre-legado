'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Calendar, Pause, Play, Package, XCircle, AlertTriangle, MapPin } from 'lucide-react';
import type { SubscriptionPlan, UserSubscription } from '@/app/actions/perfil-experiences';
import { formatCLP } from '@/lib/shop/format';
import { translateDeliveryCountdown, translateFrequency } from '@/lib/shop/replenishment-i18n';
import { canPauseReplenishment, canResumeReplenishment, isPastDue } from '@/lib/shop/subscription-status';

type ReplenishmentActiveCardProps = {
  subscription: UserSubscription;
  plan: SubscriptionPlan | null;
  status: string;
  loading: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRegularize?: () => void;
};

export function ReplenishmentActiveCard({
  subscription,
  plan,
  status,
  loading,
  onPause,
  onResume,
  onCancel,
  onRegularize,
}: ReplenishmentActiveCardProps) {
  const t = useTranslations('perfil.reposicion.activeCard');
  const tRoot = useTranslations('perfil.reposicion');

  const paused = status === 'paused';
  const pastDue = isPastDue(status);

  const statusLabel = pastDue ? t('pastDue') : paused ? t('paused') : t('inProgress');

  const nextLabel = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';
  const countdown = subscription.current_period_end
    ? translateDeliveryCountdown(tRoot, subscription.current_period_end)
    : '—';

  return (
    <article className="tienda-replenishment-active-card">
      {pastDue ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="flex items-start gap-2 text-sm text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {tRoot('pastDueBanner')}
          </p>
          {onRegularize ? (
            <button
              type="button"
              disabled={loading}
              onClick={onRegularize}
              className="rounded-full bg-accent px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:shadow-glow disabled:opacity-50"
            >
              {tRoot('regularizePayment')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Package size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.25em] text-accent">{statusLabel}</p>
            <h3 className="mt-1 font-display text-xl text-foreground">
              {plan?.name ?? t('activeFallback')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {plan?.frequency ? translateFrequency(tRoot, plan.frequency) : t('monthlyFallback')}
              {plan?.price_clp != null ? ` · ${formatCLP(plan.price_clp)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canResumeReplenishment(status) ? (
            <button
              type="button"
              disabled={loading}
              onClick={onResume}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              <Play size={14} />
              {t('resume')}
            </button>
          ) : null}
          {canPauseReplenishment(status) ? (
            <button
              type="button"
              disabled={loading}
              onClick={onPause}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-foreground transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              <Pause size={14} />
              {t('pause')}
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
          >
            <XCircle size={14} />
            {tRoot('cancelAction')}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-secondary/20 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <Calendar size={12} className="text-accent" />
            {t('nextDelivery')}
          </p>
          <p className="mt-2 text-sm text-foreground">{nextLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{countdown}</p>
        </div>
        {subscription.delivery_address ? (
          <div className="rounded-xl border border-border/80 bg-secondary/20 px-4 py-3">
            <p className="flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <MapPin size={12} className="text-accent" />
              {t('deliveryAddress')}
            </p>
            <p className="mt-2 text-sm text-foreground">{subscription.delivery_address}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-secondary/20 px-4 py-3 flex flex-col justify-center">
            <Link
              href="/perfil/pedidos"
              className="text-xs uppercase tracking-[0.2em] text-accent hover:underline"
            >
              {t('viewOrders')}
            </Link>
          </div>
        )}
      </div>
      {subscription.delivery_address ? (
        <div className="mt-3">
          <Link
            href="/perfil/pedidos"
            className="text-xs uppercase tracking-[0.2em] text-accent hover:underline"
          >
            {t('viewOrders')}
          </Link>
        </div>
      ) : null}
    </article>
  );
}