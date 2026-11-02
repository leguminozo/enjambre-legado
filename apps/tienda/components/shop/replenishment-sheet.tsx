'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { createClient } from '@/utils/supabase/client';
import type { ShopProduct } from '@/lib/shop/products';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';
import { formatCLP } from '@/lib/shop/format';
import { TiendaModal } from '@/components/shop/tienda-modal';
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
};

const FREQUENCIES: { key: 'monthly' | 'quarterly' | 'annual'; label: string }[] = [
  { key: 'monthly', label: 'Mensual' },
  { key: 'quarterly', label: 'Trimestral' },
  { key: 'annual', label: 'Anual' },
];

export function ReplenishmentSheet({ open, onClose, product }: ReplenishmentSheetProps) {
  const t = useTranslations('perfil.reposicion');
  const tSheet = useTranslations('perfil.reposicion.sheet');

  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [direcciones, setDirecciones] = useState<ClienteDireccion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFrequency('monthly');
    setQuantity(1);

    const supabase = createClient();
    supabase
      .from('cliente_direcciones')
      .select('*')
      .order('es_predeterminada', { ascending: false })
      .then((res: { data: unknown }) => {
        const data = res.data as ClienteDireccion[] | null;
        if (data && data.length > 0) {
          const list = data;
          setDirecciones(list);
          const def = list.find((d) => d.es_predeterminada) || list[0];
          if (def) {
            const formatted = [def.direccion, def.comuna, def.ciudad, def.region].filter(Boolean).join(', ');
            setAddress(formatted);
            return;
          }
        }
        setAddress(loadReplenishmentAddress());
      })
      .catch(() => {
        setAddress(loadReplenishmentAddress());
      });
  }, [open]);

  const unitPrice = product.price ?? 0;
  const total = unitPrice * quantity;

  const handleConfirm = async () => {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      toast(t('addressRequired'), { type: 'error' });
      return;
    }

    saveReplenishmentAddress(trimmed);
    setLoading(true);
    const result = await startSubscriptionCheckout(undefined, {
      productId: product.id,
      frequency,
      quantity,
      deliveryAddress: trimmed,
    });
    if (!result.ok) {
      toast(result.message, { type: 'error' });
      setLoading(false);
    }
  };

  const footer = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={loading}
        className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm py-3 disabled:opacity-50"
      >
        {loading ? t('processing') : t('confirm')}
      </button>
    </div>
  );

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      title={tSheet('title') ?? 'Programar reposición'}
      footer={footer}
      data-testid="replenishment-sheet"
    >
      <div className="space-y-6">
        <section>
          <h4 className="tienda-replenishment-section-label">{tSheet('product')}</h4>
          <div className="mt-3 rounded-xl border border-border bg-secondary/30 p-4">
            <p className="font-display text-foreground">{product.name}</p>
            {product.format ? (
              <p className="mt-1 text-xs text-muted-foreground">{product.format}</p>
            ) : null}
            <p className="mt-2 text-sm text-accent-text">{formatCLP(product.price)}</p>
          </div>
        </section>

        <section>
          <h4 className="tienda-replenishment-section-label">{tSheet('interval')}</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {FREQUENCIES.map((f) => {
              const active = f.key === frequency;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFrequency(f.key)}
                  className={`min-h-11 rounded-xl border p-4 text-left transition-all ${
                    active
                      ? 'border-accent bg-accent/10 ring-2 ring-accent shadow-sm'
                      : 'border-border bg-card hover:border-accent/25'
                  }`}
                >
                  <span className="block uppercase tracking-[0.2em] text-accent-text font-bold text-[0.6rem]">
                    {f.label}
                  </span>
                  <span className="block mt-2 text-sm text-foreground font-semibold">
                    {formatCLP(total)} <span className="text-xs text-muted-foreground font-normal">/ ciclo</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Calendar size={14} className="text-accent" />
              Cantidad por entrega
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
            >
              -
            </button>
            <span className="w-8 text-center font-mono text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(24, q + 1))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
            >
              +
            </button>
          </div>
        </section>

        <ReplenishmentAddressField value={address} onChange={setAddress} direcciones={direcciones} />

        <section className="rounded-xl border border-border/80 bg-secondary/20 p-4">
          <h4 className="tienda-replenishment-section-label mb-3">{tSheet('summary')}</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{tSheet('reference')}</dt>
              <dd className="text-foreground text-right">{product.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{tSheet('interval')}</dt>
              <dd className="text-foreground text-right">
                {FREQUENCIES.find((f) => f.key === frequency)?.label}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Cantidad</dt>
              <dd className="text-foreground text-right">{quantity}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2">
              <dt className="text-muted-foreground font-medium">{tSheet('total')}</dt>
              <dd className="font-display text-accent-text">{formatCLP(total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </TiendaModal>
  );
}
