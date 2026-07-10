'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { getConsignacionIssues, useFeriaContext } from '@/components/pos/feria-context';
import { useSumUp } from '@/components/pos/sumup-context';
import { SumupTerminalFlow } from '@/components/pos/sumup-terminal-flow';
import type { VentaChannel, PaymentMethod, TerminalFlowResult } from '@/components/pos/types';
import { HexagonLoader, ViewLoadingPlaceholder } from '@enjambre/ui';
import { buildClaimUrl } from '@/lib/public-urls';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2, QrCode, ArrowLeft, Banknote, CreditCard, Smartphone, Store, Truck, Building2, Users, Nfc, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'debito', label: 'Debito', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'transferencia', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'tarjeta_pos', label: 'Terminal', icon: <Nfc className="w-4 h-4" /> },
];

const channels: { value: VentaChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'feria', label: 'Feria', icon: <Store className="w-4 h-4" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="w-4 h-4" /> },
  { value: 'local', label: 'Local', icon: <Building2 className="w-4 h-4" /> },
  { value: 'corporativo', label: 'Corp', icon: <Building2 className="w-4 h-4" /> },
  { value: 'referido', label: 'Referido', icon: <Users className="w-4 h-4" /> },
];

type CheckoutMode = 'standard' | 'terminal';

