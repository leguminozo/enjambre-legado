'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import { getConsignacionIssues, useFeriaContext } from '@/components/pos/feria-context';
import { useSumUp } from '@/components/pos/sumup-context';
import { SumupTerminalFlow } from '@/components/pos/sumup-terminal-flow';
import { QrCameraScanner } from '@/components/pos/qr-camera-scanner';
import type { VentaChannel, PaymentMethod, TerminalFlowResult, CartLine } from '@/components/pos/types';
import { HexagonLoader, ViewLoadingPlaceholder, formatCLP, friendlyError } from '@enjambre/ui';
import { buildClaimUrl, getTiendaOrigin } from '@/lib/public-urls';
import { generateWhatsAppReceiptText, buildWhatsAppShareUrl } from '@/lib/pos-receipt';
import { db } from '@/lib/offline/db';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ClpCurrencyInput } from '@/components/pos/clp-currency-input';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  QrCode,
  ArrowLeft,
  Banknote,
  CreditCard,
  Smartphone,
  Store,
  Truck,
  Building2,
  Users,
  Nfc,
  AlertTriangle,
  Shield,
  UserCheck,
  X,
  Share2,
  Printer,
  Tag,
  Zap,
  Copy,
  FileText,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ViewShell } from '@/components/layout/ViewShell';
