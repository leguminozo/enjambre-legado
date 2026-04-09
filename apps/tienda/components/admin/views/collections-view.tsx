'use client';

import { MoreHorizontal, Plus, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockCollections } from '@/lib/mock-admin-data';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CollectionsView() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mockCollections;
    return mockCollections.filter((c) => c.title.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Tag className="h-8 w-8 text-primary-600 shrink-0 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colecciones</h1>
            <p className="text-gray-600">Agrupa productos para catálogo y campañas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary inline-flex items-center">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Más acciones
          </button>
          <button type="button" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Crear colección
          </button>
        </div>
      </div>

      <div className="card">
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar colecciones…"
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="table-header">Colección</th>
                <th className="table-header">Productos</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="table-cell font-medium">{c.title}</td>
                  <td className="table-cell">{c.productsCount}</td>
                  <td className="table-cell">
                    <span className={`status-badge ${c.status === 'active' ? 'status-active' : 'status-draft'}`}>
                      {c.status === 'active' ? 'Activa' : 'Borrador'}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600 text-sm">{formatDate(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
