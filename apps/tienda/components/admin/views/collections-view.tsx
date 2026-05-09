'use client';

import Link from 'next/link';
import { MoreHorizontal, Plus, Search, Settings2, Tag, Upload, LayoutGrid } from 'lucide-react';
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
    <div className="space-y-12 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
              <LayoutGrid size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">Curaduría de Colecciones</h1>
          </div>
          <p className="text-[#8a8279] text-sm tracking-wide">Agrupación narrativa de productos para catálogo y narrativa editorial</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button type="button" className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[0.65rem] uppercase tracking-[0.2em] text-[#8a8279] hover:bg-white/10 transition-all">
            <Upload className="inline-block mr-2 h-4 w-4" /> Importar
          </button>
          <button type="button" className="px-6 py-3 rounded-full bg-[#c9a227] text-black text-[0.65rem] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-[0_10px_20px_rgba(201,162,39,0.2)]">
            <Plus className="inline-block mr-2 h-4 w-4" /> Nueva Colección
          </button>
        </div>
      </div>

      {/* List Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display text-xl text-[#f5f0e8]">Estructura de Catálogo</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar colecciones…"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-[#f5f0e8] focus:outline-none focus:border-[#c9a227]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Colección</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Productos</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Estado</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium text-right">Última Edición</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-16 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          <Tag size={16} className="text-[#4a4a4a] group-hover:text-[#c9a227] transition-colors" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#f5f0e8]">{c.title}</span>
                          <span className="text-[0.65rem] text-[#4a4a4a] uppercase tracking-widest">{c.title.toLowerCase().replace(/\s+/g, '-')}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-[#f5f0e8]">{c.productsCount} <span className="text-[0.65rem] text-[#8a8279] ml-1 uppercase">ítems</span></span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-[#c9a227]' : 'bg-white/10'}`} />
                       <span className={`text-[0.65rem] uppercase tracking-widest font-semibold ${c.status === 'active' ? 'text-[#c9a227]' : 'text-[#4a4a4a]'}`}>
                        {c.status === 'active' ? 'Activa' : 'Borrador'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-xs text-[#8a8279]">{formatDate(c.updatedAt)}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button type="button" className="p-2 text-[#4a4a4a] hover:text-[#c9a227] transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
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