import { getCashBillSuggestions } from '@/lib/cash-suggestions';
import { detectFeriaCombos, getFeriaUpsellNudge } from '@/components/pos/cart-math';
import { ContinuousStreamScanner } from '@/components/pos/continuous-stream-scanner';
import { ThermalReceipt } from '@/components/pos/thermal-receipt';
import { ClientLookupPanel } from '@/components/pos/client-lookup-panel';

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
  const { session, cartSale, selectedClient, marcarRecibo } = useCashSession();
  const { active: feriaActiva, consignaciones, refresh: refreshFeria, whatsappTemplate, combosConfig } = useFeriaContext();
  const { setTerminalStep, sumupMode, setSumupMode } = useSumUp();
  const [channel, setChannel] = useState<VentaChannel>('feria');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo');
  const [loading, setLoading] = useState(false);
  const [montoRecibido, setMontoRecibido] = useState<number | ''>('');
  const [successData, setSuccessData] = useState<{
    id: string;
    buyOrder?: string | null;
    claim_token?: string;
    commission?: number;
    total: number;
    lines: CartLine[];
    metodoPago: PaymentMethod;
    vuelto?: number;
    clienteNombre?: string | null;
    clienteTelefono?: string | null;
    descuentoClp?: number | null;
    descuentoPct?: number | null;
  } | null>(null);
  const [reciboMarcado, setReciboMarcado] = useState<string | null>(null);

  type ReciboCanal = 'whatsapp' | 'email' | 'sms' | 'share' | 'copiado' | 'impreso';

  // Marca el comprobante compartido (métrica). Offline → outbox Dexie que se
  // vacía al reconectar, con el mismo buy_order que la venta sincronizará.
  const marcarReciboCanal = useCallback(async (canal: ReciboCanal) => {
    if (!successData) return;
    const ok = await marcarRecibo(
      { buy_order: successData.buyOrder ?? null, venta_id: successData.id },
      canal,
    );
    if (ok) {
      setReciboMarcado(canal);
      return;
    }
    await db.recibo_outbox.add({
      buy_order: successData.buyOrder ?? null,
      venta_id: successData.id,
      canal,
      created_at: Date.now(),
    });
    setReciboMarcado(`${canal}-pendiente`);
  }, [successData, marcarRecibo]);

  const flushReciboOutbox = useCallback(async () => {
    try {
      const pendientes = await db.recibo_outbox.orderBy('created_at').toArray();
      for (const item of pendientes) {
        const ok = await marcarRecibo(
          { buy_order: item.buy_order, venta_id: item.venta_id },
          item.canal,
        );
        if (!ok) return;
        if (item.id != null) await db.recibo_outbox.delete(item.id);
      }
    } catch (err) {
      console.warn('[Carrito] Error al procesar cola de recibos offline:', err);
    }
  }, [marcarRecibo]);

  useEffect(() => {
    if (!successData) return;
    void flushReciboOutbox();
    const onOnline = () => void flushReciboOutbox();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [successData, flushReciboOutbox]);
  const [fidIdentidad, setFidIdentidad] = useState('');
  const [terminalCheckoutRef, setTerminalCheckoutRef] = useState('');
  const [postSalePhone, setPostSalePhone] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
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
      .catch(() => {
        // Punto de venta B2B opcional: no bloquear flujo si está offline o no configurado
      });
  }, [apiFetch, successData]);
  const [error, setError] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('standard');
  const [scanningFor, setScanningFor] = useState<string | null>(null);
  const [isStreamScannerOpen, setIsStreamScannerOpen] = useState(false);

  const comboSuggestion = useMemo(() => detectFeriaCombos(lines, combosConfig), [lines, combosConfig]);
  const upsellNudge = useMemo(() => getFeriaUpsellNudge(lines, combosConfig), [lines, combosConfig]);

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
    } catch (err) {
      console.error('[Carrito] Error al verificar Tarjeta Obrera:', err);
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
        setTerminalCheckoutRef(`campo-cart-${Date.now()}`);
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

    if (metodoPago === 'efectivo' && montoRecibido !== '') {
      if (Number(montoRecibido) < total) {
        setError('El monto recibido en efectivo es menor al total a cobrar');
        return;
      }
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

      const currentClient = selectedClient;
      const totalVenta = total;
      const soldLines = [...lines];
      const vuelto = metodoPago === 'efectivo' && montoRecibido ? Math.max(0, Number(montoRecibido) - totalVenta) : 0;

      const metodoBff = metodoPago === 'debito' ? 'tarjeta' : metodoPago === 'tarjeta_pos' ? 'pos_terminal' : metodoPago;
      const discPayload =
        discount.kind === 'percent' && discount.value > 0
          ? { descuento_pct: discount.value }
          : discount.kind === 'fixed' && discount.value > 0
            ? { descuento_clp: discount.value }
            : undefined;
      const result = await cartSale(
        cartItems,
        metodoBff,
        channel,
        undefined,
        discPayload,
        fidIdentidad || currentClient?.phone || currentClient?.email || undefined,
      );
      if (!result) {
        setError('No se pudo registrar la venta en la sesion de caja');
        return;
      }
      setSuccessData({
        id: result.id,
        buyOrder: result.buy_order ?? null,
        claim_token: result.claim_token ?? undefined,
        commission: result.rep_commission_total,
        total: totalVenta,
        lines: soldLines,
        metodoPago,
        vuelto,
        clienteNombre: currentClient?.full_name,
        clienteTelefono: currentClient?.phone,
        descuentoClp: totals.descuentoClp,
        descuentoPct: totals.descuentoPct,
      });
      clear();
      setScannedGuardian(null);
      setFidIdentidad('');
      setDiscount({ kind: 'none' });
      setMontoRecibido('');
      void refreshFeria();
    } catch (err) {
      console.error('[carrito] sale error:', err);
      const msg = friendlyError(err, 'Error de conexión al registrar la venta');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lines, metodoPago, isSessionOpen, channel, total, cartSale, clear, hasConsignacionBlock, refreshFeria, discount, montoRecibido, fidIdentidad, sumupMode, setTerminalStep, setDiscount, selectedClient]);

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

        const currentClient = selectedClient;
        const totalVenta = total;
        const soldLines = [...lines];

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
          fidIdentidad || currentClient?.phone || currentClient?.email || undefined,
        );
        if (!result) {
          setError('No se pudo registrar la venta en la sesion de caja');
          return;
        }
        setSuccessData({
          id: result.id,
          buyOrder: result.buy_order ?? null,
          claim_token: result.claim_token ?? undefined,
          commission: result.rep_commission_total,
          total: totalVenta,
          lines: soldLines,
          metodoPago: 'tarjeta_pos',
          vuelto: 0,
          clienteNombre: currentClient?.full_name,
          clienteTelefono: currentClient?.phone,
          descuentoClp: totals.descuentoClp,
          descuentoPct: totals.descuentoPct,
        });
      }
      clear();
      setScannedGuardian(null);
      setFidIdentidad('');
      setDiscount({ kind: 'none' });
      void refreshFeria();
    } catch (err) {
      console.error('[carrito] terminal sale error:', err);
      const msg = friendlyError(err, 'Error al registrar la venta con terminal');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lines, isSessionOpen, channel, total, cartSale, clear, refreshFeria, discount, fidIdentidad, setDiscount, selectedClient]);

  const handleTerminalCancel = useCallback(() => {
    setCheckoutMode('standard');
    setTerminalStep('idle');
    setTerminalCheckoutRef('');
  }, [setTerminalStep]);

  if (!ready) {
    return <ViewLoadingPlaceholder label="Sincronizando carrito" className="py-20" />;
  }

  if (successData) {
    const claimUrl = successData.claim_token ? buildClaimUrl(successData.claim_token) : null;
    const shareText = generateWhatsAppReceiptText({
      clienteNombre: successData.clienteNombre,
      total: successData.total,
      lines: successData.lines,
      claimToken: successData.claim_token,
      customTemplate: whatsappTemplate,
    });
    const phoneToUse = postSalePhone.trim() || successData.clienteTelefono || '';
    const waShareUrl = buildWhatsAppShareUrl(shareText, phoneToUse);

    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] mb-4 text-balance">Venta Exitosa</h1>

        <div className="card-glow p-6 mb-6 text-center space-y-2 border-primary/20 bg-primary/5 max-w-sm mx-auto">
          <p className="text-xs text-primary font-bold uppercase tracking-widest">Impacto Territorial</p>
          <div className="font-display text-[clamp(1.25rem,5vw,1.75rem)] text-foreground">
            Predio Pureo · Chiloé
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Monitoreo y conteo de especies nativas
          </p>
        </div>

        {successData.vuelto != null && successData.vuelto > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-card border border-border max-w-sm mx-auto">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">Vuelto a entregar</span>
            <span className="text-2xl font-mono font-bold text-success">{formatCLP(successData.vuelto)}</span>
          </div>
        )}

        {successData.commission != null && (
          <p className="text-primary text-2xl font-mono font-bold mb-2">
            {successData.commission > 0
              ? `+${formatCLP(successData.commission)} comisión ganada`
              : 'Comisión diferida (al sincronizar)'}
          </p>
        )}
        <p className="text-muted-foreground mb-8 font-light text-pretty">
          {claimUrl
            ? 'La transacción ha sido registrada. Pide al cliente que escanee el código para acceder a su pasaporte de origen.'
            : 'La transacción ha sido registrada en la sesión de caja.'}
        </p>

        {claimUrl && (
          <div className="bg-surface-raised p-8 rounded-3xl inline-block shadow-2xl mb-8">
            <QRCodeSVG value={claimUrl} size={220} level="H" includeMargin />
            <p className="mt-4 text-primary font-mono text-[10px] uppercase tracking-wider">
              Pasaporte Digital de Origen
            </p>
            <p className="text-muted-foreground font-mono text-[9px] uppercase tracking-tighter opacity-60">
              ID: {successData.id.slice(0, 8)}...
            </p>
            {miPunto && (
              <div className="mt-6 pt-6 border-t border-border/40 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-primary">Pulso y puntos — {miPunto.nombre}</p>
                <QRCodeSVG value={miPunto.url_landing} size={150} level="H" includeMargin className="mx-auto" />
                <p className="text-[10px] text-muted-foreground">
                  Invita al cliente a escanear: deja su percepción semántica y suma puntos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Módulo de Recibo WhatsApp & Copia Digital */}
        <div className="space-y-3 max-w-sm mx-auto mb-4">
          <div className="flex items-center gap-2 p-2 bg-surface-raised rounded-xl border border-border">
            <Smartphone className="w-4 h-4 text-primary shrink-0 ml-1" />
            <span className="text-xs font-mono text-muted-foreground">+56 9</span>
            <input
              type="tel"
              placeholder="Teléfono WhatsApp (ej. 98765432)"
              defaultValue={successData.clienteTelefono?.replace(/^(\+?56\s*9?|9)/, '') || ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setPostSalePhone(digits ? `569${digits}` : '');
              }}
              className="bg-transparent text-base md:text-xs font-mono text-foreground outline-none flex-1 placeholder:text-muted-foreground"
            />
          </div>

          <p className="text-[10px] text-muted-foreground text-center px-2 leading-tight">
            Al registrar el contacto, el cliente autoriza el envío de su comprobante digital y pasaporte de origen (Ley N° 21.719).
          </p>

          <div className="flex flex-col gap-2">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void marcarReciboCanal('whatsapp')}
              className="w-full min-h-12 py-3 px-4 bg-success/15 text-success border border-success/30 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-success/25 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              {phoneToUse
                ? `Enviar WhatsApp (+56 9 ${phoneToUse.slice(-8)})`
                : successData.clienteNombre
                ? `Enviar WhatsApp a ${successData.clienteNombre}`
                : 'Enviar Recibo por WhatsApp'}
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`mailto:?subject=${encodeURIComponent('Tu comprobante · Enjambre Legado')}&body=${encodeURIComponent(shareText)}`}
                onClick={() => void marcarReciboCanal('email')}
                className="min-h-10 py-2 px-3 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>Por correo</span>
              </a>

              <a
                href={`sms:${phoneToUse || ''}?&body=${encodeURIComponent(shareText)}`}
                onClick={() => void marcarReciboCanal('sms')}
                className="min-h-10 py-2 px-3 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Por SMS</span>
              </a>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() => {
                    const nav = navigator as Navigator & { share: (d: { title: string; text: string }) => Promise<void> };
                    nav.share({ title: 'Comprobante · Enjambre Legado', text: shareText })
                      .then(() => void marcarReciboCanal('share'))
                      .catch((err) => {
                        console.warn('[Carrito] Compartir cancelado o no disponible:', err);
                      });
                  }}
                  className="min-h-10 py-2 px-3 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <span>Compartir…</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(shareText).catch((err) => {
                      console.warn('[clipboard] writeText error, attempting fallback:', err);
                    });
                  } else if (typeof document !== 'undefined') {
                    try {
                      const textArea = document.createElement('textarea');
                      textArea.value = shareText;
                      textArea.style.position = 'fixed';
                      textArea.style.left = '-9999px';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    } catch (err) {
                      console.warn('[clipboard] fallback copy failed:', err);
                    }
                  }
                  setCopiedReceipt(true);
                  setTimeout(() => setCopiedReceipt(false), 2500);
                  void marcarReciboCanal('copiado');
                }}
                className="min-h-10 py-2 px-3 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span>{copiedReceipt ? '¡Copiado!' : 'Copiar Recibo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptPreview(!showReceiptPreview)}
                className="min-h-10 py-2 px-3 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-[10px] hover:border-primary/40 transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>{showReceiptPreview ? 'Ocultar' : 'Ver Texto'}</span>
              </button>
            </div>

            {showReceiptPreview && (
              <div className="p-3.5 rounded-xl bg-surface-sunken border border-border text-left font-mono text-[11px] text-muted-foreground whitespace-pre-wrap animate-in fade-in">
                {shareText}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">

          {reciboMarcado && (
            <p className="text-[11px] text-muted-foreground text-center">
              {reciboMarcado.endsWith('-pendiente')
                ? 'Comprobante anotado: se registra al reconectar.'
                : `Comprobante compartido por ${reciboMarcado}.`}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              void marcarReciboCanal('impreso');
              window.print();
            }}
            className="w-full min-h-11 py-2.5 px-4 bg-card border border-border text-foreground rounded-full font-bold uppercase tracking-widest text-xs hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket / Voucher
          </button>

          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setCheckoutMode('standard');
              setScannedGuardian(null);
              setFidIdentidad('');
              setDiscount({ kind: 'none' });
              setReciboMarcado(null);
              clear();
              router.push('/pos/catalogo');
            }}
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

        {/* Voucher térmico para impresión física con window.print() */}
        <ThermalReceipt
          id={successData.id}
          total={successData.total}
          lines={successData.lines}
          metodoPago={successData.metodoPago}
          vuelto={successData.vuelto}
          clienteNombre={successData.clienteNombre ?? undefined}
          clienteTelefono={successData.clienteTelefono ?? undefined}
          claimToken={successData.claim_token}
          claimUrl={claimUrl}
          descuentoClp={successData.descuentoClp ?? 0}
          descuentoPct={successData.descuentoPct ?? 0}
        />
      </div>
    );
  }

  const activeChannel = channels.find((c) => c.value === channel);

  if (!lines.length) {
    return (
      <div className="max-w-2xl mx-auto py-8">
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Ítems y Configuración de Venta */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
          <ViewShell
            variant="compact"
            eyebrow="POS"
            title="Carrito"
            subtitle="Confirma canal, pago y stock consignado"
            icon={<ShoppingBag size={20} />}
            className="!mb-0"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStreamScannerOpen(true)}
              className="min-h-11 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              <QrCode size={15} />
              <span>Escanear frascos</span>
            </button>
            <Link
              href="/pos/catalogo"
              className="text-primary flex items-center gap-1.5 text-xs font-medium hover:underline min-h-11 px-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Catálogo
            </Link>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="space-y-3">
          {lines.map((l) => (
            <div key={l.producto_id} className="flex flex-col gap-2">
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-card border border-border p-4 sm:p-5 rounded-3xl transition-all hover:border-border"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-1 text-balance">{l.nombre}</h3>
                  <p className="text-muted-foreground text-sm font-light">
                    Precio unitario: {formatCLP(l.precio_unitario)}
                  </p>
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
                      {formatCLP(l.precio_unitario * l.cantidad)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setScanningFor(scanningFor === l.producto_id ? null : l.producto_id)}
                      className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-2xl transition-all relative ${
                        scanningFor === l.producto_id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface'
                      }`}
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
                    <h4 className="font-medium text-sm text-foreground">
                      Códigos QR asignados ({l.qr_codes?.length || 0} de {l.cantidad})
                    </h4>
                  </div>
                  
                  {l.qr_codes && l.qr_codes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {l.qr_codes.map((code) => (
                        <div
                          key={code}
                          className="flex items-center gap-1 bg-surface-sunken border border-border pl-3 pr-1 py-1 rounded-lg text-xs font-mono text-foreground"
                        >
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

        {/* Panel de Opciones y Condiciones de la Venta */}
        <div className="bg-card border border-border p-6 sm:p-7 rounded-3xl space-y-6">
          {/* 1. Canal de Venta */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Canal de Venta
              </label>
              {activeChannel && (
                <span className="text-xs text-primary font-medium">
                  Modo: {activeChannel.label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {channels.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border min-h-[56px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    channel === ch.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {ch.icon}
                  <span className="truncate max-w-full">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {channel === 'feria' && feriaActiva && consignacionIssues.length > 0 && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 space-y-2">
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

          {/* Sugerencia inteligente de Combo de Feria */}
          {comboSuggestion && discount.kind === 'none' && (
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Tag size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{comboSuggestion.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{comboSuggestion.descripcion}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDiscount({ kind: 'percent', value: comboSuggestion.descuentoPct })}
                className="min-h-10 px-3.5 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shrink-0 hover:opacity-95 transition-opacity shadow-sm"
              >
                Aplicar {comboSuggestion.descuentoPct}%
              </button>
            </div>
          )}

          {/* Nudge proactivo de up-selling para elevar el ticket promedio */}
          {!comboSuggestion && upsellNudge && discount.kind === 'none' && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
                <p className="text-xs text-foreground font-medium truncate">
                  {upsellNudge}
                </p>
              </div>
              <Link
                href="/pos/catalogo"
                className="text-[11px] font-bold text-primary hover:underline shrink-0"
              >
                + Variedad
              </Link>
            </div>
          )}

          {/* 2. Beneficios y Descuentos */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-3">
              Beneficios y Descuentos
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta Obrera / Guardián */}
              <div className="p-4 rounded-2xl bg-surface/50 border border-border space-y-3">
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
                      className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 min-h-[32px] px-1"
                    >
                      <X size={12} />
                      Desvincular
                    </button>
                  )}
                </div>

                {scannedGuardian ? (
                  <div className="p-3 rounded-xl bg-background border border-primary/30 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-success shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{scannedGuardian.displayName}</span>
                      </div>
                      <p className="text-[10px] text-primary font-mono font-medium">{scannedGuardian.tier}</p>
                    </div>
                    <div className="text-right shrink-0">
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

              {/* Descuento feria / venta */}
              <div className="p-4 rounded-2xl bg-surface/50 border border-border space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Descuento feria / venta
                </span>
                <div className="flex flex-wrap gap-1.5">
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
                        className={`min-h-9 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
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
                    className="w-24 rounded-xl border border-border bg-background px-3 py-1.5 text-base md:text-xs text-foreground focus:outline-none focus:border-primary"
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
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-base md:text-xs text-foreground focus:outline-none focus:border-primary"
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
                <p className="text-[10px] text-muted-foreground">
                  Máx. 50%. El servidor recalcula sobre precios de catálogo.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Cliente VIP & Registro en Carrito (Gobernado por Núcleo CRM) */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Cliente VIP & Registro CRM
              </label>
              {selectedClient && (
                <span className="text-xs text-primary font-semibold flex items-center gap-1">
                  <UserCheck size={13} className="text-success" />
                  {selectedClient.full_name}
                </span>
              )}
            </div>

            <ClientLookupPanel />

            <div className="pt-1">
              <input
                value={fidIdentidad}
                onChange={(e) => setFidIdentidad(e.target.value)}
                placeholder="Tarjeta QR, email o contacto alternativo"
                className="w-full min-h-11 rounded-xl border border-border bg-background px-3.5 py-2 text-base md:text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Al seleccionar o registrar el cliente se vincula automáticamente con el CRM de Núcleo y se pre-configura el comprobante de WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Cobro y Resumen */}
      <div className="lg:col-span-5">
        <div className="bg-card border border-border p-6 sm:p-7 rounded-3xl lg:sticky lg:top-24 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-xl font-display text-foreground">Resumen de Cobro</h2>
            <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider bg-surface-raised px-2.5 py-1 rounded-full border border-border">
              {lines.reduce((s, l) => s + l.cantidad, 0)} {lines.reduce((s, l) => s + l.cantidad, 0) === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>

          {/* Desglose financiero */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center text-muted-foreground font-light">
              <span>Subtotal</span>
              <span className="font-mono text-foreground">{formatCLP(subtotal)}</span>
            </div>

            {totals.descuentoClp > 0 && (
              <div className="flex justify-between items-center text-success font-light">
                <span>
                  Descuento
                  {totals.descuentoPct != null ? ` (${totals.descuentoPct}%)` : ''}
                </span>
                <span className="font-mono font-medium">−{formatCLP(totals.descuentoClp)}</span>
              </div>
            )}

            {activeChannel && (
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                <span>Canal</span>
                <span className="font-medium text-foreground capitalize">{activeChannel.label}</span>
              </div>
            )}

            {scannedGuardian && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Guardián</span>
                <span className="font-medium text-primary">{scannedGuardian.displayName}</span>
              </div>
            )}
          </div>

          {/* Método de pago */}
          {isSessionOpen && checkoutMode === 'standard' && (
            <div className="pt-4 border-t border-border/80 space-y-3">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setMetodoPago(pm.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border min-h-[50px] px-2.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      metodoPago === pm.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>

              {metodoPago === 'tarjeta_pos' && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Modo SumUp</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {sumupMode === 'connected' ? 'Envía el monto al lector.' : 'Ingreso manual en el POS.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sumupMode === 'connected'}
                    aria-label={sumupMode === 'connected' ? 'SumUp conectado' : 'SumUp manual'}
                    onClick={() => setSumupMode(sumupMode === 'connected' ? 'manual' : 'connected')}
                    className={`relative inline-flex h-10 min-w-[3rem] w-12 items-center rounded-full px-1 transition-colors ${
                      sumupMode === 'connected' ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-background shadow transition-transform ${
                        sumupMode === 'connected' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {metodoPago === 'efectivo' && (
                <div className="p-4 rounded-2xl border border-border bg-surface/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      Monto Recibido (CLP)
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">Total: {formatCLP(total)}</span>
                  </div>
                  <ClpCurrencyInput
                    value={montoRecibido}
                    onChange={setMontoRecibido}
                    placeholder={formatCLP(total)}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {getCashBillSuggestions(total).map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setMontoRecibido(btn.val)}
                        className={`min-h-10 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                          montoRecibido === btn.val
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background border-border text-foreground hover:border-primary'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {montoRecibido && Number(montoRecibido) >= total ? (
                    <div className="p-3.5 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-between animate-in fade-in">
                      <span className="text-xs uppercase tracking-wider text-success font-bold">
                        Vuelto a entregar
                      </span>
                      <span className="text-2xl font-mono font-black text-success">
                        {formatCLP(Number(montoRecibido) - total)}
                      </span>
                    </div>
                  ) : montoRecibido && Number(montoRecibido) < total ? (
                    <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between text-xs text-destructive">
                      <span>Monto insuficiente</span>
                      <span className="font-mono font-bold">Faltan {formatCLP(total - Number(montoRecibido))}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {isSessionOpen && checkoutMode === 'terminal' && (
            <div className="pt-4 border-t border-border/80">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">
                Pago con Terminal SumUp
              </label>
              <SumupTerminalFlow
                amount={total}
                checkoutReference={terminalCheckoutRef || `campo-cart-${session?.id ?? 'pos'}`}
                description={`Carrito: ${lines.length} productos${totals.descuentoClp > 0 ? ` (−${totals.descuentoClp} dto)` : ''}`}
                onComplete={handleTerminalComplete}
                onCancel={handleTerminalCancel}
              />
            </div>
          )}

          {/* Total y Confirmación */}
          {checkoutMode === 'standard' && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex justify-between items-baseline gap-4">
                <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">
                  Total
                </span>
                <span className="font-display text-[clamp(1.85rem,4vw,2.5rem)] text-primary font-bold tabular-nums">
                  {formatCLP(total)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => void confirmarVenta()}
                disabled={loading || lines.length === 0 || hasConsignacionBlock}
                className="w-full min-h-14 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-xl shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-30 disabled:grayscale text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <HexagonLoader size="sm" />
                    Registrando venta...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Confirmar Venta
                    <QrCode className="w-5 h-5" />
                  </div>
                )}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 text-center animate-pulse">
              {error}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
            Se generará un QR dinámico para el reclamo de puntos guardián y protección de patrimonio forestal.
          </p>
        </div>
      </div>

      {/* Visor de Escaneo Continuo en Ráfaga (Scan & Add) */}
      <ContinuousStreamScanner
        isOpen={isStreamScannerOpen}
        onClose={() => setIsStreamScannerOpen(false)}
      />
    </div>
  );
}
