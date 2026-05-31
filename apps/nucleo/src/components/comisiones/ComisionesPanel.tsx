'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError } from '@enjambre/ui';
import {
  Percent, Check, AlertCircle, Loader2, Search, Filter,
  DollarSign, CheckCircle2, Eye
} from 'lucide-react';

interface CommissionRow {
  id: string;
  session_id: string;
  venta_id: string;
  rep_id: string;
  base_commission: number;
  volume_multiplier: number;
  loyalty_bonus: number;
  streak_bonus: number;
  tier_multiplier: number;
  channel_rate: number | null;
  total_commission: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  rep_profiles: { display_name: string } | null;
  profiles: { full_name: string } | null;
}

export function ComisionesPanel() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterPaid, setFilterPaid] = useState<string>('pendientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchCommissions(); }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commission_records')
        .select('*, rep_profiles!commission_records_rep_id_fkey(display_name), profiles!commission_records_rep_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setCommissions((data as unknown as CommissionRow[]) || []);
    } catch (err) {
      showToast(friendlyError(err, 'Error al cargar comisiones'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const payCommissions = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('No autenticado');

      const { error } = await supabase
        .from('commission_records')
        .update({ paid: true, paid_at: new Date().toISOString(), paid_by: authSession.user.id })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      showToast(`${selectedIds.size} comisiones pagadas`, 'success');
      setSelectedIds(new Set());
      await fetchCommissions();
    } catch (err) {
      showToast(friendlyError(err, 'Error al pagar comisiones'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredCommissions = commissions.filter(c => {
    if (filterPaid === 'pendientes' && c.paid) return false;
    if (filterPaid === 'pagadas' && !c.paid) return false;
    const name = c.rep_profiles?.display_name || c.profiles?.full_name || '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPending = commissions.filter(c => !c.paid).reduce((s, c) => s + Number(c.total_commission || 0), 0);
  const totalPaid = commissions.filter(c => c.paid).reduce((s, c) => s + Number(c.total_commission || 0), 0);
  const selectedTotal = commissions.filter(c => selectedIds.has(c.id)).reduce((s, c) => s + Number(c.total_commission || 0), 0);

  const formatCLP = (n: number) => '$' + Number(n || 0).toLocaleString('es-CL');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando comisiones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in relative">
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in ${
          toast.type === 'success' ? 'bg-salud-optima/10 border-salud-optima text-salud-optima' : 'bg-salud-riesgo/10 border-salud-riesgo text-salud-riesgo'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Percent size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Comisiones</h2>
          <p className="text-sm text-text-muted">Registro de comisiones devengadas · Pago y auditoría</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <DollarSign size={18} />, val: formatCLP(totalPending), label: 'Pendientes', accent: 'text-oro-miel-dark' },
          { icon: <CheckCircle2 size={18} />, val: formatCLP(totalPaid), label: 'Pagadas', accent: 'text-salud-optima' },
          { icon: <Percent size={18} />, val: commissions.length, label: 'Total Registros', accent: '' },
          { icon: <Eye size={18} />, val: selectedIds.size, label: 'Seleccionadas', accent: 'text-blue-500' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-oro-miel-glow/20 border border-oro-miel/20">
          <span className="text-sm text-bosque-ulmo font-medium">{selectedIds.size} seleccionadas · Total: {formatCLP(selectedTotal)}</span>
          <button disabled={actionLoading} onClick={payCommissions} className="btn btn-gold text-xs ml-auto">
            {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <DollarSign size={14} />}
            Pagar Seleccionadas
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="btn btn-outline text-xs">Limpiar</button>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="font-display text-lg">Comisiones Devengadas</h3>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Buscar por rep..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 200 }} />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <select value={filterPaid} onChange={e => setFilterPaid(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 140 }}>
                <option value="todos">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="pagadas">Pagadas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
      <tr className="text-left text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-white/5">
        {!filterPaid?.startsWith('pag') && <th className="pb-3 w-8"></th>}
        <th className="pb-3">Rep</th>
        <th className="pb-3">Base</th>
        <th className="pb-3">×Mult</th>
        <th className="pb-3">Loyalty</th>
        <th className="pb-3">Streak</th>
        <th className="pb-3">Tier</th>
        <th className="pb-3">Canal</th>
        <th className="pb-3 font-bold">Total</th>
        <th className="pb-3">Estado</th>
        <th className="pb-3">Fecha</th>
      </tr>
            </thead>
            <tbody>
              {filteredCommissions.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-text-muted italic">No hay comisiones que coincidan.</td></tr>
              ) : filteredCommissions.map(c => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-black/[0.02]">
                  {!filterPaid?.startsWith('pag') && (
                    <td className="py-3">
                      {!c.paid && (
                        <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-stone-300" />
                      )}
                    </td>
                  )}
                  <td className="py-3 font-medium text-bosque-ulmo">{c.rep_profiles?.display_name || c.profiles?.full_name || '—'}</td>
                  <td className="py-3">{formatCLP(Number(c.base_commission))}</td>
                  <td className="py-3">×{Number(c.volume_multiplier || 1).toFixed(1)}</td>
                  <td className="py-3">{Number(c.loyalty_bonus) > 0 ? formatCLP(Number(c.loyalty_bonus)) : '—'}</td>
                <td className="py-3">{Number(c.streak_bonus) > 0 ? formatCLP(Number(c.streak_bonus)) : '—'}</td>
                <td className="py-3">{Number(c.tier_multiplier) > 1 ? `×${Number(c.tier_multiplier).toFixed(1)}` : '—'}</td>
                <td className="py-3">{c.channel_rate != null ? `${(Number(c.channel_rate) * 100).toFixed(0)}%` : '—'}</td>
                <td className="py-3 font-bold text-oro-miel-dark">{formatCLP(Number(c.total_commission))}</td>
                  <td className="py-3">
                    <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      c.paid ? 'bg-salud-optima/10 text-salud-optima' : 'bg-amber/10 text-amber'
                    }`}>
                      {c.paid ? 'pagada' : 'pendiente'}
                    </span>
                  </td>
                  <td className="py-3 text-text-muted text-xs">{new Date(c.created_at).toLocaleDateString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
