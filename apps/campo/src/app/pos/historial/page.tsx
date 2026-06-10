'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { useCashSession } from '@/components/pos/cash-context';
import { TierBadge, TierProgressBar, useTierProgress } from '@/components/pos/tier-badge';
import { LeaderboardPanel } from '@/components/pos/leaderboard-panel';
import { TrendingUp, Calendar, DollarSign, Zap, BarChart3, Clock } from 'lucide-react';

type DailyEntry = { date: string; revenue: number; commissions: number; sales: number };
type SessionEntry = { id: string; opened_at: string; closed_at: string | null; opening_cash: number; session_status: string; cash_difference: number | null };
type CommissionEntry = { id: string; total_commission: number; base_commission: number; volume_multiplier: number; loyalty_bonus: number; streak_bonus: number; tier_multiplier: number; channel_rate: number | null; paid: boolean; created_at: string };

interface HistoryData {
  profile: {
    total_commissions_earned: number; total_commissions_paid: number; total_sales_lifetime: number;
    total_revenue_lifetime: number; clients_captured: number; current_streak_days: number;
    best_streak_days: number; commission_tier: string;
  } | null;
  sessions: SessionEntry[];
  commissions: CommissionEntry[];
  summary: { total_earned: number; total_pending: number; session_count: number };
  daily: DailyEntry[];
}

export default function HistorialPage() {
  const { session } = useCashSession();
  const { tierProgress } = useTierProgress();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [tab, setTab] = useState<'overview' | 'commissions' | 'sessions' | 'leaderboard'>('overview');

  const fetchHistory = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';
      const res = await fetch(`${API_BASE}/api/rep-ventas/history?range=${range}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('[Historial] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const formatCLP = (n: number) => '$' + Math.abs(n).toLocaleString('es-CL');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Cargando historial...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">No se pudo cargar el historial.</p>
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1">Historial</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Comisiones, ventas y rendimiento</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map(r => (
            <button key={r} onClick={() => { setRange(r); setLoading(true); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
            range === r ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
              }`}>
              {r === 'week' ? '7d' : r === 'month' ? '30d' : '90d'}
            </button>
          ))}
        </div>
      </div>

{profile && (
  <>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card-glow p-4 text-center">
        <DollarSign className="w-4 h-4 text-primary mx-auto mb-2" />
        <p className="text-lg font-bold text-primary">{formatCLP(data.summary.total_pending)}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Pendiente</p>
      </div>
      <div className="card-glow p-4 text-center">
        <TrendingUp className="w-4 h-4 text-success mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{formatCLP(Number(profile.total_revenue_lifetime))}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Lifetime</p>
      </div>
      <div className="card-glow p-4 text-center">
        <Zap className="w-4 h-4 text-warning mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{profile.current_streak_days}d</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Racha</p>
      </div>
      <div className="card-glow p-4 text-center">
        <TierBadge tier={profile.commission_tier} />
        <p className="text-lg font-bold text-foreground mt-2">{profile.total_sales_lifetime}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Ventas</p>
      </div>
    </div>
    {tierProgress && <TierProgressBar progress={tierProgress} />}
  </>
)}

      <div className="flex gap-2">
    {(['overview', 'commissions', 'sessions', 'leaderboard'] as const).map(t => (
      <button key={t} onClick={() => setTab(t)}
          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
            tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
        }`}
      >
        {t === 'overview' ? 'Curva' : t === 'commissions' ? 'Comisiones' : t === 'sessions' ? 'Sesiones' : 'Ranking'}
      </button>
    ))}
      </div>

      {tab === 'overview' && (
        <div className="card-glow p-5 space-y-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest">Curva de volumen diario</h3>
          {data.daily.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin datos en este período.</p>
          ) : (
            <div className="space-y-2">
              {data.daily.map(d => {
                const maxComms = Math.max(...data.daily.map(x => x.commissions), 1);
                const widthPct = (d.commissions / maxComms) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
      <div className="flex-1 h-6 bg-card rounded-lg overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-lg transition-all" style={{ width: `${widthPct}%` }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-foreground font-bold">
          {formatCLP(d.commissions)}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{d.sales}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'commissions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin comisiones en este período.</p>
          ) : data.commissions.map(c => (
            <div key={c.id} className="card-glow p-4 flex items-center justify-between">
              <div>
        <p className="text-sm font-bold text-foreground">{formatCLP(Number(c.total_commission))}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground">Base: {formatCLP(Number(c.base_commission))}</span>
        {Number(c.volume_multiplier) > 1 && <span className="text-[9px] text-warning">×{Number(c.volume_multiplier).toFixed(1)}</span>}
        {Number(c.loyalty_bonus) > 0 && <span className="text-[9px] text-success">+loyalty</span>}
        {Number(c.streak_bonus) > 0 && <span className="text-[9px] text-info">+streak</span>}
        {Number(c.tier_multiplier) > 1 && <span className="text-[9px] text-info">tier ×{Number(c.tier_multiplier).toFixed(1)}</span>}
        {c.channel_rate != null && Number(c.channel_rate) !== 0.10 && <span className="text-[9px] text-info">{(Number(c.channel_rate) * 100).toFixed(0)}%</span>}
          </div>
              </div>
              <div className="text-right">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  c.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {c.paid ? 'pagada' : 'pendiente'}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin sesiones en este período.</p>
          ) : data.sessions.map(s => (
            <div key={s.id} className="card-glow p-4 flex items-center justify-between">
              <div>
        <p className="text-sm font-bold text-foreground">
          {new Date(s.opened_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground">Base: {formatCLP(s.opening_cash)}</span>
                  {s.cash_difference !== null && (
                    <span className={`text-[9px] font-bold ${Number(s.cash_difference) === 0 ? 'text-success' : 'text-destructive'}`}>
                      Δ {Number(s.cash_difference) >= 0 ? '+' : '-'}{formatCLP(Number(s.cash_difference))}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
          s.session_status === 'reconciled' ? 'bg-success/10 text-success' :
          s.session_status === 'closed' ? 'bg-warning/10 text-warning' :
                'bg-primary/10 text-primary'
              }`}>
                {s.session_status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && <LeaderboardPanel />}
    </div>
  );
}
