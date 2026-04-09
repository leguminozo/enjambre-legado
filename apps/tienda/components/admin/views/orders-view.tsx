'use client';

import Link from 'next/link';
import { CloudUpload, List, Plus, Search, Settings2 } from 'lucide-react';
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
    const res = await fetch('/api/admin/orders', { cache: 'no-store' });
    const json = (await res.json()) as { data?: VentaRow[]; error?: string };
    if (!res.ok) {
      setError(json.error || 'Error cargando pedidos');
      setLoading(false);
      return;
    }
    setData(json.data ?? []);
    setLoading(false);
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
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo actualizar estado');
      setSavingId(null);
      return;
    }
    await load();
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Seguimiento real de ventas (tabla `ventas`)</p>
        </div>
        <div className="flex gap-2">
          <Link href="/integrations" className="btn-secondary inline-flex items-center">
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar fuentes
          </Link>
          <button type="button" className="btn-secondary inline-flex items-center" disabled>
            <CloudUpload className="h-4 w-4 mr-2" />
            Subir boletas/extractos (próximo)
          </button>
          <button type="button" className="btn-secondary inline-flex items-center" disabled>
            <List className="h-4 w-4 mr-2" />
            Vista lista
          </button>
          <button type="button" className="btn-primary inline-flex items-center" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Crear pedido (vía checkout)
          </button>
        </div>
      </div>

      <div className="card">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente o número…"
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header">Pedido</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Total</th>
                <th className="table-header">Pago</th>
                <th className="table-header">Canal</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td className="table-cell text-gray-500" colSpan={6}>
                    Cargando pedidos...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="table-cell text-gray-500" colSpan={6}>
                    Sin pedidos
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id}>
                    <td className="table-cell font-mono text-sm">#{o.id.slice(0, 8)}</td>
                    <td className="table-cell text-gray-600 text-sm">{formatDate(o.created_at)}</td>
                    <td className="table-cell font-medium">{formatCurrency(o.total ?? 0)}</td>
                    <td className="table-cell text-gray-600">{o.metodo_pago ?? '-'}</td>
                    <td className="table-cell text-gray-600">{o.origen ?? '-'}</td>
                    <td className="table-cell">
                      <select
                        className="input-field"
                        value={o.estado ?? 'pagado'}
                        disabled={savingId === o.id}
                        onChange={(e) => void updateEstado(o.id, e.target.value)}
                      >
                        {estados.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
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
