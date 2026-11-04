'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Repeat, Calendar, ArrowRight } from 'lucide-react';
import { toast, ConfirmDialog, cn } from '@enjambre/ui';
import type { SubscriptionDelivery, SubscriptionPlan, UserSubscription, PreOrderRow } from '@/app/actions/perfil-experiences';
import type { ShopProduct } from '@/lib/shop/products';
import { ReservasClient } from '@/components/perfil/reservas-client';
import { ReplenishmentActiveCard } from '@/components/perfil/replenishment-active-card';
import { ReplenishmentOverview } from '@/components/perfil/replenishment-overview';
import { SubscriptionDeliveriesPreview } from '@/components/perfil/subscription-deliveries-preview';
import { ReplenishmentSheet } from '@/components/shop/replenishment-sheet';
import { ReplenishmentAddressField } from '@/components/shop/replenishment-address-field';
import { defaultPlanId } from '@/lib/shop/replenishment';
import {
  loadReplenishmentAddress,
  saveReplenishmentAddress,
} from '@/lib/shop/replenishment-address';
import { startSubscriptionCheckout } from '@/lib/shop/subscription-checkout-client';
import { manageSubscription } from '@/lib/shop/subscription-manage-client';
import { isPastDue, isReplenishmentLive } from '@/lib/shop/subscription-status';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';
import type { TextAlign } from '@/lib/shop/store-chrome';

type ReposicionClientProps = {
  subscription: UserSubscription | null;
  plans: SubscriptionPlan[];
  products?: ShopProduct[];
  deliveries?: SubscriptionDelivery[];
  /** Prefill desde Club Legado del Bosque (?plan=club_ulmo). */
  initialPlanId?: string | null;
  direcciones?: ClienteDireccion[];
  reservasData?: {
    preOrders: PreOrderRow[];
    featuredProduct: { id: string; nombre: string; precio: number } | null;
    cmsSettings?: {
      enabled?: boolean;
      title?: string;
      subtitle?: string;
      description?: string;
      button_text?: string;
      allow_prepayment?: boolean;
      text_align?: TextAlign;
    };
  };
  initialTab?: 'suscripcion' | 'reservas';
};