export default function CarritoView() {
  const router = useRouter();
  const { lines, setQty, removeLine, clear, total, ready } = useCart();
  const { session, cartSale } = useCashSession();
  const { active: feriaActiva, consignaciones, refresh: refreshFeria } = useFeriaContext();
  const { setTerminalStep, sumupMode, setSumupMode } = useSumUp();
  const [channel, setChannel] = useState<VentaChannel>('feria');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; claim_token?: string; commission?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('standard');
  const [terminalComplete, setTerminalComplete] = useState<TerminalFlowResult | null>(null);

  const isSessionOpen = session?.session_status === 'open';

  const consignacionIssues = getConsignacionIssues(lines, consignaciones, {
    channel,
    eventoActivo: feriaActiva,
  });
  const hasConsignacionBlock = consignacionIssues.length > 0;

  const confirmarVenta = useCallback(async () => {
    setError(null);
    if (lines.length === 0) return;
    if (hasConsignacionBlock) {
      setError('Corrige el stock consignado antes de confirmar la venta feria');
      return;
    }

    if (metodoPago === 'tarjeta_pos') {
      if (sumupMode === 'connected') {
        setCheckoutMode('terminal');
        setTerminalStep('selecting_reader');
        return;
      }
      // If manual mode, it falls through to regular immediate checkout.
    }

    setLoading(true);
    try {
      if (isSessionOpen) {
        const cartItems = lines.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        }));

        const metodoBff = metodoPago === 'debito' ? 'tarjeta' : metodoPago === 'tarjeta_pos' ? 'pos_terminal' : metodoPago;
        const result = await cartSale(cartItems, metodoBff, channel);
        if (!result) {
          setError('No se pudo registrar la venta en la sesion de caja');
          return;
        }
        setSuccessData({ id: result.id, commission: result.rep_commission_total });
      } else {
        const items = lines.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal: l.precio_unitario * l.cantidad,
        }));

        const res = await fetch('/api/pos/venta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origen: channel === 'feria' || channel === 'local' ? channel : 'feria',
            total,
            items,
            metodo_pago: metodoPago === 'debito' ? 'tarjeta' : metodoPago === 'tarjeta_pos' ? 'pos_terminal' : metodoPago,
            estado: 'confirmado',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Error al registrar la venta');
          return;
        }
        setSuccessData({ id: data.id, claim_token: data.claim_token });
      }
      clear();
      void refreshFeria();
    } catch (err) {
      console.error('[carrito] sale error:', err);
      const msg = err instanceof Error ? err.message : 'Error de conexion con el servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lines, metodoPago, isSessionOpen, channel, total, cartSale, clear, hasConsignacionBlock, refreshFeria]);

  const handleTerminalComplete = useCallback(async (terminalResult: TerminalFlowResult) => {
    setTerminalComplete(terminalResult);
    setLoading(true);
    try {
      if (isSessionOpen) {
        const cartItems = lines.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        }));

        const result = await cartSale(cartItems, 'pos_terminal', channel, {
          sumup_checkout_id: terminalResult.checkout_id,
          sumup_transaction_id: terminalResult.transaction_id,
        });
        if (!result) {
          setError('No se pudo registrar la venta en la sesion de caja');
          return;
        }
        setSuccessData({ id: result.id, commission: result.rep_commission_total });
      }
      clear();
      void refreshFeria();
    } catch (err) {
      console.error('[carrito] terminal sale error:', err);
      const msg = err instanceof Error ? err.message : 'Error al registrar la venta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lines, isSessionOpen, channel, cartSale, clear, refreshFeria]);

  const handleTerminalCancel = useCallback(() => {
    setCheckoutMode('standard');
    setTerminalStep('idle');
  }, [setTerminalStep]);

  if (!ready) {
    return <ViewLoadingPlaceholder label="Sincronizando carrito" className="py-20" />;
  }

  if (successData) {
    const claimUrl = successData.claim_token ? buildClaimUrl(successData.claim_token) : null;

    const co2Saved = lines.reduce((acc, l) => acc + (l.cantidad * 0.5 * 2.4), 0);

    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-4xl font-serif mb-4">Venta Exitosa</h1>

        <div className="card-glow p-6 mb-8 text-center space-y-2 border-success/20 bg-success/5 max-w-sm mx-auto">
          <p className="text-xs text-success font-bold uppercase tracking-widest">Impacto Regenerativo</p>
          <div className="font-serif text-4xl text-foreground">
            ~{co2Saved.toFixed(1)} <span className="text-xl italic">kg CO2</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Evitado gracias a esta compra</p>
        </div>

        {successData.commission != null && (
          <p className="text-primary text-2xl font-mono font-bold mb-2">
            +${successData.commission.toLocaleString('es-CL')} comision
          </p>
        )}
        <p className="text-muted-foreground mb-12 font-light">
          {claimUrl
            ? 'La transaccion ha sido registrada. Pide al cliente que escanee el codigo para reclamar su impacto y puntos.'
            : 'La transaccion ha sido registrada en la sesion de caja.'}
        </p>

        {claimUrl && (
          <div className="bg-surface-raised p-8 rounded-3xl inline-block shadow-2xl mb-12">
            <QRCodeSVG value={claimUrl} size={240} level="H" includeMargin />
            <p className="mt-4 text-primary-foreground font-mono text-[10px] uppercase tracking-tighter opacity-40">
              ID: {successData.id.slice(0, 8)}...
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            onClick={() => { setSuccessData(null); setCheckoutMode('standard'); router.push('/pos/catalogo'); }}
            className="w-full py-4 bg-card hover:bg-card text-foreground rounded-full font-medium transition-all"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif">Carrito</h1>
          <Link href="/pos/catalogo" className="text-primary flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al catalogo
          </Link>
        </div>

        {!lines.length ? (
          <div className="bg-card border border-border border-dashed rounded-3xl p-20 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-light">No hay productos en el carrito.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lines.map((l) => (
              <div
                key={l.producto_id}
                className="flex items-center gap-6 bg-card border border-border p-6 rounded-3xl transition-all hover:border-border"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-1">{l.nombre}</h3>
                  <p className="text-muted-foreground text-sm font-light">Precio unitario: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario)}</p>
                </div>

                <div className="flex items-center gap-4 bg-background rounded-full border border-border p-1">
                  <button
                    onClick={() => setQty(l.producto_id, Math.max(1, l.cantidad - 1))}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold">{l.cantidad}</span>
                  <button
                    onClick={() => setQty(l.producto_id, l.cantidad + 1)}
                    className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="font-mono font-bold text-primary">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario * l.cantidad)}
                  </p>
                </div>

                <button
                  onClick={() => removeLine(l.producto_id)}
                  className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-card border border-border p-8 rounded-3xl sticky top-32">
          <h2 className="text-xl font-serif mb-6 pb-6 border-b border-border">Resumen de Venta</h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-muted-foreground font-light">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}</span>
            </div>

            {channel === 'feria' && feriaActiva && consignacionIssues.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Consignación insuficiente
                </div>
                <ul className="space-y-1 text-xs text-foreground/80">
                  {consignacionIssues.map((issue) => (
                    <li key={issue.producto_id}>
                      {issue.tipo === 'sin_consignacion'
                        ? `${issue.nombre}: no consignado para este evento`
                        : `${issue.nombre}: ${issue.pendiente} disponible, ${issue.solicitado} en carrito`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Canal de Venta</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.value}
                    onClick={() => setChannel(ch.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border min-h-[44px] px-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
                      channel === ch.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-primary'
                    }`}
                  >
                    {ch.icon}
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            {isSessionOpen && checkoutMode === 'standard' && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Metodo de Pago</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      onClick={() => setMetodoPago(pm.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border min-h-[44px] px-3 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                        metodoPago === pm.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-primary'
                      }`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
                {metodoPago === 'tarjeta_pos' && (
                  <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-widest">Modo SumUp</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {sumupMode === 'connected' ? 'La app enviará el monto al lector.' : 'Ingreso manual directo en el POS.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSumupMode(sumupMode === 'connected' ? 'manual' : 'connected')}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${sumupMode === 'connected' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${sumupMode === 'connected' ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {isSessionOpen && checkoutMode === 'terminal' && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Pago con Terminal SumUp</label>
                <SumupTerminalFlow
                  amount={total}
                  checkoutReference={`campo-cart-${Date.now()}`}
                  description={`Carrito: ${lines.length} productos`}
                  onComplete={handleTerminalComplete}
                  onCancel={handleTerminalCancel}
                />
              </div>
            )}
          </div>

          {checkoutMode === 'standard' && (
            <>
              <div className="flex justify-between items-end mb-8">
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Total</span>
                <span className="text-4xl font-serif text-primary">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}
                </span>
              </div>

              <button
                onClick={() => void confirmarVenta()}
                disabled={loading || lines.length === 0 || hasConsignacionBlock}
                className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-2xl shadow-primary/10 transition-all transform active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <HexagonLoader size="sm" />
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Confirmar Venta
                    <QrCode className="w-5 h-5" />
                  </div>
                )}
              </button>
            </>
          )}

          {error && (
            <p className="mt-4 text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-center animate-pulse">
              {error}
            </p>
          )}

          <p className="mt-6 text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
            Se generara un QR dinamico para el reclamo de puntos guardian e impacto biocultural.
          </p>
        </div>
      </div>
    </div>
  );
}
