'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Users, AlertCircle, Loader2, Search, Filter,
  Edit3, Trash2, X, ChevronRight
} from 'lucide-react';

interface RepRow {
  user_id: string;
  empresa_id: string;
  display_name: string;
  commission_tier: string;
  fixed_monthly: number;
  total_commissions_earned: number;
  total_commissions_paid: number;
  total_sales_lifetime: number;
  total_revenue_lifetime: number;
  clients_captured: number;
  current_streak_days: number;
  best_streak_days: number;
  active: boolean;
  profiles: { full_name: string; email: string } | null;
}

export function RepsPanel() {
  const [reps, setReps] = useState<RepRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<string>('todos');
  const [editRep, setEditRep] = useState<{ userId: string; tier: string; fixedMonthly: number; tierOverride: string | null } | null>(null);

  useEffect(() => { fetchReps(); }, []);

  const fetchReps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rep_profiles')
        .select('*, profiles!rep_profiles_user_id_fkey(full_name, email)')
        .order('active', { ascending: false });

      if (error) throw error;
      setReps((data as unknown as RepRow[]) || []);
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar reps'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateRep = async (userId: string, updates: Partial<Pick<RepRow, 'commission_tier' | 'fixed_monthly' | 'active'>> & { tier_override?: string | null }) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('rep_profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;
      toast('Representante actualizado', { type: 'success' });
      setEditRep(null);
      await fetchReps();
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const deactivateRep = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('rep_profiles')
        .update({ active: false })
        .eq('user_id', userId);

      if (error) throw error;
      toast('Representante desactivado', { type: 'success' });
      await fetchReps();
    } catch (err) {
      toast(friendlyError(err, 'Error al desactivar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReps = reps.filter(r => {
    if (filterActive === 'activos' && !r.active) return false;
    if (filterActive === 'inactivos' && r.active) return false;
    const name = r.display_name || r.profiles?.full_name || '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatCLP = (n: number) => '$' + Number(n || 0).toLocaleString('es-CL');

  const tierBadge: Record<string, string> = {
    base: 'bg-secondary text-muted-foreground',
    senior: 'bg-oro-miel-glow/30 text-oro-miel-dark',
    elite: 'bg-salud-optima/10 text-salud-optima',
    legend: 'bg-card text-foreground',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando representantes...</p>
      </div>
    );
  }

  return (
  <div className="space-y-8 animate-in relative">
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Users size={24} />
        </div>
        <div>
      <h2 className="text-2xl font-display text-bosque-ulmo">Representantes</h2>
      <p className="text-sm text-text-muted">Gestión de representantes · Niveles, comisiones y estado</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Users size={18} />, val: reps.length, label: 'Total Representantes', accent: '' },
          { icon: <ChevronRight size={18} />, val: reps.filter(r => r.active).length, label: 'Activos', accent: 'text-salud-optima' },
          { icon: <AlertCircle size={18} />, val: formatCLP(reps.reduce((s, r) => s + Number(r.total_commissions_earned || 0) - Number(r.total_commissions_paid || 0), 0)), label: 'Comisiones Pendientes', accent: 'text-oro-miel-dark' },
          { icon: <ChevronRight size={18} />, val: Math.max(...reps.map(r => r.best_streak_days || 0), 0), label: 'Mejor Racha (días)', accent: '' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="font-display text-lg">Representantes Registrados</h3>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Buscar representante..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 200 }} />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 140 }}>
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredReps.length === 0 ? (
            <p className="text-sm text-text-muted italic py-8 text-center">No hay representantes que coincidan.</p>
          ) : filteredReps.map(rep => (
            <div key={rep.user_id} className={`p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-oro-miel/20 transition-all ${!rep.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm text-bosque-ulmo truncate">{rep.display_name || rep.profiles?.full_name}</p>
                    <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[rep.commission_tier] || tierBadge.base}`}>
                      {rep.commission_tier}
                    </span>
                    {!rep.active && <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-salud-riesgo/10 text-salud-riesgo">inactivo</span>}
                  </div>
                  <p className="text-xs text-text-muted">{rep.profiles?.email}</p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-[0.65rem] text-text-muted">Ventas: <strong className="text-bosque-ulmo">{rep.total_sales_lifetime}</strong></span>
                    <span className="text-[0.65rem] text-text-muted">Ingresos: <strong className="text-bosque-ulmo">{formatCLP(rep.total_revenue_lifetime)}</strong></span>
                    <span className="text-[0.65rem] text-text-muted">Comisiones: <strong className="text-oro-miel-dark">{formatCLP(rep.total_commissions_earned)}</strong></span>
                    <span className="text-[0.65rem] text-text-muted">Racha: <strong>{rep.current_streak_days}d</strong> (mejor: {rep.best_streak_days}d)</span>
                    {rep.fixed_monthly > 0 && <span className="text-[0.65rem] text-text-muted">Honorarios: <strong>{formatCLP(rep.fixed_monthly)}/mes</strong></span>}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditRep(editRep?.userId === rep.user_id ? null : { userId: rep.user_id, tier: rep.commission_tier, fixedMonthly: rep.fixed_monthly, tierOverride: rep.commission_tier })}
                    className="w-9 h-9 rounded-full bg-surface-raised text-foreground flex items-center justify-center hover:bg-card transition-all"
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  {rep.active && (
                    <button
                      disabled={actionLoading === rep.user_id}
                      onClick={() => deactivateRep(rep.user_id)}
                      className="w-9 h-9 rounded-full bg-salud-riesgo/10 text-salud-riesgo flex items-center justify-center hover:bg-salud-riesgo hover:text-foreground transition-all disabled:opacity-50"
                      title="Desactivar"
                    >
                      {actionLoading === rep.user_id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    </button>
                  )}
                </div>
              </div>

  {editRep?.userId === rep.user_id && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Nivel</label>
          <select value={editRep.tier} onChange={e => setEditRep({ ...editRep, tier: e.target.value })} className="input-field text-sm">
            <option value="base">Base</option>
            <option value="senior">Senior</option>
            <option value="elite">Elite</option>
            <option value="legend">Leyenda</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[0.6rem] uppercase text-text-muted tracking-wider block mb-1">Honorarios mensuales ($)</label>
          <input type="number" min={0} value={editRep.fixedMonthly} onChange={e => setEditRep({ ...editRep, fixedMonthly: Number(e.target.value) })} className="input-field text-sm" />
        </div>
        <label className="flex items-center gap-1.5 text-[0.6rem] uppercase text-text-muted tracking-wider pb-2">
          <input type="checkbox" checked={editRep.tierOverride !== null} onChange={e => setEditRep({ ...editRep, tierOverride: e.target.checked ? editRep.tier : null })} className="rounded" />
        Override
        </label>
        <button onClick={() => updateRep(rep.user_id, { commission_tier: editRep.tier, fixed_monthly: editRep.fixedMonthly, tier_override: editRep.tierOverride })} className="btn btn-gold text-xs">Guardar</button>
        <button onClick={() => setEditRep(null)} className="btn btn-outline text-xs"><X size={14} /></button>
        </div>
        {editRep.tierOverride && <p className="text-[0.6rem] text-primary">Excepción manual activa: la evaluación automática no cambiará este nivel.</p>}
    </div>
  )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
