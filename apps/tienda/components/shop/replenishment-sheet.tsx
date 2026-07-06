'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CreditCard, Repeat } from 'lucide-react';
import { toast } from '@enjambre/ui';
import type { ShopProduct } from '@/lib/shop/products';
import type { ReplenishmentPlan } from '@/lib/shop/replenishment';
import { suggestPlanForProduct } from '@/lib/shop/replenishment';
import { translateFrequency } from '@/lib/shop/replenishment-i18n';
import { formatCLP } from '@/lib/shop/format';
import { TiendaModal } from '@/components/shop/tienda-modal';
import { PlanIntervalPicker } from '@/components/shop/plan-interval-picker';
import { ReplenishmentAddressField } from '@/components/shop/replenishment-address-field';
import {
  loadReplenishmentAddress,
  saveReplenishmentAddress,
} from '@/lib/shop/replenishment-address';
import { startSubscriptionCheckout } from '@/lib/shop/subscription-checkout-client';

type ReplenishmentSheetProps = {
  open: boolean;
  onClose: () => void;
  product: ShopProduct;
  plans: ReplenishmentPlan[];
};

export function ReplenishmentSheet({ open, onClose, product, plans }: ReplenishmentSheetProps) {
  const t = useTranslations('perfil.reposicion');
  const tSheet = useTranslations('perfil.reposicion.sheet');

  const suggested = useMemo(
    () => suggestPlanForProduct(product.id, plans),
    [product.id, plans],
  );
  const [selectedPlanId, setSelectedPlanId] = useState(suggested?.id ?? plans[0]?.id ?? '');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedPlanId(suggested?.id ?? plans[0]?.id ?? '');
    setAddress(loadReplenishmentAddress());
  }, [open, suggested?.id, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const handleConfirm = async () => {
    if (!selectedPlanId) {
      toast(t('selectInterval'), { type: 'error' });
      return;
    }
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      toast(t('addressRequired'), { type: 'error' });
      return;
    }

    saveReplenishmentAddress(trimmed);
    setLoading(true);
    const result = await startSubscriptionCheckout(selectedPlanId, { deliveryAddress: trimmed });
    if (!result.ok) {
      toast(result.message, { type: 'error' });
      setLoading(false);
    }
  };

  const footer = (
    <div className="space-y-3">
      {selectedPlan ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{tSheet('total')}</span>
          <span className="font-display text-lg text-accent">{formatCLP(selectedPlan.price_clp)}</span>
        </div>
      ) : null}
      <button
        type="button"
        disabled={loading || plans.length === 0}
        onClick={() => void handleConfirm()}
        className="w-full rounded-xl bg-accent px-6 py-3.5 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-accent-foreground transition hover:shadow-glow disabled:opacity-50"
      >
        {loading ? t('processing') : t('confirm')}
      </button>
      <p className="text-center text-[0.65rem] text-muted-foreground">{t('billingNote')}</p>
    </div>
  );

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      size="lg"
      kicker={tSheet('kicker')}
      testId="replenishment-sheet"
      title={tSheet('title')}
      subtitle={product.name}
      footer={footer}
    >
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tSheet('unavailable')}</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h4 className="tienda-replenishment-section-label">{tSheet('product')}</h4>
            <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-4">
              <p className="font-display text-foreground">{product.name}</p>
              {product.format ? (
                <p className="mt-1 text-xs text-muted-foreground">{product.format}</p>
              ) : null}
              <p className="mt-2 text-sm text-accent">{formatCLP(product.price)}</p>
            </div>
          </section>

          <section>
            <h4 className="tienda-replenishment-section-label">{tSheet('interval')}</h4>
            <div className="mt-3">
              <PlanIntervalPicker
                plans={plans}
                selectedPlanId={selectedPlanId}
                onSelect={setSelectedPlanId}
                variant="compact"
              />
            </div>
          </section>

          <ReplenishmentAddressField value={address} onChange={setAddress} />

          <section>
            <h4 className="tienda-replenishment-section-label">
              <span className="inline-flex items-center gap-2">
                <CreditCard size={14} className="text-accent" />
                {tSheet('payment')}
              </span>
            </h4>
            <div className="mt-3 rounded-xl border border-border bg-card/60 p-4 space-y-2">
              <p className="text-sm text-foreground">{tSheet('paymentMethods')}</p>
              <p className="text-xs text-muted-foreground">{tSheet('paymentNote')}</p>
              <Link
                href="/perfil/pasaporte"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                onClick={onClose}
              >
                <Repeat size={12} />
                {tSheet('passport')}
              </Link>
            </div>
          </section>

          {selectedPlan ? (
            <section className="rounded-xl border border-border/80 bg-secondary/20 p-4">
              <h4 className="tienda-replenishment-section-label mb-3">{tSheet('summary')}</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tSheet('reference')}</dt>
                  <dd className="text-foreground text-right">{product.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tSheet('plan')}</dt>
                  <dd className="text-foreground text-right">{selectedPlan.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{tSheet('interval')}</dt>
                  <dd className="text-foreground text-right">
                    {translateFrequency(t, selectedPlan.frequency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-2">
                  <dt className="text-muted-foreground font-medium">{tSheet('total')}</dt>
                  <dd className="font-display text-accent">{formatCLP(selectedPlan.price_clp)}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      )}
    </TiendaModal>
  );
}