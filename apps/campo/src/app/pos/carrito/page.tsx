'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/pos/cart-context';
import { useCashSession } from '@/components/pos/cash-context';
import type { VentaChannel } from '@/components/pos/types';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2, QrCode, ArrowLeft, Banknote, CreditCard, Smartphone, Store, Truck, Building2, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

type PaymentMethod = 'efectivo' | 'debito' | 'transferencia';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'debito', label: 'Débito', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'transferencia', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
];

const channels: { value: VentaChannel; label: string; icon: React.ReactNode }[] = [
  { value: 'feria', label: 'Feria', icon: <Store className="w-4 h-4" /> },
  { value: 'delivery', label: 'Delivery', icon: <Truck className="w-4 h-4" /> },
  { value: 'local', label: 'Local', icon: <Building2 className="w-4 h-4" /> },
  { value: 'corporativo', label: 'Corp', icon: <Building2 className="w-4 h-4" /> },
  { value: 'referido', label: 'Referido', icon: <Users className="w-4 h-4" /> },
];

export default function CarritoPage() {
  const router = useRouter();
  const { lines, setQty, removeLine, clear, total, ready } = useCart();
  const { session, cartSale, selectedClient, isNewClient } = useCashSession();
  const [channel, setChannel] = useState<VentaChannel>('feria');
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>('efectivo');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; claim_token?: string; commission?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSessionOpen = session?.session_status === 'open';

  async function confirmarVenta() {
    setError(null);
    if (lines.length === 0) return;

    setLoading(true);
    try {
      if (isSessionOpen) {
        const cartItems = lines.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.nombre,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        }));

        const result = await cartSale(cartItems, metodoPago === 'debito' ? 'tarjeta' : metodoPago, channel);
        if (!result) {
          setError('No se pudo registrar la venta en la sesión de caja');
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
            metodo_pago: metodoPago === 'debito' ? 'tarjeta' : metodoPago,
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
    } catch (error) {
      console.error('[carrito] sale error:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground font-light tracking-widest uppercase text-xs">Sincronizando carrito...</p>
      </div>
    );
  }

  if (successData) {
    const claimUrl = successData.claim_token
      ? `${window.location.origin.replace('campo', 'tienda')}/claim/${successData.claim_token}`
      : null;

    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="text-4xl font-serif mb-4">Venta Exitosa</h1>
        {successData.commission != null && (
          <p className="text-primary text-2xl font-mono font-bold mb-2">
            +${successData.commission.toLocaleString('es-CL')} comisión
          </p>
        )}
        <p className="text-muted-foreground mb-12 font-light">
          {claimUrl
            ? 'La transacción ha sido registrada. Pide al cliente que escanee el código para reclamar su impacto y puntos.'
            : 'La transacción ha sido registrada en la sesión de caja.'}
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
            onClick={() => { setSuccessData(null); router.push('/pos/catalogo'); }}
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
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>

        {!lines.length ? (
          <div className="bg-card/30 border border-border border-dashed rounded-3xl p-20 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-light">No hay productos en el carrito.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lines.map((l) => (
              <div
                key={l.producto_id}
                className="flex items-center gap-6 bg-card/50 backdrop-blur-sm border border-border p-6 rounded-3xl transition-all hover:border-border"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-1">{l.nombre}</h3>
                  <p className="text-muted-foreground text-sm font-light">Precio unitario: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario)}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-background rounded-full border border-border p-1">
                  <button 
                    onClick={() => setQty(l.producto_id, Math.max(1, l.cantidad - 1))}
                    className="p-2 hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold">{l.cantidad}</span>
                  <button 
                    onClick={() => setQty(l.producto_id, l.cantidad + 1)}
                    className="p-2 hover:text-primary transition-colors"
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
                  className="p-3 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-card/50 backdrop-blur-xl border border-border p-8 rounded-3xl sticky top-32">
          <h2 className="text-xl font-serif mb-6 pb-6 border-b border-border">Resumen de Venta</h2>
          
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center text-muted-foreground font-light">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}</span>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Canal de Venta</label>
          <div className="grid grid-cols-5 gap-1.5">
            {channels.map((ch) => (
              <button
                key={ch.value}
                onClick={() => setChannel(ch.value)}
                className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${
                  channel === ch.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-primary'
                }`}
              >
                {ch.icon}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {isSessionOpen && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground font-bold mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setMetodoPago(pm.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    metodoPago === pm.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-primary'
                  }`}
                >
                  {pm.icon}
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

          <div className="flex justify-between items-end mb-8">
            <span className="text-sm uppercase tracking-widest text-muted-foreground font-bold">Total</span>
            <span className="text-4xl font-serif text-primary">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          <button
            onClick={() => void confirmarVenta()}
            disabled={loading || lines.length === 0}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold shadow-2xl shadow-primary/10 transition-all transform active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Registrando...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Confirmar Venta
                <QrCode className="w-5 h-5" />
              </div>
            )}
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20 text-center animate-pulse">
              {error}
            </p>
          )}

          <p className="mt-6 text-[10px] text-muted-foreground text-center uppercase tracking-widest leading-relaxed">
            Se generará un QR dinámico para el reclamo de puntos guardián e impacto biocultural.
          </p>
        </div>
      </div>
    </div>
  );
}