export function ReposicionClient({
  subscription,
  plans,
  products = [],
  deliveries = [],
  initialPlanId = null,
  direcciones = [],
  reservasData,
  initialTab = 'suscripcion',
}: ReposicionClientProps) {
  const t = useTranslations('perfil.reposicion');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'suscripcion' | 'reservas'>(initialTab);

  const handleTabChange = (tab: 'suscripcion' | 'reservas') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'reservas') {
        url.searchParams.set('tab', 'reservas');
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  const [selectedPlanId, setSelectedPlanId] = useState(
    () => initialPlanId || subscription?.subscription_plans?.id || defaultPlanId(plans),
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(subscription?.status ?? '');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    const saved = loadReplenishmentAddress();
    if (saved && saved.trim().length > 0) {
      setAddress(saved);
    } else if (direcciones && direcciones.length > 0) {
      const def = direcciones.find((d) => d.es_predeterminada) || direcciones[0];
      if (def) {
        const parts = [def.direccion, def.comuna, def.ciudad, def.region].filter(Boolean);
        setAddress(parts.join(', '));
      }
    }
  }, [direcciones]);

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
    if (action === 'cancel') {
      setCancelConfirmOpen(true);
      return;
    }

    if (action === 'resume') {
      // Reanudar = nueva autorización de pago (al pausar se canceló la
      // inscripción Flow). El cliente vuelve a autorizar y el fulfill reactiva
      // la sub pausada.
      const planId = subscription?.subscription_plans?.id;
      if (!planId) {
        toast(t('selectPlan'), { type: 'error' });
        return;
      }
      const savedAddress = subscription?.delivery_address ?? loadReplenishmentAddress();
      if ((savedAddress ?? '').trim().length < 5) {
        toast(t('addressRequired'), { type: 'error' });
        return;
      }
      saveReplenishmentAddress(savedAddress?.trim() ?? '');
      setManageLoading(true);
      const result = await startSubscriptionCheckout(planId, {
        deliveryAddress: savedAddress?.trim(),
      });
      setManageLoading(false);
      if (!result.ok) {
        toast(result.message, { type: 'error' });
      }
      return;
    }

    setManageLoading(true);
    const result = await manageSubscription(action);
    setManageLoading(false);

    if (!result.ok) {
      toast(result.message, { type: 'error' });
      return;
    }

    setLocalStatus(result.status);
    toast(action === 'pause' ? t('paused') : t('resumed'), { type: 'success' });
    router.refresh();
  };

  const handleConfirmCancel = async () => {
    setCancelConfirmOpen(false);
    setManageLoading(true);
    const result = await manageSubscription('cancel');
    setManageLoading(false);

    if (!result.ok) {
      toast(result.message, { type: 'error' });
      return;
    }

    setLocalStatus('canceled');
    toast(t('canceled'), { type: 'success' });
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Repeat size={20} />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-light text-foreground">
              Suscripciones y Reservas
            </h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide max-w-2xl">
            Gestiona tus entregas periódicas de reposición y asegura cupos exclusivos en la recolección anual de miel del bosque nativo de Chiloé.
          </p>
        </div>

        {subscription && nextDate && isActive && activeTab === 'suscripcion' ? (
          <div className="px-5 py-2 bg-accent/10 border border-accent/20 rounded-full shrink-0">
            <span className="text-[0.65rem] uppercase tracking-[0.25em] text-accent-text font-bold">
              {t('nextDelivery', { date: nextDate })}
            </span>
          </div>
        ) : null}
      </div>

      {/* Selector de pestañas */}
      <div className="flex items-center p-1 bg-surface-sunken/60 border border-border rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('suscripcion')}
          className={cn(
            'flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-medium transition-all',
            activeTab === 'suscripcion'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Repeat size={15} />
          <span>Reposición Continua</span>
          {hasLiveReplenishment && (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('reservas')}
          className={cn(
            'flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-medium transition-all',
            activeTab === 'reservas'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar size={15} />
          <span>Reserva de Recolección</span>
          {(() => {
            const activeCount = reservasData?.preOrders.filter((o) => o.status !== 'cancelled').length ?? 0;
            return activeCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-accent/15 text-accent-text font-bold">
                {activeCount}
              </span>
            ) : null;
          })()}
        </button>
      </div>

      {activeTab === 'suscripcion' ? (
        <div className="space-y-12 animate-in fade-in-50 duration-300">
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

              {products.length > 0 ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Suscribirse a un producto
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedProductId ?? ''}
                        onChange={(e) => setSelectedProductId(e.target.value || null)}
                        className="flex-1 min-h-11 rounded-xl border border-border bg-card px-3 text-sm"
                      >
                        <option value="">Elegir producto…</option>
                        {products
                          .filter((p) => (p.stock ?? 1) > 0)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedProductId}
                        onClick={() => setSheetOpen(true)}
                        className="px-6 py-3 bg-primary text-primary-foreground text-[0.7rem] uppercase tracking-[0.4em] font-bold rounded-xl disabled:opacity-50"
                      >
                        Suscribirse
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Elige frecuencia, cantidad y dirección de entrega en el siguiente paso.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('intervalEmpty')}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in-50 duration-300">
          {reservasData ? (
            <ReservasClient
              preOrders={reservasData.preOrders}
              featuredProduct={reservasData.featuredProduct}
              cmsSettings={reservasData.cmsSettings}
              embedded
            />
          ) : (
            <div className="p-10 rounded-3xl bg-card border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No hay convocatorias de reserva anual abiertas en este momento.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedProductId && sheetOpen ? (
        <ReplenishmentSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          product={products.find((p) => p.id === selectedProductId)!}
        />
      ) : null}

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title={t('cancelTitle')}
        description={t('cancelConfirm')}
        confirmLabel={t('confirmCancel')}
        cancelLabel={t('back')}
        variant="destructive"
        loading={manageLoading}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}