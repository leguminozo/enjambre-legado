'use client';

import Link from 'next/link';
import { CloudUpload, List, Plus, Search, Settings2, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
    amount,
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type VentaRow = {
  id: string;
  origen: 'web' | 'feria' | 'local' | null;
  estado: string | null;
  total: number | null;
  metodo_pago: string | null;
  items: unknown;
  created_at: string;
};

const estados = [
  'pagado',
  'preparando',
  'enviado',
  'entregado',
  'cancelado',
] as const;

export function OrdersView() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<VentaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      const json = (await res.json()) as { data?: VentaRow[]; error?: string };
      if (!res.ok) throw new Error(json.error || 'Error cargando pedidos');
      setData(json.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((o) => o.id.includes(s) || (o.estado ?? '').toLowerCase().includes(s));
  }, [q, data]);

  const updateEstado = async (id: string, estado: string) => {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || 'No se pudo actualizar estado');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-12 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
              <ShoppingBag size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">Registro de Ventas</h1>
          </div>
          <p className="text-[#8a8279] text-sm tracking-wide">Monitorización de transacciones y logística de entrega</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            type="button" 
            className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[0.65rem] uppercase tracking-[0.2em] text-[#8a8279] hover:bg-white/10 transition-all"
            onClick={load}
          >
            Refrescar
          </button>
          <Link 
            href="/integrations" 
            className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[0.65rem] uppercase tracking-[0.2em] text-[#f5f0e8] hover:border-[#c9a227]/30 transition-all"
          >
            Integraciones
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display text-xl text-[#f5f0e8]">Órdenes Activas</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por ID o estado..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-[#f5f0e8] focus:outline-none focus:border-[#c9a227]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Orden ID</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Fecha</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Total</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Canal / Pago</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Estado Logístico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td className="px-8 py-20 text-center text-[#4a4a4a] italic" colSpan={5}>
                    Sincronizando órdenes...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-8 py-20 text-center text-[#4a4a4a] italic" colSpan={5}>
                    No hay pedidos registrados en este periodo.
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <span className="text-xs font-mono text-[#c9a227]">#{o.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs text-[#f5f0e8]">{formatDate(o.created_at)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium text-[#f5f0e8]">{formatCurrency(o.total ?? 0)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[0.65rem] text-[#f5f0e8] uppercase tracking-wider">{o.origen ?? 'Directo'}</span>
                      <span className="text-[0.6rem] text-[#4a4a4a] uppercase">{o.metodo_pago ?? 'Por definir'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <select
                         className="bg-white/5 border border-white/10 rounded-lg text-[0.65rem] text-[#f5f0e8] px-3 py-2 focus:outline-none focus:border-[#c9a227]/50 transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50"
                         value={o.estado ?? 'pagado'}
                         disabled={savingId === o.id}
                         onChange={(e) => void updateEstado(o.id, e.target.value)}
                       >
                         {estados.map((s) => (
                           <option key={s} value={s} className="bg-[#0a0a0a]">
                             {s.toUpperCase()}
                           </option>
                         ))}
                       </select>
                       {savingId === o.id && <Loader2 className="animate-spin text-[#c9a227]" size={14} />}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
