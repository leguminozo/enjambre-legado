'use client';

import Link from 'next/link';
import { Download, Plus, Search, Settings2, Upload, Users, ShieldCheck, Mail, MapPin } from 'lucide-react';
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
    <div className="space-y-12 animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
              <Users size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">Comunidad Guardiana</h1>
          </div>
          <p className="text-[#8a8279] text-sm tracking-wide">Gestión de perfiles, fidelización y huella de impacto</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button type="button" className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[0.65rem] uppercase tracking-[0.2em] text-[#8a8279] hover:bg-white/10 transition-all">
            <Download className="inline-block mr-2 h-4 w-4" /> Exportar
          </button>
          <button type="button" className="px-6 py-3 rounded-full bg-[#c9a227] text-black text-[0.65rem] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-[0_10px_20px_rgba(201,162,39,0.2)]">
            <Plus className="inline-block mr-2 h-4 w-4" /> Agregar Cliente
          </button>
        </div>
      </div>

      {/* Stats Quick View (Vanguardia Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 flex flex-col justify-between h-32">
           <span className="text-[0.6rem] uppercase tracking-widest text-[#8a8279]">Total Guardianes</span>
           <span className="text-3xl font-display text-[#f5f0e8]">{rows.length}</span>
        </div>
        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/5 flex flex-col justify-between h-32">
           <span className="text-[0.6rem] uppercase tracking-widest text-[#8a8279]">Suscripción Newsletter</span>
           <span className="text-3xl font-display text-[#c9a227]">{rows.filter(r => r.subscribed).length} <span className="text-xs font-sans text-[#4a4a4a] ml-2">ACTIVOS</span></span>
        </div>
        <div className="p-6 rounded-3xl bg-[#c9a227]/5 border border-[#c9a227]/20 flex flex-col justify-between h-32">
           <span className="text-[0.6rem] uppercase tracking-widest text-[#c9a227]">Valor Promedio</span>
           <span className="text-3xl font-display text-[#f5f0e8]">{formatCurrency(rows.reduce((acc, curr) => acc + curr.totalSpent, 0) / rows.length)}</span>
        </div>
      </div>

      {/* List Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display text-xl text-[#f5f0e8]">Directorio de Miembros</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a4a4a]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, email o ciudad..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-[#f5f0e8] focus:outline-none focus:border-[#c9a227]/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Miembro</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Ubicación</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium text-center">Órdenes</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Impacto Total</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279] font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[0.7rem] text-[#c9a227] font-bold">
                         {c.name.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#f5f0e8]">{c.name}</span>
                          <span className="text-[0.65rem] text-[#4a4a4a] lowercase">{c.email}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-[#8a8279]">
                       <MapPin size={12} />
                       <span className="text-xs">{c.city}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm text-[#f5f0e8]">{c.orders}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium text-[#c9a227]">{formatCurrency(c.totalSpent)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={14} className={c.subscribed ? 'text-[#c9a227]' : 'text-[#4a4a4a]'} />
                       <span className={`text-[0.65rem] uppercase tracking-widest font-semibold ${c.subscribed ? 'text-[#c9a227]' : 'text-[#4a4a4a]'}`}>
                        {c.subscribed ? 'Suscrito' : 'Inactivo'}
                       </span>
                    </div>
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
