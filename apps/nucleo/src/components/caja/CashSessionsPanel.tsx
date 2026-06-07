'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import {
  Wallet, Check, Loader2, Search, Filter,
  CheckCircle2, Clock, Shield, Eye, Download, AlertTriangle
} from 'lucide-react';

interface CashSessionRow {
  id: string;
  rep_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  closing_cash_counted: number | null;
  closing_cash_expected: number | null;
  cash_difference: number | null;
  session_status: string;
  reconciled_by: string | null;
  notas: string | null;
  rep_profiles: { display_name: string } | null;
  profiles: { full_name: string } | null;
}

interface SessionDetail extends CashSessionRow {
  ventas_count: number;
  total_revenue: number;
  total_commissions: number;
}

export function CashSessionsPanel() {
  const CASH_ALERT_THRESHOLD = 10000;
  const [sessions, setSessions] = useState<CashSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*, rep_profiles(display_name), profiles!cash_sessions_rep_id_fkey(full_name)')
        .order('opened_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions((data as unknown as CashSessionRow[]) || []);
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar sesiones'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const reconcileSession = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('No autenticado');

      const { error } = await supabase
        .from('cash_sessions')
        .update({
          session_status: 'reconciled',
          reconciled_by: authSession.user.id,
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast('Sesión reconciliada', { type: 'success' });
      await fetchSessions();
    } catch (err) {
      toast(friendlyError(err, 'Error al reconciliar'), { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const fetchSessionDetail = async (sessionId: string) => {
    try {
      const [sessionRes, summaryRes] = await Promise.all([
        supabase.from('cash_sessions').select('*, rep_profiles(display_name), profiles!cash_sessions_rep_id_fkey(full_name)').eq('id', sessionId).single(),
        supabase.from('rep_session_summary_view').select('*').eq('session_id', sessionId).single(),
      ]);

      if (sessionRes.data && summaryRes.data) {
        setSelectedSession({
          ...sessionRes.data,
          ventas_count: (summaryRes.data as Record<string, unknown>).ventas_count as number ?? 0,
          total_revenue: Number((summaryRes.data as Record<string, unknown>).total_revenue ?? 0),
          total_commissions: Number((summaryRes.data as Record<string, unknown>).total_commissions ?? 0),
        } as SessionDetail);
      }
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar detalle'), { type: 'error' });
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filterStatus !== 'todos' && s.session_status !== filterStatus) return false;
    const name = s.rep_profiles?.display_name || s.profiles?.full_name || '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.session_status] = (acc[s.session_status] || 0) + 1;
    return acc;
  }, {});

  const formatCLP = (n: number) => '$' + Math.abs(n).toLocaleString('es-CL');
  const statusIcon: Record<string, typeof Clock> = { open: Clock, closed: Shield, reconciled: CheckCircle2 };

  const exportCSV = async () => {
    setExportLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('No autenticado');
      const res = await fetch('/api/cash-sessions/export/csv', {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cierres-caja_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast('CSV exportado', { type: 'success' });
    } catch (err) {
      toast(friendlyError(err, 'Error al exportar CSV'), { type: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando sesiones de caja...</p>
      </div>
    );
  }

  return (
  <div className="space-y-8 animate-in relative">
    <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Wallet size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Cierres de Caja</h2>
          <p className="text-sm text-text-muted">Sesiones de caja diarias · Reconciliación y auditoría</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: <Wallet size={18} />, val: sessions.length, label: 'Total Sesiones', accent: '' },
          { icon: <Clock size={18} />, val: statusCounts['open'] || 0, label: 'Abiertas', accent: 'text-amber' },
          { icon: <Shield size={18} />, val: statusCounts['closed'] || 0, label: 'Cerradas', accent: 'text-oro-miel-dark' },
          { icon: <CheckCircle2 size={18} />, val: statusCounts['reconciled'] || 0, label: 'Reconciliadas', accent: 'text-salud-optima' },
      { icon: <AlertTriangle size={18} />, val: sessions.filter(s => s.cash_difference !== null && Math.abs(Number(s.cash_difference)) >= CASH_ALERT_THRESHOLD).length, label: 'Alertas Δ', accent: 'text-salud-riesgo' },
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
          <h3 className="font-display text-lg">Sesiones</h3>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input type="text" placeholder="Buscar por rep..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 200 }} />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 150 }}>
            <option value="todos">Todos</option>
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
            <option value="reconciled">Reconciliada</option>
          </select>
        </div>
        <button
          onClick={() => void exportCSV()}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-oro-miel-glow/30 text-oro-miel-dark text-xs font-bold uppercase tracking-widest hover:bg-oro-miel-glow/50 transition-all disabled:opacity-50"
        >
          {exportLoading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          CSV
        </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-text-muted italic py-8 text-center">No hay sesiones que coincidan.</p>
          ) : filteredSessions.map(s => {
            const StatusIcon = statusIcon[s.session_status] || Clock;
            return (
              <div key={s.id} className="p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-oro-miel/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon size={14} className={s.session_status === 'reconciled' ? 'text-salud-optima' : s.session_status === 'closed' ? 'text-oro-miel-dark' : 'text-amber'} />
                      <p className="font-bold text-sm text-bosque-ulmo truncate">
                        {s.rep_profiles?.display_name || s.profiles?.full_name || 'Representante desconocido'}
                      </p>
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        s.session_status === 'reconciled' ? 'bg-salud-optima/10 text-salud-optima' :
                        s.session_status === 'closed' ? 'bg-oro-miel-glow/30 text-oro-miel-dark' :
                        'bg-amber/10 text-amber'
                      }`}>
                        {s.session_status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {new Date(s.opened_at).toLocaleDateString('es-CL')} · {new Date(s.opened_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      {s.closed_at && ` → ${new Date(s.closed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-[0.65rem] text-text-muted">Apertura: <strong className="text-bosque-ulmo">{formatCLP(s.opening_cash)}</strong></span>
                      {s.closing_cash_counted !== null && (
                        <span className="text-[0.65rem] text-text-muted">Contado: <strong className="text-bosque-ulmo">{formatCLP(s.closing_cash_counted)}</strong></span>
                      )}
                {s.cash_difference !== null && (
                  <span className={`text-[0.65rem] font-bold ${Number(s.cash_difference) === 0 ? 'text-salud-optima' : 'text-salud-riesgo'}`}>
                    Delta: {Number(s.cash_difference) >= 0 ? '+' : '-'}{formatCLP(Number(s.cash_difference))}
                  </span>
                )}
                {s.cash_difference !== null && Math.abs(Number(s.cash_difference)) >= CASH_ALERT_THRESHOLD && (
                  <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-salud-riesgo/10 text-salud-riesgo">
                    <AlertTriangle size={10} />
                    Alerta
                  </span>
                )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => fetchSessionDetail(s.id)}
                      className="w-9 h-9 rounded-full bg-oro-miel-glow/30 text-oro-miel-dark flex items-center justify-center hover:bg-oro-miel-glow/50 transition-all"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                    {s.session_status === 'closed' && (
                      <button
                        disabled={actionLoading === s.id}
                        onClick={() => reconcileSession(s.id)}
                        className="w-9 h-9 rounded-full bg-salud-optima/10 text-salud-optima flex items-center justify-center hover:bg-salud-optima hover:text-foreground transition-all disabled:opacity-50"
                        title="Reconciliar"
                      >
                        {actionLoading === s.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={18} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-background/40 flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl text-bosque-ulmo">Detalle de Sesión</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-text-muted">Representante:</div>
              <div className="font-medium text-bosque-ulmo">{selectedSession.rep_profiles?.display_name || selectedSession.profiles?.full_name}</div>
              <div className="text-text-muted">Ventas:</div>
              <div className="font-medium">{selectedSession.ventas_count}</div>
              <div className="text-text-muted">Ingresos:</div>
              <div className="font-medium">{formatCLP(selectedSession.total_revenue)}</div>
              <div className="text-text-muted">Comisiones:</div>
              <div className="font-medium text-oro-miel-dark">{formatCLP(selectedSession.total_commissions)}</div>
              <div className="text-text-muted">Efectivo esperado:</div>
              <div className="font-medium">{selectedSession.closing_cash_expected ? formatCLP(Number(selectedSession.closing_cash_expected)) : '—'}</div>
              <div className="text-text-muted">Efectivo contado:</div>
              <div className="font-medium">{selectedSession.closing_cash_counted ? formatCLP(Number(selectedSession.closing_cash_counted)) : '—'}</div>
              <div className="text-text-muted">Diferencia:</div>
              <div className={`font-bold ${Number(selectedSession.cash_difference ?? 0) === 0 ? 'text-salud-optima' : 'text-salud-riesgo'}`}>
                {selectedSession.cash_difference !== null ? `${Number(selectedSession.cash_difference) >= 0 ? '+' : '-'}${formatCLP(Number(selectedSession.cash_difference))}` : '—'}
              </div>
            </div>
            {selectedSession.notas && <p className="text-xs text-text-muted italic mt-2">Notas: {selectedSession.notas}</p>}
            <button onClick={() => setSelectedSession(null)} className="w-full py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary transition-colors">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
