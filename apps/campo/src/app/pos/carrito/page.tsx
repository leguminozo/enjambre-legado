'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/pos/cart-context';
import type { VentaOrigen } from '@/components/pos/types';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2, QrCode, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function CarritoPage() {
  const router = useRouter();
  const { lines, setQty, removeLine, clear, total, ready } = useCart();
  const [origen, setOrigen] = useState<VentaOrigen>('feria');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; claim_token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmarVenta() {
    setError(null);
    if (lines.length === 0) return;
    
    setLoading(true);
    try {
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
          origen,
          total,
          items,
          metodo_pago: 'efectivo',
          estado: 'confirmado',
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al registrar la venta');
        return;
      }
      
      setSuccessData({ id: data.id, claim_token: data.claim_token });
      clear();
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-stone-500 font-light tracking-widest uppercase text-xs">Sincronizando carrito...</p>
      </div>
    );
  }

  if (successData) {
    const claimUrl = `${window.location.origin.replace('campo', 'tienda')}/claim/${successData.claim_token}`;
    
    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        
        <h1 className="text-4xl font-serif mb-4">Venta Exitosa</h1>
        <p className="text-stone-400 mb-12 font-light">La transacción ha sido registrada. Pide al cliente que escanee el código para reclamar su impacto y puntos.</p>
        
        <div className="bg-white p-8 rounded-3xl inline-block shadow-2xl mb-12">
          <QRCodeSVG value={claimUrl} size={240} level="H" includeMargin />
          <p className="mt-4 text-black font-mono text-[10px] uppercase tracking-tighter opacity-40">
            ID: {successData.id.slice(0, 8)}...
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            onClick={() => {
              setSuccessData(null);
              router.push('/pos/catalogo');
            }}
            className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-medium transition-all"
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
          <Link href="/pos/catalogo" className="text-[#D4A017] flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>

        {!lines.length ? (
          <div className="bg-stone-900/30 border border-stone-800 border-dashed rounded-3xl p-20 text-center">
            <ShoppingBag className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500 font-light">No hay productos en el carrito.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lines.map((l) => (
              <div
                key={l.producto_id}
                className="flex items-center gap-6 bg-stone-900/50 backdrop-blur-sm border border-stone-800 p-6 rounded-3xl transition-all hover:border-stone-700"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1">{l.nombre}</h3>
                  <p className="text-stone-500 text-sm font-light">Precio unitario: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario)}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-black rounded-full border border-stone-800 p-1">
                  <button 
                    onClick={() => setQty(l.producto_id, Math.max(1, l.cantidad - 1))}
                    className="p-2 hover:text-[#D4A017] transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold">{l.cantidad}</span>
                  <button 
                    onClick={() => setQty(l.producto_id, l.cantidad + 1)}
                    className="p-2 hover:text-[#D4A017] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="font-mono font-bold text-[#D4A017]">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(l.precio_unitario * l.cantidad)}
                  </p>
                </div>

                <button
                  onClick={() => removeLine(l.producto_id)}
                  className="p-3 text-stone-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-stone-900/50 backdrop-blur-xl border border-stone-800 p-8 rounded-3xl sticky top-32">
          <h2 className="text-xl font-serif mb-6 pb-6 border-b border-stone-800">Resumen de Venta</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center text-stone-400 font-light">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}</span>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 font-bold mb-2">Origen de Activación</label>
              <select
                value={origen}
                onChange={(e) => setOrigen(e.target.value as VentaOrigen)}
                className="w-full bg-black border border-stone-800 rounded-2xl px-4 py-3 text-sm focus:border-[#D4A017] outline-none transition-all appearance-none"
              >
                <option value="feria">Feria / Pop-up</option>
                <option value="local">Local Físico</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-end mb-8">
            <span className="text-sm uppercase tracking-widest text-stone-500 font-bold">Total</span>
            <span className="text-4xl font-serif text-[#D4A017]">
              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(total)}
            </span>
          </div>

          <button
            onClick={() => void confirmarVenta()}
            disabled={loading || lines.length === 0}
            className="w-full py-5 bg-[#D4A017] hover:bg-[#b88a14] text-black rounded-full font-bold shadow-2xl shadow-[#D4A017]/10 transition-all transform active:scale-95 disabled:opacity-30 disabled:grayscale"
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

          <p className="mt-6 text-[10px] text-stone-600 text-center uppercase tracking-widest leading-relaxed">
            Se generará un QR dinámico para el reclamo de puntos guardián e impacto biocultural.
          </p>
        </div>
      </div>
    </div>
  );
}

