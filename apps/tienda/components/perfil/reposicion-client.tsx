'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Repeat, ArrowRight } from 'lucide-react';
import { toast } from '@enjambre/ui';
import type { SubscriptionDelivery, SubscriptionPlan, UserSubscription } from '@/app/actions/perfil-experiences';
import { ReplenishmentActiveCard } from '@/components/perfil/replenishment-active-card';
import { ReplenishmentOverview } from '@/components/perfil/replenishment-overview';
import { SubscriptionDeliveriesPreview } from '@/components/perfil/subscription-deliveries-preview';
import { PlanIntervalPicker } from '@/components/shop/plan-interval-picker';
import { ReplenishmentAddressField } from '@/components/shop/replenishment-address-field';
import { defaultPlanId } from '@/lib/shop/replenishment';
import {
  loadReplenishmentAddress,
  saveReplenishmentAddress,
} from '@/lib/shop/replenishment-address';
import { startSubscriptionCheckout } from '@/lib/shop/subscription-checkout-client';
import { manageSubscription } from '@/lib/shop/subscription-manage-client';
import { isPastDue, isReplenishmentLive } from '@/lib/shop/subscription-status';

type ReposicionClientProps = {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  deliveries?: SubscriptionDelivery[];
};

export function ReposicionClient({
  subscription,
  plans,
  deliveries = [],
}: ReposicionClientProps) {
  const t = useTranslations('perfil.reposicion');
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(() => defaultPlanId(plans));
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(subscription?.status ?? '');

  useEffect(() => {
    setAddress(loadReplenishmentAddress());
  }, []);

  const isActive = localStatus === 'active' || localStatus === 'trialing';
  const isPaused = localStatus === 'paused';
  const pastDue = isPastDue(localStatus);
  const hasLiveReplenishment = isReplenishmentLive(localStatus);

  const startCheckout = async (planId: string) => {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      toast(t('addressRequired'), { type: 'error' });
      return;
    }

    saveReplenishmentAddress(trimmed);
    setLoading(true);
    const result = await startSubscriptionCheckout(planId, { deliveryAddress: trimmed });
    if (!result.ok) {
      toast(result.message, { type: 'error' });
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) {
      toast(t('selectPlan'), { type: 'error' });
      return;
    }
    await startCheckout(selectedPlanId);
  };

  const handleRegularize = async () => {
    const planId = subscription?.subscription_plans?.id ?? selectedPlanId;
    if (!planId) {
      toast(t('selectPlan'), { type: 'error' });
      return;
    }
    await startCheckout(planId);
  };

  const handleManage = async (action: 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel' && !window.confirm(t('cancelConfirm'))) {
      return;
    }

    setManageLoading(true);
    const result = await manageSubscription(action);
    setManageLoading(false);

    if (!result.ok) {
      toast(result.message, { type: 'error' });
      return;
    }

    if (action === 'cancel') {
      setLocalStatus('canceled');
      toast(t('canceled'), { type: 'success' });
    } else {
      setLocalStatus(result.status);
      toast(action === 'pause' ? t('paused') : t('resumed'), { type: 'success' });
    }
    router.refresh();
  };

  const nextDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Repeat size={20} />
            </div>
            <h1 className="font-display text-4xl font-light text-foreground">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">{t('subtitle')}</p>
        </div>

        {subscription && nextDate && isActive ? (
          <div className="px-6 py-2 bg-accent/10 border border-accent/20 rounded-full">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent font-bold">
              {t('nextDelivery', { date: nextDate })}
            </span>
          </div>
        ) : null}
      </div>

      <ReplenishmentOverview
        active={Boolean(subscription && hasLiveReplenishment)}
        paused={isPaused}
        pastDue={pastDue}
        nextDeliveryIso={subscription?.current_period_end ?? null}
        intervalTotal={subscription?.subscription_plans?.price_clp ?? null}
      />

      {subscription && hasLiveReplenishment ? (
        <div className="space-y-8">
          <ReplenishmentActiveCard
            subscription={subscription}
            plan={subscription.subscription_plans}
            status={localStatus}
            loading={manageLoading || loading}
            onPause={() => void handleManage('pause')}
            onResume={() => void handleManage('resume')}
            onCancel={() => void handleManage('cancel')}
            onRegularize={pastDue ? () => void handleRegularize() : undefined}
          />
          <SubscriptionDeliveriesPreview deliveries={deliveries} />
        </div>
      ) : (
        <div className="p-10 rounded-3xl bg-card border border-border space-y-8">
          <h3 className="font-display text-2xl text-foreground">{t('interval')}</h3>

          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('intervalEmpty')}</p>
          ) : (
            <>
              <PlanIntervalPicker
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelect={setSelectedPlanId}
                variant="profile"
              />

              <ReplenishmentAddressField value={address} onChange={setAddress} />

              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleSubscribe()}
                  className="px-12 py-5 bg-accent text-accent-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl hover:shadow-glow transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? t('processing') : t('confirm')} <ArrowRight size={16} />
                </button>
                <p className="text-xs text-muted-foreground mt-4">{t('billingNote')}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}