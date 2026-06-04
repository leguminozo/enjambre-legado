'use client';

import { useState } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { Plus, Zap, Banknote, CreditCard, Smartphone, Loader2, CheckCircle2, Store, Truck, Building2, Users, Crown, Radio } from 'lucide-react';

interface Props {
  producto_id: string;
  nombre: string;
  precio: number;
}

type Step = 'idle' | 'qty' | 'channel' | 'pay' | 'done';

const channels = [
  { value: 'feria', label: 'Feria', icon: <Store className="w-4 h-4" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="w-4 h-4" /> },
  { value: 'local', label: 'Local', icon: <Building2 className="w-4 h-4" /> },
  { value: 'corporativo', label: 'Corp', icon: <Building2 className="w-4 h-4" /> },
  { value: 'referido', label: 'Referido', icon: <Users className="w-4 h-4" /> },
];

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'debito', label: 'Débito', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'transferencia', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
];

export function QuickSaleButton({ producto_id, nombre, precio }: Props) {
  const { addLine } = useCart();
  const { session, quickSale } = useCashSession();
  const [step, setStep] = useState<Step>('idle');
  const [qty, setQty] = useState(1);
  const [channel, setChannel] = useState<string>('feria');
  const [loading, setLoading] = useState(false);
  const [lastCommission, setLastCommission] = useState<number | null>(null);
  const [lastCommissionDetail, setLastCommissionDetail] = useState<{
    tier_multiplier: number;
    channel_rate: number | null;
    volume_multiplier: number;
    loyalty_bonus: number;
    streak_bonus: number;
    total: number;
  } | null>(null);

  const isSessionOpen = session?.session_status === 'open';

  if (!isSessionOpen) {
    return (
      <button
        type="button"
        onClick={() => addLine({ producto_id, nombre, precio_unitario: precio })}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all"
      >
        <Plus className="w-3 h-3" />
        Añadir al carrito
      </button>
    );
  }

  if (step === 'done') {
    const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL');
    const hasExtras = lastCommissionDetail && (
      lastCommissionDetail.volume_multiplier > 1 ||
      lastCommissionDetail.loyalty_bonus > 0 ||
      lastCommissionDetail.streak_bonus > 0 ||
      lastCommissionDetail.tier_multiplier > 1
    );

    return (
      <div className="mt-4 w-full space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-green-400">
            +{lastCommission !== null ? fmtCLP(lastCommission) : 'Vendido'}
          </span>
          <button
            onClick={() => { setStep('idle'); setQty(1); setChannel('feria'); setLastCommission(null); setLastCommissionDetail(null); }}
            className="ml-2 text-muted-foreground hover:text-foreground text-xs normal-case tracking-normal font-normal"
          >
            OK
          </button>
        </div>

        {hasExtras && lastCommissionDetail && (
          <div className="rounded-xl bg-background/40 border border-border px-3 py-2.5 space-y-1.5">
            {lastCommissionDetail.tier_multiplier > 1 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Crown className="w-3 h-3" />
                  Tier ×{lastCommissionDetail.tier_multiplier.toFixed(1)}
                </span>
                <span className="text-muted-foreground">Amplifica todo</span>
              </div>
            )}
            {lastCommissionDetail.channel_rate !== null && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Radio className="w-3 h-3" />
                  Canal {channel}
                </span>
                <span className="text-muted-foreground">{(lastCommissionDetail.channel_rate * 100).toFixed(0)}%</span>
              </div>
            )}
            {lastCommissionDetail.volume_multiplier > 1 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-primary">Volumen</span>
                <span className="text-muted-foreground">×{lastCommissionDetail.volume_multiplier.toFixed(1)}</span>
              </div>
            )}
            {lastCommissionDetail.loyalty_bonus > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-purple-400">Fidelización</span>
                <span className="text-muted-foreground">+{fmtCLP(lastCommissionDetail.loyalty_bonus)}</span>
              </div>
            )}
            {lastCommissionDetail.streak_bonus > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-orange-400">Racha</span>
                <span className="text-muted-foreground">+{fmtCLP(lastCommissionDetail.streak_bonus)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] border-t border-border pt-1.5">
              <span className="text-foreground font-bold">Comisión total</span>
              <span className="text-primary font-bold">{fmtCLP(lastCommissionDetail.total)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'channel') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center">
          {qty}× {nombre} · ${' '}{(precio * qty).toLocaleString('es-CL')}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {channels.map((ch) => (
            <button
              key={ch.value}
              onClick={() => { setChannel(ch.value); setStep('pay'); }}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all ${
                channel === ch.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-primary'
              }`}
            >
              {ch.icon}
              {ch.label}
            </button>
          ))}
        </div>
        <button onClick={() => setStep('qty')} className="w-full text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors">
          ← Cambiar cantidad
        </button>
      </div>
    );
  }

  if (step === 'pay') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center">
          {qty}× {nombre} · ${' '}{(precio * qty).toLocaleString('es-CL')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.value}
              disabled={loading}
              onClick={async () => {
                setLoading(true);
              try {
                const result = await quickSale(producto_id, qty, pm.value, channel);
                if (result) {
                  setLastCommission(result.rep_commission_total);
                  if (result.commission) {
                    setLastCommissionDetail({
                      tier_multiplier: result.commission.tier_multiplier,
                      channel_rate: result.commission.channel_rate,
                      volume_multiplier: result.commission.volume_multiplier,
                      loyalty_bonus: result.commission.loyalty_bonus,
                      streak_bonus: result.commission.streak_bonus,
                      total: result.commission.total,
                    });
                  }
                }
                setStep('done');
                } catch {
                  setStep('idle');
                  setQty(1);
                } finally {
                  setLoading(false);
                }
              }}
              className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border px-2 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : pm.icon}
              {pm.label}
            </button>
          ))}
    </div>
    <button onClick={() => setStep('channel')} className="w-full text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors">
        ← Cambiar canal
      </button>
  </div>
);
}

if (step === 'qty') {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold">
            −
          </button>
          <span className="text-2xl font-mono font-bold text-foreground w-10 text-center">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold">
            +
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Total: <strong className="text-foreground">${(precio * qty).toLocaleString('es-CL')}</strong>
        </p>
        <button
      onClick={() => setStep('channel')}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
    >
      <Zap className="w-3 h-3" />
      Canal de venta →
        </button>
        <button onClick={() => { setStep('idle'); setQty(1); setChannel('feria'); }} className="w-full text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors">
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep('qty')}
      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
    >
      <Zap className="w-3 h-3" />
      Venta rápida
    </button>
  );
}
