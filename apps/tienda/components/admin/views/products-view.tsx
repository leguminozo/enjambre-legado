'use client';

import { FileText, Package, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockProducts } from '@/lib/mock-admin-data';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
    amount,
  );
}

export function ProductsView() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockProducts;
    return mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.category.toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tu catálogo (datos de demostración)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary inline-flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button type="button" className="btn-secondary inline-flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Importar
          </button>
          <button type="button" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Agregar producto
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos…"
              className="input-field pl-9 w-full"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header">Producto</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Precio</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="table-cell font-medium">{p.name}</td>
                  <td className="table-cell text-gray-500">{p.sku}</td>
                  <td className="table-cell">{formatCurrency(p.price)}</td>
                  <td className="table-cell">
                    <span
                      className={`status-badge ${
                        p.status === 'active' ? 'status-active' : p.status === 'draft' ? 'status-draft' : 'status-archived'
                      }`}
                    >
                      {p.status === 'active' ? 'Activo' : p.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </span>
                  </td>
                  <td className="table-cell">
                    {p.inventory === 0 ? (
                      <span className="text-red-600 font-medium">0 en existencias</span>
                    ) : (
                      <span className="text-green-700">{p.inventory} en existencias</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
