'use client';

import Link from 'next/link';
import { Download, Plus, Search, Settings2, Upload, Users, ShieldCheck, Mail, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockCustomers } from '@/lib/mock-admin-data';
import { formatCLP } from '@/lib/shop/format';

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Users size={20} />
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-foreground">Comunidad Guardiana</h1>
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">Gestión de perfiles, fidelización y huella de impacto</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="px-6 py-3 rounded-full bg-secondary border border-border text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground hover:bg-secondary/80 transition-all">
            <Download className="inline-block mr-2 h-4 w-4" /> Exportar
          </button>
          <button type="button" className="px-6 py-3 rounded-full bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-glow">
            <Plus className="inline-block mr-2 h-4 w-4" /> Agregar Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-card border border-border flex flex-col justify-between h-32">
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Total Guardianes</span>
          <span className="text-3xl font-display text-foreground">{rows.length}</span>
        </div>
        <div className="p-6 rounded-3xl bg-card border border-border flex flex-col justify-between h-32">
          <span className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Suscripción Newsletter</span>
          <span className="text-3xl font-display text-accent">{rows.filter(r => r.subscribed).length} <span className="text-xs font-sans text-muted-foreground ml-2">ACTIVOS</span></span>
        </div>
        <div className="p-6 rounded-3xl bg-accent/5 border border-accent/20 flex flex-col justify-between h-32">
          <span className="text-[0.6rem] uppercase tracking-widest text-accent">Valor Promedio</span>
          <span className="text-3xl font-display text-foreground">{formatCLP(rows.reduce((acc, curr) => acc + curr.totalSpent, 0) / rows.length)}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display text-xl text-foreground">Directorio de Miembros</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, email o ciudad..."
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-full text-xs text-foreground focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Miembro</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Ubicación</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium text-center">Órdenes</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Impacto Total</th>
                <th className="px-8 py-5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-[0.7rem] text-accent font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-[0.65rem] text-muted-foreground lowercase">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin size={12} />
                      <span className="text-xs">{c.city}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm text-foreground">{c.orders}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium text-accent">{formatCLP(c.totalSpent)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className={c.subscribed ? 'text-accent' : 'text-muted-foreground'} />
                      <span className={`text-[0.65rem] uppercase tracking-widest font-semibold ${c.subscribed ? 'text-accent' : 'text-muted-foreground'}`}>
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
