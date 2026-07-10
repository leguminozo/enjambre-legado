'use client';

import { useState, useCallback } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { useSumUp } from '@/components/pos/sumup-context';
import { SumupTerminalFlow } from '@/components/pos/sumup-terminal-flow';
import type { PaymentMethod, TerminalFlowResult } from '@/components/pos/types';
import { HexagonLoader } from '@enjambre/ui';
import { Plus, Zap, Banknote, CreditCard, Smartphone, CheckCircle2, Store, Truck, Building2, Users, Crown, Radio, Nfc } from 'lucide-react';

interface Props {
  producto_id: string;
  nombre: string;
  precio: number;
}

type Step = 'idle' | 'qty' | 'channel' | 'pay' | 'terminal' | 'done';

const channels = [
  { value: 'feria', label: 'Feria', icon: <Store className="w-4 h-4" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="w-4 h-4" /> },
  { value: 'local', label: 'Local', icon: <Building2 className="w-4 h-4" /> },
  { value: 'corporativo', label: 'Corp', icon: <Building2 className="w-4 h-4" /> },
  { value: 'referido', label: 'Referido', icon: <Users className="w-4 h-4" /> },
];

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'debito', label: 'Debito', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'transferencia', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'tarjeta_pos', label: 'Terminal', icon: <Nfc className="w-4 h-4" /> },
];

