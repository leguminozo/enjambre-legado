'use client';

import { List, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockOrders } from '@/lib/mock-admin-data';

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

export function OrdersView() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockOrders;
    return mockOrders.filter((o) => o.id.includes(s) || o.customer.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Seguimiento de ventas (demostración)</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary inline-flex items-center">
            <List className="h-4 w-4 mr-2" />
            Vista lista
          </button>
          <button type="button" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Crear pedido
          </button>
        </div>
      </div>

      <div className="card">
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
                <th className="table-header">Cliente</th>
                <th className="table-header">Fecha</th>
                <th className="table-header">Total</th>
                <th className="table-header">Pago</th>
                <th className="table-header">Preparación</th>
                <th className="table-header">Canal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="table-cell font-mono text-sm">#{o.id}</td>
                  <td className="table-cell">{o.customer}</td>
                  <td className="table-cell text-gray-600 text-sm">{formatDate(o.createdAt)}</td>
                  <td className="table-cell font-medium">{formatCurrency(o.total)}</td>
                  <td className="table-cell">
                    <span
                      className={`status-badge ${
                        o.status === 'paid' ? 'status-paid' : o.status === 'pending' ? 'status-pending' : 'status-unpaid'
                      }`}
                    >
                      {o.status === 'paid' ? 'Pagado' : o.status === 'pending' ? 'Pendiente' : 'Sin pagar'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge ${o.preparation === 'prepared' ? 'status-active' : 'status-pending'}`}>
                      {o.preparation === 'prepared' ? 'Preparado' : 'No preparado'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">{o.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
