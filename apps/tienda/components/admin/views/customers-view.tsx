'use client';

import Link from 'next/link';
import { Download, Plus, Search, Settings2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockCustomers } from '@/lib/mock-admin-data';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
    amount,
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function CustomersView() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockCustomers;
    return mockCustomers.filter(
      (c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.city.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">CRM ligero (demostración)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/integrations" className="btn-secondary inline-flex items-center">
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar fuentes
          </Link>
          <button type="button" className="btn-secondary inline-flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button type="button" className="btn-secondary inline-flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </button>
          <button type="button" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Agregar cliente
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar clientes…"
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header">Cliente</th>
                <th className="table-header">Email</th>
                <th className="table-header">Ciudad</th>
                <th className="table-header">Pedidos</th>
                <th className="table-header">Total</th>
                <th className="table-header">Newsletter</th>
                <th className="table-header">Último pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="table-cell font-medium">{c.name}</td>
                  <td className="table-cell text-gray-600 text-sm">{c.email}</td>
                  <td className="table-cell">{c.city}</td>
                  <td className="table-cell">{c.orders}</td>
                  <td className="table-cell">{formatCurrency(c.totalSpent)}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.subscribed ? 'status-active' : 'status-archived'}`}>
                      {c.subscribed ? 'Suscrito' : 'No suscrito'}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{formatDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
