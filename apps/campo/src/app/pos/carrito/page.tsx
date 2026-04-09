'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/pos/cart-context';
import type { VentaOrigen } from '@/components/pos/types';

export default function CarritoPage() {
  const router = useRouter();
  const { lines, setQty, removeLine, clear, total, ready } = useCart();
  const [origen, setOrigen] = useState<VentaOrigen>('feria');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirmarVenta() {
    setMessage(null);
    if (lines.length === 0) {
      setMessage('El carrito está vacío.');
      return;
    }
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
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setMessage(data.error ?? 'Error al registrar la venta');
        return;
      }
      clear();
      setMessage(`Venta registrada${data.id ? ` (${data.id.slice(0, 8)}…)` : ''}.`);
      router.refresh();
    } catch {
      setMessage('Error de red');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-gray-500">Cargando carrito…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Carrito</h1>
      {!lines.length ? (
        <p className="text-sm text-gray-600 mb-4">
          Vacío.{' '}
          <Link href="/pos/catalogo" className="underline text-[#0A3D2F]">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <ul className="space-y-3 mb-6">
          {lines.map((l) => (
            <li
              key={l.producto_id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm"
            >
              <span className="flex-1 min-w-[140px] font-medium">{l.nombre}</span>
              <label className="flex items-center gap-1">
                Cant.
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border border-gray-300 px-2 py-1"
                  value={l.cantidad}
                  onChange={(e) => setQty(l.producto_id, Number(e.target.value))}
                />
              </label>
              <span className="tabular-nums">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                }).format(l.precio_unitario * l.cantidad)}
              </span>
              <button
                type="button"
                className="text-red-600 underline text-xs"
                onClick={() => removeLine(l.producto_id)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {lines.length > 0 ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value as VentaOrigen)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="feria">Feria</option>
              <option value="local">Local</option>
            </select>
          </div>
          <p className="text-lg font-semibold mb-4">
            Total:{' '}
            {new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
            }).format(total)}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void confirmarVenta()}
            className="rounded-xl bg-[#0A3D2F] px-6 py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Registrando…' : 'Confirmar venta'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Debes estar logueado con un usuario que tenga fila en <code className="bg-gray-100 px-1">profiles</code>{' '}
            (mismo <code className="bg-gray-100 px-1">id</code> que <code className="bg-gray-100 px-1">auth.uid()</code>
            ).
          </p>
        </>
      ) : null}

      {message ? <p className="mt-4 text-sm text-gray-800">{message}</p> : null}
    </div>
  );
}
