'use client';

import { useState, useCallback } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { useFeriaContext } from '@/components/pos/feria-context';
import { useSumUp } from '@/components/pos/sumup-context';
import { SumupTerminalFlow } from '@/components/pos/sumup-terminal-flow';
import type { PaymentMethod, TerminalFlowResult } from '@/components/pos/types';
import { buildClaimUrl, getTiendaOrigin } from '@/lib/public-urls';
import { generateWhatsAppReceiptText, buildWhatsAppShareUrl } from '@/lib/pos-receipt';
import { formatCLP, HexagonLoader, friendlyError } from '@enjambre/ui';
import { ClpCurrencyInput } from '@/components/pos/clp-currency-input';
import { QRCodeSVG } from 'qrcode.react';
import {
  Plus,
  Minus,
  Zap,
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Store,
  Truck,
  Building2,
  Users,
  Crown,
  Radio,
  Nfc,
  QrCode,
  Share2,
  Check,
} from 'lucide-react';
import { getCashBillSuggestions } from '@/lib/cash-suggestions';

interface Props {
  producto_id: string;
  nombre: string;
  precio: number;
  stock?: number | null;
}

type Step = 'idle' | 'qty' | 'channel' | 'pay' | 'cash_calc' | 'terminal' | 'done';

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

export function QuickSaleButton({ producto_id, nombre, precio, stock }: Props) {
  const { addLine, lines } = useCart();
  const { session, quickSale, selectedClient } = useCashSession();
  const { whatsappTemplate } = useFeriaContext();
  const { setTerminalStep, sumupMode } = useSumUp();
  const [step, setStep] = useState<Step>('idle');
  const [qty, setQty] = useState(1);
  const [channel, setChannel] = useState<string>('feria');
  const [loading, setLoading] = useState(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastCommission, setLastCommission] = useState<number | null>(null);
  const [lastClaimToken, setLastClaimToken] = useState<string | null>(null);
  const [lastVuelto, setLastVuelto] = useState<number>(0);
  const [showQr, setShowQr] = useState(false);
  const [addedJustNow, setAddedJustNow] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState<number | ''>('');
  const [terminalCheckoutRef, setTerminalCheckoutRef] = useState<string>('');
  const [lastCommissionDetail, setLastCommissionDetail] = useState<{
    tier_multiplier: number;
    channel_rate: number | null;
    volume_multiplier: number;
    loyalty_bonus: number;
    streak_bonus: number;
    total: number;
  } | null>(null);

  const isSessionOpen = session?.session_status === 'open';
  const itemInCart = lines.find((l) => l.producto_id === producto_id);

  const handleSaleResult = useCallback((result: {
    rep_commission_total: number;
    claim_token?: string | null;
    commission?: {
      tier_multiplier: number;
      channel_rate: number | null;
      volume_multiplier: number;
      loyalty_bonus: number;
      streak_bonus: number;
      total: number;
    };
  } | null) => {
    if (result) {
      setLastCommission(result.rep_commission_total);
      if (result.claim_token) setLastClaimToken(result.claim_token);
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

  const handleAddToCart = useCallback(() => {
    addLine({ producto_id, nombre, precio_unitario: precio, cantidad: qty });
    setAddedJustNow(true);
    setTimeout(() => setAddedJustNow(false), 1500);
    setQty(1);
  }, [addLine, producto_id, nombre, precio, qty]);

  const executeSale = useCallback(async (metodoPago: string, fields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => {
    setLoading(true);
    setSaleError(null);
    try {
      const result = await quickSale(producto_id, qty, metodoPago, channel, fields);
      handleSaleResult(result);
      setStep('done');
    } catch (error) {
      console.error('[quick-sale] error:', error);
      setSaleError(friendlyError(error, 'No se pudo registrar la venta'));
      setStep('pay');
    } finally {
      setLoading(false);
    }
  }, [quickSale, producto_id, qty, channel, handleSaleResult]);

  const handlePayment = useCallback(async (pm: PaymentMethod) => {
    if (pm === 'tarjeta_pos') {
      if (sumupMode === 'connected') {
        setTerminalCheckoutRef(`campo-qs-${producto_id}-${Date.now()}`);
        setTerminalStep('selecting_reader');
        setStep('terminal');
        return;
      }
    }
    if (pm === 'efectivo') {
      setMontoRecibido(precio * qty);
      setStep('cash_calc');
      return;
    }
    const metodoPago = pm === 'debito' ? 'tarjeta' : pm === 'tarjeta_pos' ? 'pos_terminal' : pm;
    await executeSale(metodoPago);
  }, [sumupMode, setTerminalStep, precio, qty, executeSale, producto_id]);

  const handleTerminalComplete = useCallback(async (terminalResult: TerminalFlowResult) => {
    await executeSale('pos_terminal', {
      sumup_checkout_id: terminalResult.checkout_id,
      sumup_transaction_id: terminalResult.transaction_id,
    });
    setTerminalCheckoutRef('');
  }, [executeSale]);

  const handleTerminalCancel = useCallback(() => {
    setStep('pay');
    setTerminalStep('idle');
    setTerminalCheckoutRef('');
  }, [setTerminalStep]);

  const resetFlow = useCallback(() => {
    setStep('idle');
    setQty(1);
    setChannel('feria');
    setSaleError(null);
    setLastCommission(null);
    setLastClaimToken(null);
    setLastVuelto(0);
    setShowQr(false);
    setMontoRecibido('');
    setLastCommissionDetail(null);
    setTerminalStep('idle');
    setTerminalCheckoutRef('');
  }, [setTerminalStep]);

  if (stock !== null && stock !== undefined && stock <= 0) {
    return (
      <div className="mt-4 w-full min-h-[44px] flex items-center justify-center rounded-xl bg-muted/40 border border-border/60 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground select-none">
        Agotado
      </div>
    );
  }

  if (!isSessionOpen) {
    return (
      <div className="mt-3.5 space-y-2.5">
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              disabled={qty <= 1}
              className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              min={1}
              max={stock && stock > 0 ? stock : 999}
              value={qty}
              onChange={(e) => {
                if (e.target.value === '') {
                  setQty(1);
                  return;
                }
                const val = parseInt(e.target.value, 10);
                if (Number.isNaN(val)) return;
                const maxStock = stock && stock > 0 ? stock : 999;
                setQty(Math.max(1, Math.min(maxStock, val)));
              }}
              className="w-12 text-center font-mono font-bold text-base md:text-sm bg-transparent border-0 text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Cantidad a vender"
            />
            <button
              type="button"
              onClick={() => setQty((prev) => (stock && stock > 0 ? Math.min(stock, prev + 1) : prev + 1))}
              disabled={stock != null && stock > 0 ? qty >= stock : false}
              className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-right min-w-0 flex-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Subtotal</span>
            <span className="font-mono font-bold text-xs text-primary truncate block">
              {formatCLP(precio * qty)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {addedJustNow ? (
            <>
              <Check className="w-4 h-4 text-success" />
              <span className="text-success">¡Agregado al carrito!</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Añadir {qty > 1 ? `${qty} ` : ''}al carrito</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (step === 'done') {
    const hasExtras = lastCommissionDetail && (
      lastCommissionDetail.volume_multiplier > 1 ||
      lastCommissionDetail.loyalty_bonus > 0 ||
      lastCommissionDetail.streak_bonus > 0 ||
      lastCommissionDetail.tier_multiplier > 1
    );

    const claimUrl = lastClaimToken ? buildClaimUrl(lastClaimToken) : null;
    const shareText = generateWhatsAppReceiptText({
      clienteNombre: selectedClient?.full_name,
      total: precio * qty,
      lines: [{ nombre, cantidad: qty, precio_unitario: precio }],
      claimToken: lastClaimToken,
      customTemplate: whatsappTemplate,
    });
    const waShareUrl = buildWhatsAppShareUrl(shareText, selectedClient?.phone);

    return (
      <div className="mt-4 w-full space-y-2">
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-bold text-success">
              {lastCommission !== null
                ? lastCommission > 0
                  ? `+${formatCLP(lastCommission)} comisión`
                  : 'Comisión diferida (al sincronizar)'
                : 'Venta registrada'}
            </span>
          </div>
          <p className="text-[10px] text-primary/90 font-medium uppercase tracking-tighter">
            Predio Pureo · Conservación y conteo de flora nativa
          </p>
          {lastVuelto > 0 && (
            <p className="text-xs font-mono font-bold text-foreground mt-1">
              Vuelto entregado: <span className="text-success">{formatCLP(lastVuelto)}</span>
            </p>
          )}

          {claimUrl && (
            <div className="mt-2 w-full flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQr((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-widest hover:underline"
              >
                <QrCode className="w-3.5 h-3.5" />
                {showQr ? 'Ocultar QR Guardián' : 'Mostrar QR Guardián'}
              </button>
              {showQr && (
                <div className="p-3 bg-surface-raised rounded-2xl shadow-lg border border-border">
                  <QRCodeSVG value={claimUrl} size={150} level="H" includeMargin />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">Escanea para puntos</p>
                </div>
              )}
              <a
                href={waShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success border border-success/30 hover:bg-success/25 text-[10px] font-bold uppercase tracking-widest transition-colors w-full"
              >
                <Share2 className="w-3 h-3" />
                {selectedClient?.full_name
                  ? `Enviar WhatsApp a ${selectedClient.full_name}`
                  : 'Enviar Comprobante WhatsApp'}
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={resetFlow}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border/60 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
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
                <span className="flex items-center gap-1.5 text-info">
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
                <span className="text-purple-400">Fidelización</span>
                <span className="text-muted-foreground">+{formatCLP(lastCommissionDetail.loyalty_bonus)}</span>
              </div>
            )}
            {lastCommissionDetail.streak_bonus > 0 && (
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-accent">Racha</span>
                <span className="text-muted-foreground">+{formatCLP(lastCommissionDetail.streak_bonus)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] border-t border-border pt-1.5">
              <span className="text-foreground font-bold">Comisión total</span>
              <span className="text-primary font-bold">{formatCLP(lastCommissionDetail.total)}</span>
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
          checkoutReference={terminalCheckoutRef || `campo-qs-${producto_id}`}
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
          {qty}x {nombre} · {formatCLP(precio * qty)}
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
        <button
          type="button"
          onClick={() => setStep('qty')}
          className="w-full min-h-11 inline-flex items-center justify-center text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          Cambiar cantidad
        </button>
      </div>
    );
  }

  if (step === 'cash_calc') {
    const totalCobro = precio * qty;
    const recibidoNum = typeof montoRecibido === 'number' ? montoRecibido : 0;
    const vuelto = Math.max(0, recibidoNum - totalCobro);
    const montoInsuficiente = recibidoNum > 0 && recibidoNum < totalCobro;

    return (
      <div className="mt-4 space-y-3 bg-card border border-border p-3.5 rounded-2xl animate-in fade-in duration-200">
        <div className="text-center">
          <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Cobro en Efectivo</p>
          <p className="text-lg font-mono font-bold text-foreground">{formatCLP(totalCobro)}</p>
        </div>

        <div>
          <label className="text-[10px] uppercase text-muted-foreground tracking-wider block mb-1">
            Monto Recibido (CLP)
          </label>
          <ClpCurrencyInput
            value={montoRecibido}
            onChange={setMontoRecibido}
            placeholder={formatCLP(totalCobro)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {getCashBillSuggestions(totalCobro).map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => setMontoRecibido(btn.val)}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border text-[10px] font-mono text-foreground hover:border-primary transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Vuelto</span>
          <span className="text-lg font-mono font-bold text-success">
            {formatCLP(vuelto)}
          </span>
        </div>

        {montoInsuficiente && (
          <p className="text-[10px] text-destructive text-center">Monto recibido es menor al total</p>
        )}

        <button
          type="button"
          disabled={loading || montoInsuficiente}
          onClick={async () => {
            setLastVuelto(vuelto);
            await executeSale('efectivo');
          }}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-40"
        >
          {loading ? <HexagonLoader size="sm" /> : <Banknote className="w-4 h-4" />}
          Confirmar Cobro
        </button>

        <button
          type="button"
          onClick={() => setStep('pay')}
          className="w-full min-h-10 inline-flex items-center justify-center text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          Cambiar método
        </button>
      </div>
    );
  }

  if (step === 'pay') {
    return (
      <div className="mt-4 space-y-2">
        <p className="text-[10px] uppercase text-muted-foreground tracking-widest text-center">
          {qty}x {nombre} · {formatCLP(precio * qty)}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map((pm) => (
            <button
              key={pm.value}
              type="button"
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
        <button
          type="button"
          onClick={() => setStep('channel')}
          className="w-full min-h-11 inline-flex items-center justify-center text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          Cambiar canal
        </button>
      </div>
    );
  }

  if (step === 'qty') {
    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="min-h-11 min-w-11 w-11 h-11 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold"
            aria-label="Restar unidad"
          >
            -
          </button>
          <span className="text-2xl font-mono font-bold text-foreground w-10 text-center">{qty}</span>
          <button
            type="button"
            onClick={() => setQty(qty + 1)}
            className="min-h-11 min-w-11 w-11 h-11 rounded-full bg-card border border-border text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-lg font-bold"
            aria-label="Sumar unidad"
          >
            +
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Total: <strong className="text-foreground">{formatCLP(precio * qty)}</strong>
        </p>
        <button
          type="button"
          onClick={() => setStep('channel')}
          className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
        >
          <Zap className="w-3 h-3" />
          Canal de venta
        </button>
        <button
          type="button"
          onClick={() => { setStep('idle'); setQty(1); setChannel('feria'); }}
          className="w-full min-h-11 inline-flex items-center justify-center text-center text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5 space-y-2.5">
      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-surface-raised border border-border p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setQty((prev) => Math.max(1, prev - 1))}
            disabled={qty <= 1}
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Disminuir cantidad"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min={1}
            max={stock && stock > 0 ? stock : 999}
            value={qty}
            onChange={(e) => {
              if (e.target.value === '') {
                setQty(1);
                return;
              }
              const val = parseInt(e.target.value, 10);
              if (Number.isNaN(val)) return;
              const maxStock = stock && stock > 0 ? stock : 999;
              setQty(Math.max(1, Math.min(maxStock, val)));
            }}
            className="w-12 text-center font-mono font-bold text-base md:text-sm bg-transparent border-0 text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantidad a vender"
          />
          <button
            type="button"
            onClick={() => setQty((prev) => (stock && stock > 0 ? Math.min(stock, prev + 1) : prev + 1))}
            disabled={stock != null && stock > 0 ? qty >= stock : false}
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-right min-w-0 flex-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Subtotal</span>
          <span className="font-mono font-bold text-xs text-primary truncate block">
            {formatCLP(precio * qty)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all relative"
        >
          {addedJustNow ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success">¡{qty > 1 ? `+${qty}` : 'Agregado'}!</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>+ Carrito {qty > 1 ? `(${qty})` : ''}</span>
              {itemInCart && itemInCart.cantidad > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                  {itemInCart.cantidad}
                </span>
              ) : null}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('channel')}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Rápida {qty > 1 ? `(${qty})` : ''}</span>
        </button>
      </div>
    </div>
  );
}