export function QuickSaleButton({ producto_id, nombre, precio }: Props) {
  const { addLine } = useCart();
  const { session, quickSale } = useCashSession();
  const { setTerminalStep, sumupMode } = useSumUp();
  const [step, setStep] = useState<Step>('idle');
  const [qty, setQty] = useState(1);
  const [channel, setChannel] = useState<string>('feria');
  const [loading, setLoading] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
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

  const handleSaleResult = useCallback((result: { rep_commission_total: number; commission?: { tier_multiplier: number; channel_rate: number | null; volume_multiplier: number; loyalty_bonus: number; streak_bonus: number; total: number } } | null) => {
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
  }, []);

  const handlePayment = useCallback(async (pm: PaymentMethod) => {
    if (pm === 'tarjeta_pos') {
      if (sumupMode === 'connected') {
        setTerminalStep('selecting_reader');
        setStep('terminal');
        return;
      }
    }

    setLoading(true);
    setSaleError(null);
    try {
      const metodoPago = pm === 'debito' ? 'tarjeta' : pm === 'tarjeta_pos' ? 'pos_terminal' : pm;
      const result = await quickSale(producto_id, qty, metodoPago, channel);
      handleSaleResult(result);
      setStep('done');
    } catch (error) {
      console.error('[quick-sale] error:', error);
      setSaleError(error instanceof Error ? error.message : 'No se pudo registrar la venta');
      setStep('pay');
    } finally {
      setLoading(false);
    }
  }, [quickSale, producto_id, qty, channel, handleSaleResult, setTerminalStep]);

  const handleTerminalComplete = useCallback(async (terminalResult: TerminalFlowResult) => {
    setLoading(true);
    setSaleError(null);
    try {
      const result = await quickSale(producto_id, qty, 'pos_terminal', channel, {
        sumup_checkout_id: terminalResult.checkout_id,
        sumup_transaction_id: terminalResult.transaction_id,
      });
      handleSaleResult(result);
      setStep('done');
    } catch (error) {
      console.error('[quick-sale] terminal sale error:', error);
      setSaleError(error instanceof Error ? error.message : 'No se pudo registrar la venta');
      setStep('pay');
    } finally {
      setLoading(false);
    }
  }, [quickSale, producto_id, qty, channel, handleSaleResult]);

  const handleTerminalCancel = useCallback(() => {
    setStep('pay');
    setTerminalStep('idle');
  }, [setTerminalStep]);

  const resetFlow = useCallback(() => {
    setStep('idle');
    setQty(1);
    setChannel('feria');
    setSaleError(null);
    setLastCommission(null);
    setLastCommissionDetail(null);
    setTerminalStep('idle');
  }, [setTerminalStep]);

  if (!isSessionOpen) {
    return (
      <button
        type="button"
        onClick={() => addLine({ producto_id, nombre, precio_unitario: precio })}
        className="mt-4 w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-3 text-sm font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all"
      >
        <Plus className="w-4 h-4" />
        Anadir al carrito
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

    const co2Saved = qty * 0.5 * 2.4;

    return (
      <div className="mt-4 w-full space-y-2">
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-bold text-success">
              +{lastCommission !== null ? fmtCLP(lastCommission) : 'Vendido'}
            </span>
          </div>
          <p className="text-[10px] text-success/80 font-medium uppercase tracking-tighter">
            ~{co2Saved.toFixed(1)}kg CO2 evitado hoy
          </p>
          <button
            onClick={resetFlow}
            className="mt-1 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest"
          >
            Siguiente venta
          </button>
        </div>

        {hasExtras && lastCommissionDetail && (
          <div className="rounded-xl bg-background/40 border border-border px-3 py-2.5 space-y-1.5">
            {lastCommissionDetail.tier_multiplier > 1 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-warning">
                  <Crown className="w-3 h-3" />
                  Tier x{lastCommissionDetail.tier_multiplier.toFixed(1)}
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
                <span className="text-muted-foreground">x{lastCommissionDetail.volume_multiplier.toFixed(1)}</span>
              </div>
            )}
            {lastCommissionDetail.loyalty_bonus > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-purple-400">Fidelizacion</span>
                <span className="text-muted-foreground">+{fmtCLP(lastCommissionDetail.loyalty_bonus)}</span>
              </div>
            )}
            {lastCommissionDetail.streak_bonus > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-accent">Racha</span>
                <span className="text-muted-foreground">+{fmtCLP(lastCommissionDetail.streak_bonus)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] border-t border-border pt-1.5">
              <span className="text-foreground font-bold">Comision total</span>
              <span className="text-primary font-bold">{fmtCLP(lastCommissionDetail.total)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'terminal') {
    return (
      <div className="mt-4 w-full">
        <SumupTerminalFlow
          amount={precio * qty}
          checkoutReference={`campo-qs-${producto_id}-${Date.now()}`}
          description={`${qty}x ${nombre}`}
          onComplete={handleTerminalComplete}
          onCancel={handleTerminalCancel}
        />
      </div>
    );
  }

  if (step === 'channel') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center">
          {qty}x {nombre} · ${' '}{(precio * qty).toLocaleString('es-CL')}
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {channels.map((ch) => (
            <button
              key={ch.value}
              onClick={() => { setChannel(ch.value); setStep('pay'); }}
              className={`flex flex-col items-center gap-1 rounded-xl border min-h-[44px] px-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                channel === ch.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-primary'
              }`}
            >
              {ch.icon}
              {ch.label}
            </button>
          ))}
        </div>
        <button onClick={() => setStep('qty')} className="w-full text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors">
          Cambiar cantidad
        </button>
      </div>
    );
  }

  if (step === 'pay') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center">
          {qty}x {nombre} · ${' '}{(precio * qty).toLocaleString('es-CL')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.value}
              disabled={loading}
              onClick={() => void handlePayment(pm.value)}
              className="flex flex-col items-center gap-1.5 rounded-xl min-h-[44px] bg-card border border-border px-3 py-3 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40"
            >
              {loading ? <HexagonLoader size="sm" /> : pm.icon}
              {pm.label}
            </button>
          ))}
        </div>
        {saleError && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg border border-destructive/20 text-center">
            {saleError}
          </p>
        )}
        <button onClick={() => setStep('channel')} className="w-full text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-muted-foreground transition-colors">
          Cambiar canal
        </button>
      </div>
    );
  }

  if (step === 'qty') {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold">
            -
          </button>
          <span className="text-2xl font-mono font-bold text-foreground w-10 text-center">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-11 h-11 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold">
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
          Canal de venta
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
      className="mt-4 w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
    >
      <Zap className="w-4 h-4" />
      Venta rapida
    </button>
  );
}
