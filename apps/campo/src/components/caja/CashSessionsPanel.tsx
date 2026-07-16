'use client';

import { useState, useEffect } from 'react';
import { friendlyError, toast, ViewLoading, ImmersiveModal } from '@enjambre/ui';
import {
  Wallet, Check, Loader2, Search, Filter,
  CheckCircle2, Clock, Shield, Eye, Download, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';

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
}

interface HistoryRow {
  session_id: string;
  rep_id: string | null;
  opened_at: string | null;
  closed_at: string | null;
  opening_cash: number | null;
  closing_cash_counted: number | null;
  closing_cash_expected: number | null;
  cash_difference: number | null;
  session_status: string | null;
  display_name: string | null;
  total_transactions: number | null;
  total_revenue: number | null;
  session_commissions: number | null;
}

interface SessionDetail extends CashSessionRow {
  ventas_count: number;
  total_revenue: number;
  total_commissions: number;
}

export function CashSessionsPanel() {
  const apiFetch = useApiFetch();
  const CASH_ALERT_THRESHOLD = 10000;
  const [sessions, setSessions] = useState<CashSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cash-sessions/history?limit=100');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Error al cargar sesiones');
      }
      const json = await res.json();
      const rows = (json.data ?? []) as HistoryRow[];
      setSessions(
        rows.map((row) => ({
          id: row.session_id,
          rep_id: row.rep_id ?? '',
          opened_at: row.opened_at ?? '',
          closed_at: row.closed_at,
          opening_cash: Number(row.opening_cash ?? 0),
          closing_cash_counted: row.closing_cash_counted,
          closing_cash_expected: row.closing_cash_expected,
          cash_difference: row.cash_difference,
          session_status: row.session_status ?? 'open',
          reconciled_by: null,
          notas: null,
          rep_profiles: row.display_name ? { display_name: row.display_name } : null,
        })),
      );
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar sesiones'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const reconcileSession = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const res = await apiFetch(`/api/cash-sessions/${sessionId}/reconcile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Error al reconciliar');
      }
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
      const res = await apiFetch(`/api/cash-sessions/${sessionId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? 'Error al cargar detalle');
      }
      const json = await res.json();
      const payload = json.data as {
        session: CashSessionRow;
        rep: { display_name: string } | null;
        ventas: unknown[];
        commissions: { total_commission: number }[];
      };
      const totalCommissions = (payload.commissions ?? []).reduce(
        (sum, c) => sum + Number(c.total_commission ?? 0),
        0,
      );
      setSelectedSession({
        ...payload.session,
        rep_profiles: payload.rep,
        ventas_count: payload.ventas?.length ?? 0,
        total_revenue: (payload.ventas as { total?: number }[]).reduce(
          (sum, v) => sum + Number(v.total ?? 0),
          0,
        ),
        total_commissions: totalCommissions,
      } as SessionDetail);
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar detalle'), { type: 'error' });
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filterStatus !== 'todos' && s.session_status !== filterStatus) return false;
    const name = s.rep_profiles?.display_name || '';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.session_status] = (acc[s.session_status] || 0) + 1;
    return acc;
  }, {});

  const formatCLP = (n: number) => formatCurrency(Math.abs(n));
  const statusIcon: Record<string, typeof Clock> = { open: Clock, closed: Shield, reconciled: CheckCircle2 };

  const exportCSV = async () => {
    setExportLoading(true);
    try {
      const res = await apiFetch('/api/cash-sessions/export/csv');
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
    return <ViewLoading variant="view" label="Sesiones de caja" hideLabel />;
  }

  return (
  <div className="space-y-8 animate-in relative">
    <ViewShell
      variant="compact"
      eyebrow="Campo"
      title="Cierres de Caja"
      subtitle="Sesiones diarias · Reconciliación y auditoría"
      icon={<Wallet size={20} />}
    />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: <Wallet size={18} />, val: sessions.length, label: 'Total Sesiones', accent: '' },
          { icon: <Clock size={18} />, val: statusCounts['open'] || 0, label: 'Abiertas', accent: 'text-warning' },
          { icon: <Shield size={18} />, val: statusCounts['closed'] || 0, label: 'Cerradas', accent: 'text-accent' },
          { icon: <CheckCircle2 size={18} />, val: statusCounts['reconciled'] || 0, label: 'Reconciliadas', accent: 'text-success' },
      { icon: <AlertTriangle size={18} />, val: sessions.filter(s => s.cash_difference !== null && Math.abs(Number(s.cash_difference)) >= CASH_ALERT_THRESHOLD).length, label: 'Alertas Δ', accent: 'text-destructive' },
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
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por rep..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-9 text-sm" style={{ width: 200 }} />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/15 text-accent text-xs font-bold uppercase tracking-widest hover:bg-accent/25 transition-all disabled:opacity-50"
        >
          {exportLoading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
          CSV
        </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">No hay sesiones que coincidan.</p>
          ) : filteredSessions.map(s => {
            const StatusIcon = statusIcon[s.session_status] || Clock;
            return (
              <div key={s.id} className="p-5 rounded-xl bg-background/[0.03] border border-foreground/[0.06] hover:border-accent/20 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon size={14} className={s.session_status === 'reconciled' ? 'text-success' : s.session_status === 'closed' ? 'text-accent' : 'text-warning'} />
                      <p className="font-bold text-sm text-primary truncate">
                        {s.rep_profiles?.display_name || 'Representante desconocido'}
                      </p>
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        s.session_status === 'reconciled' ? 'bg-success/10 text-success' :
                        s.session_status === 'closed' ? 'bg-accent/15 text-accent' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {s.session_status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.opened_at).toLocaleDateString('es-CL')} · {new Date(s.opened_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      {s.closed_at && ` → ${new Date(s.closed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-[0.65rem] text-muted-foreground">Apertura: <strong className="text-primary">{formatCLP(s.opening_cash)}</strong></span>
                      {s.closing_cash_counted !== null && (
                        <span className="text-[0.65rem] text-muted-foreground">Contado: <strong className="text-primary">{formatCLP(s.closing_cash_counted)}</strong></span>
                      )}
                {s.cash_difference !== null && (
                  <span className={`text-[0.65rem] font-bold ${Number(s.cash_difference) === 0 ? 'text-success' : 'text-destructive'}`}>
                    Delta: {Number(s.cash_difference) >= 0 ? '+' : '-'}{formatCLP(Number(s.cash_difference))}
                  </span>
                )}
                {s.cash_difference !== null && Math.abs(Number(s.cash_difference)) >= CASH_ALERT_THRESHOLD && (
                  <span className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle size={10} />
                    Alerta
                  </span>
                )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => fetchSessionDetail(s.id)}
                      className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center hover:bg-accent/25 transition-all"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                    {s.session_status === 'closed' && (
                      <button
                        disabled={actionLoading === s.id}
                        onClick={() => reconcileSession(s.id)}
                        className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center hover:bg-success hover:text-foreground transition-all disabled:opacity-50"
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

      <ImmersiveModal
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        eyebrow="Caja"
        title="Detalle de sesión"
        size="md"
        footer={
          <button onClick={() => setSelectedSession(null)} className="btn btn-outline btn-sm w-full sm:w-auto">Cerrar</button>
        }
      >
        {selectedSession ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-muted-foreground">Representante:</div>
              <div className="font-medium text-primary">{selectedSession.rep_profiles?.display_name || '—'}</div>
              <div className="text-muted-foreground">Ventas:</div>
              <div className="font-medium">{selectedSession.ventas_count}</div>
              <div className="text-muted-foreground">Ingresos:</div>
              <div className="font-medium">{formatCLP(selectedSession.total_revenue)}</div>
              <div className="text-muted-foreground">Comisiones:</div>
              <div className="font-medium text-accent">{formatCLP(selectedSession.total_commissions)}</div>
              <div className="text-muted-foreground">Efectivo esperado:</div>
              <div className="font-medium">{selectedSession.closing_cash_expected ? formatCLP(Number(selectedSession.closing_cash_expected)) : '—'}</div>
              <div className="text-muted-foreground">Efectivo contado:</div>
              <div className="font-medium">{selectedSession.closing_cash_counted ? formatCLP(Number(selectedSession.closing_cash_counted)) : '—'}</div>
              <div className="text-muted-foreground">Diferencia:</div>
              <div className={`font-bold ${Number(selectedSession.cash_difference ?? 0) === 0 ? 'text-success' : 'text-destructive'}`}>
                {selectedSession.cash_difference !== null ? `${Number(selectedSession.cash_difference) >= 0 ? '+' : '-'}${formatCLP(Number(selectedSession.cash_difference))}` : '—'}
              </div>
            </div>
            {selectedSession.notas ? (
              <p className="text-xs text-muted-foreground italic mt-4">Notas: {selectedSession.notas}</p>
            ) : null}
          </>
        ) : null}
      </ImmersiveModal>
    </div>
  );
}
