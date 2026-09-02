'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { getConsignacionIssues, useFeriaContext } from '@/components/pos/feria-context';
import { useSumUp } from '@/components/pos/sumup-context';
import { SumupTerminalFlow } from '@/components/pos/sumup-terminal-flow';
import { QrCameraScanner } from '@/components/pos/qr-camera-scanner';
import type { VentaChannel, PaymentMethod, TerminalFlowResult } from '@/components/pos/types';
import { HexagonLoader, ViewLoadingPlaceholder, formatCLP } from '@enjambre/ui';
import { buildClaimUrl } from '@/lib/public-urls';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2, QrCode, ArrowLeft, Banknote, CreditCard, Smartphone, Store, Truck, Building2, Users, Nfc, AlertTriangle, Shield, UserCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ViewShell } from '@/components/layout/ViewShell';

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

export function CarritoView() {
  const router = useRouter();
  const {
    lines,
    setQty,
    removeLine,
    addQrCode,
    removeQrCode,
    clear,
    total,
    subtotal,
    totals,
    discount,
    setDiscount,
    ready,
  } = useCart();
  const { session, cartSale } = useCashSession();
  const { active: feriaActiva, consignaciones, refresh: refreshFeria } = useFeriaContext();
  const { setTerminalStep, sumupMode, setSumupMode } = useSumUp();
  const [channel, setChannel] = useState<VentaChannel>('feria');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; claim_token?: string; commission?: number } | null>(null);
  const [fidIdentidad, setFidIdentidad] = useState('');
  const [miPunto, setMiPunto] = useState<{ nombre: string; url_landing: string } | null>(null);
  const apiFetch = useApiFetch();

  // El QR de la landing del punto de venta (percepción + puntos) disponible en el POS
  useEffect(() => {
    if (successData) return;
    apiFetch('/api/b2b/mi-punto')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data) setMiPunto({ nombre: data.data.punto.nombre, url_landing: data.data.url_landing });
      })
      .catch(() => {});
  }, [apiFetch, successData]);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('standard');
  const [scanningFor, setScanningFor] = useState<string | null>(null);

  // Guardián / Tarjeta Obrera Scan State
  const [scannedGuardian, setScannedGuardian] = useState<{
    userId: string;
    displayName: string;
    tier: string;
    puntos?: number;
    ciclos?: number;
  } | null>(null);
  const [isScanningGuardian, setIsScanningGuardian] = useState(false);
  const [resolvingGuardian, setResolvingGuardian] = useState(false);

  const handleGuardianQrScan = useCallback(async (token: string) => {
    setIsScanningGuardian(false);
    setResolvingGuardian(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/qr-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setScannedGuardian({
          userId: data.userId,
          displayName: data.displayName || 'Guardián',
          tier: data.tier || 'GUARDIÁN OBRERA',
          puntos: data.puntos ?? 0,
          ciclos: data.ciclos ?? 0,
        });
        setFidIdentidad(data.userId);

        if (data.tier?.includes('REINA')) {
          setDiscount({ kind: 'percent', value: 10 });
        } else if (data.tier?.includes('OBRERA')) {
          setDiscount({ kind: 'percent', value: 5 });
        }
      } else {
        setError(data.message || data.error || 'No se pudo identificar la Tarjeta Obrera');
      }
    } catch {
      setError('Error al resolver el código QR de la Tarjeta Obrera');
    } finally {
      setResolvingGuardian(false);
    }
  }, [setDiscount]);

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

    if (!isSessionOpen) {
      setError('Debes abrir una sesión de caja antes de registrar ventas en el POS');
      return;
    }

    setLoading(true);
    try {
      const cartItems = lines.map((l) => ({
        producto_id: l.producto_id,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        qr_codes: l.qr_codes,
      }));

      const metodoBff = metodoPago === 'debito' ? 'tarjeta' : metodoPago === 'tarjeta_pos' ? 'pos_terminal' : metodoPago;
      const discPayload =
        discount.kind === 'percent' && discount.value > 0
          ? { descuento_pct: discount.value }
          : discount.kind === 'fixed' && discount.value > 0
            ? { descuento_clp: discount.value }
            : undefined;
      const result = await cartSale(cartItems, metodoBff, channel, undefined, discPayload, fidIdentidad || undefined);
      if (!result) {
        setError('No se pudo registrar la venta en la sesion de caja');
        return;
      }
      setSuccessData({ id: result.id, commission: result.rep_commission_total });
      clear();
      void refreshFeria();
    } catch (err) {
      console.error('[carrito] sale error:', err);
      const msg = err instanceof Error ? err.message : 'Error de conexion con el servidor';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lines, metodoPago, isSessionOpen, channel, total, cartSale, clear, hasConsignacionBlock, refreshFeria, discount]);

  const handleTerminalComplete = useCallback(async (terminalResult: TerminalFlowResult) => {
    setLoading(true);
    try {
      if (isSessionOpen) {
        const cartItems = lines.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          qr_codes: l.qr_codes,
        }));

        const discPayload =
          discount.kind === 'percent' && discount.value > 0
            ? { descuento_pct: discount.value }
            : discount.kind === 'fixed' && discount.value > 0
              ? { descuento_clp: discount.value }
              : undefined;
        const result = await cartSale(
          cartItems,
          'pos_terminal',
          channel,
          {
            sumup_checkout_id: terminalResult.checkout_id,
            sumup_transaction_id: terminalResult.transaction_id,
          },
          discPayload,
          fidIdentidad || undefined,
        );
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
  }, [lines, isSessionOpen, channel, cartSale, clear, refreshFeria, discount, fidIdentidad]);

  const handleTerminalCancel = useCallback(() => {
    setCheckoutMode('standard');
    setTerminalStep('idle');
  }, [setTerminalStep]);

  if (!ready) {
    return <ViewLoadingPlaceholder label="Sincronizando carrito" className="py-20" />;
  }

  if (successData) {
    const claimUrl = successData.claim_token ? buildClaimUrl(successData.claim_token) : null;

    // Metodología pública: 1.2 kg CO₂e / frasco 500 g (ver /impacto en Núcleo)
    const co2Saved = lines.reduce((acc, l) => acc + l.cantidad * 1.2, 0);

    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] mb-4 text-balance">Venta Exitosa</h1>

        <div className="card-glow p-6 mb-8 text-center space-y-2 border-success/20 bg-success/5 max-w-sm mx-auto">
          <p className="text-xs text-success font-bold uppercase tracking-widest">Impacto Regenerativo</p>
          <div className="font-display text-[clamp(1.75rem,6vw,2.25rem)] text-foreground">
            ~{co2Saved.toFixed(1)} <span className="text-xl italic">kg CO2</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Evitado gracias a esta compra</p>
        </div>

        {successData.commission != null && (
          <p className="text-primary text-2xl font-mono font-bold mb-2">
            +{formatCLP(successData.commission)} comision
          </p>
        )}
        <p className="text-muted-foreground mb-12 font-light text-pretty">
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
            {miPunto && (
              <div className="mt-6 pt-6 border-t border-border/40 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-primary">Pulso y puntos — {miPunto.nombre}</p>
                <QRCodeSVG value={miPunto.url_landing} size={160} level="H" includeMargin className="mx-auto" />
                <p className="text-[10px] text-muted-foreground">
                  Invita al cliente a escanear: deja su percepción semántica y suma puntos.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => { setSuccessData(null); setCheckoutMode('standard'); router.push('/pos/catalogo'); }}
            className="w-full min-h-12 py-4 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-all"
          >
            Nueva Venta
          </button>
          <Link
            href="/pos"
            className="w-full inline-flex min-h-11 items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Volver al terminal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <ViewShell
            variant="compact"
            eyebrow="POS"
            title="Carrito"
            subtitle="Confirma canal, pago y stock consignado"
            icon={<ShoppingBag size={20} />}
            className="!mb-0"
          />
          <Link
            href="/pos/catalogo"
            className="text-primary flex items-center gap-2 text-sm font-medium hover:underline min-h-11"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>

        {!lines.length ? (
          <div className="bg-card border border-border border-dashed rounded-3xl p-10 sm:p-20 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-light mb-6">No hay productos en el carrito.</p>
            <Link
              href="/pos/catalogo"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {lines.map((l) => (
              <div key={l.producto_id} className="flex flex-col gap-2">
                <div
                  className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-card border border-border p-4 sm:p-6 rounded-3xl transition-all hover:border-border"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 text-balance">{l.nombre}</h3>
                    <p className="text-muted-foreground text-sm font-light">Precio unitario: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario)}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-4 bg-background rounded-full border border-border p-1">
                      <button
                        type="button"
                        onClick={() => setQty(l.producto_id, Math.max(1, l.cantidad - 1))}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-primary transition-colors"
                        aria-label="Restar unidad"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold">{l.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => setQty(l.producto_id, l.cantidad + 1)}
                        className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-primary transition-colors"
                        aria-label="Sumar unidad"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[5.5rem]">
                      <p className="font-mono font-bold text-primary">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario * l.cantidad)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setScanningFor(scanningFor === l.producto_id ? null : l.producto_id)}
                        className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-2xl transition-all relative ${scanningFor === l.producto_id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface'}`}
                        title="Asignar QR Trazabilidad"
                        aria-label="Asignar QR trazabilidad"
                      >
                        <QrCode className="w-5 h-5" />
                        {(l.qr_codes?.length || 0) > 0 && (
                          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                            {l.qr_codes!.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(l.producto_id)}
                        className="min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                        aria-label="Quitar del carrito"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {scanningFor === l.producto_id && (
                  <div className="bg-card border border-border p-6 rounded-3xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-sm text-foreground">Códigos QR asignados ({l.qr_codes?.length || 0} de {l.cantidad})</h4>
                    </div>
                    
                    {l.qr_codes && l.qr_codes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {l.qr_codes.map((code) => (
                          <div key={code} className="flex items-center gap-1 bg-surface-sunken border border-border pl-3 pr-1 py-1 rounded-lg text-xs font-mono text-foreground">
                            {code}
                            <button
                              type="button"
                              onClick={() => removeQrCode(l.producto_id, code)}
                              className="min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                              aria-label={`Quitar QR ${code}`}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(l.qr_codes?.length || 0) < l.cantidad ? (
                      <QrCameraScanner
                        onScan={(code) => {
                          addQrCode(l.producto_id, code);
                          if ((l.qr_codes?.length || 0) + 1 >= l.cantidad) {
                            setScanningFor(null);
                          }
                        }}
                      />
                    ) : (
                      <div className="text-sm text-success flex items-center gap-2 bg-success/10 p-3 rounded-xl border border-success/20">
                        <CheckCircle2 size={16} />
                        Has escaneado la cantidad máxima para este producto.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-card border border-border p-8 rounded-3xl sticky top-32">
          <h2 className="text-xl font-display mb-6 pb-6 border-b border-border">Resumen de Venta</h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-muted-foreground font-light">
              <span>Subtotal</span>
              <span>{formatCLP(subtotal)}</span>
            </div>

            {totals.descuentoClp > 0 && (
              <div className="flex justify-between items-center text-success font-light">
                <span>
                  Descuento
                  {totals.descuentoPct != null ? ` (${totals.descuentoPct}%)` : ''}
                </span>
                <span>−{formatCLP(totals.descuentoClp)}</span>
              </div>
            )}

            {/* Escáner de Tarjeta Obrera / Guardián */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  Tarjeta Obrera / Guardián
                </span>
                {scannedGuardian && (
                  <button
                    type="button"
                    onClick={() => {
                      setScannedGuardian(null);
                      setFidIdentidad('');
                      setDiscount({ kind: 'none' });
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <X size={12} />
                    Desvincular
                  </button>
                )}
              </div>

              {scannedGuardian ? (
                <div className="p-3 rounded-xl bg-background border border-primary/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={14} className="text-emerald-500" />
                      <span className="text-xs font-semibold text-foreground">{scannedGuardian.displayName}</span>
                    </div>
                    <p className="text-[10px] text-primary font-mono font-medium">{scannedGuardian.tier}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">Puntos</span>
                    <span className="font-mono text-xs font-bold text-foreground">{scannedGuardian.puntos?.toLocaleString('es-CL')} pts</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsScanningGuardian((prev) => !prev)}
                  disabled={resolvingGuardian}
                  className="w-full min-h-11 py-2.5 px-4 rounded-xl border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <QrCode size={16} />
                  <span>{resolvingGuardian ? 'Identificando...' : isScanningGuardian ? 'Cerrar Escáner' : 'Escanear Tarjeta Obrera'}</span>
                </button>
              )}

              {isScanningGuardian && (
                <div className="pt-2 animate-in fade-in duration-300">
                  <QrCameraScanner onScan={handleGuardianQrScan} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                Descuento feria
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { label: 'Sin dto', d: { kind: 'none' as const } },
                  { label: '5%', d: { kind: 'percent' as const, value: 5 } },
                  { label: '10%', d: { kind: 'percent' as const, value: 10 } },
                  { label: '15%', d: { kind: 'percent' as const, value: 15 } },
                  { label: '20%', d: { kind: 'percent' as const, value: 20 } },
                ].map((opt) => {
                  const active =
                    opt.d.kind === discount.kind &&
                    (opt.d.kind === 'none' ||
                      (opt.d.kind === 'percent' &&
                        discount.kind === 'percent' &&
                        opt.d.value === discount.value));
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setDiscount(opt.d)}
                      className={`min-h-10 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  placeholder="% custom"
                  className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={discount.kind === 'percent' ? discount.value : ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!e.target.value || Number.isNaN(v)) {
                      setDiscount({ kind: 'none' });
                      return;
                    }
                    setDiscount({ kind: 'percent', value: Math.min(50, Math.max(0, v)) });
                  }}
                />
                <input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="CLP fijo"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={discount.kind === 'fixed' ? discount.value : ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!e.target.value || Number.isNaN(v) || v <= 0) {
                      setDiscount({ kind: 'none' });
                      return;
                    }
                    setDiscount({ kind: 'fixed', value: Math.max(0, Math.round(v)) });
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Máx. 50%. El servidor recalcula sobre precios de catálogo.
              </p>
            </div>

            {channel === 'feria' && feriaActiva && consignacionIssues.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-warning text-xs font-bold uppercase tracking-widest">
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
                      role="switch"
                      aria-checked={sumupMode === 'connected'}
                      aria-label={sumupMode === 'connected' ? 'SumUp conectado' : 'SumUp manual'}
                      onClick={() => setSumupMode(sumupMode === 'connected' ? 'manual' : 'connected')}
                      className={`relative inline-flex h-11 min-w-[3.25rem] w-14 items-center rounded-full px-1 transition-colors ${sumupMode === 'connected' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-7 w-7 transform rounded-full bg-background shadow transition-transform ${sumupMode === 'connected' ? 'translate-x-5' : 'translate-x-0'}`} />
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
                  description={`Carrito: ${lines.length} productos${totals.descuentoClp > 0 ? ` (−${totals.descuentoClp} dto)` : ''}`}
                  onComplete={handleTerminalComplete}
                  onCancel={handleTerminalCancel}
                />
              </div>
            )}
          </div>

          {checkoutMode === 'standard' && (
            <>
              <div className="flex justify-between items-end mb-8 gap-4">
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Total</span>
                <span className="font-display text-[clamp(1.75rem,6vw,2.25rem)] text-primary tabular-nums">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}
                </span>
              </div>

              <div className="mb-4 space-y-1">
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Cliente microcanal (tarjeta QR / email / whatsapp)
                </label>
                <input
                  value={fidIdentidad}
                  onChange={(e) => setFidIdentidad(e.target.value)}
                  placeholder="Tarjeta, email o WhatsApp del cliente"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <p className="text-[10px] text-muted-foreground">
                  La compra suma sellos/puntos en la fidelización del microcanal{miPunto ? ` de ${miPunto.nombre}` : ''}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void confirmarVenta()}
                disabled={loading || lines.length === 0 || hasConsignacionBlock}
                className="w-full min-h-12 py-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-2xl shadow-primary/10 transition-all transform active:scale-95 disabled:opacity-30 disabled:grayscale"
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
