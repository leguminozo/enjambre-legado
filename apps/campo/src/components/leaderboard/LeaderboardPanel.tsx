'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { ViewLoading, formatCLP } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/public-urls';
import { TierBadge } from '@/components/pos/tier-badge';
import { ViewShell } from '@/components/layout/ViewShell';
import { EnjTableShell } from '@/components/layout/EnjTableShell';

interface LeaderboardEntry {
  rank: number;
  rep_id: string;
  display_name: string;
  commission_tier: string;
  total_commissions: number;
  total_sales: number;
  total_revenue: number;
}

const rankIcons = [Trophy, Medal, Crown];
const tierBadge: Record<string, string> = {
  base: 'bg-secondary text-muted-foreground',
  senior: 'bg-accent/15 text-accent',
  elite: 'bg-success/10 text-success',
  legend: 'bg-card text-foreground',
};

/** Panel de ranking semanal por comisiones — 'page' standalone o 'widget' embebido (POS). */
export function LeaderboardPanel({ variant = 'page' }: { variant?: 'page' | 'widget' }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/leaderboard`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data ?? []);
      }
    } catch (err) {
      console.error('[Leaderboard] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekLabel = `Semana del ${weekStart.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`;

  if (loading) {
    return <ViewLoading variant="view" label="Ranking" hideLabel />;
  }

  if (entries.length === 0) {
    return (
      <div className="card-glow p-6 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Sin datos esta semana.</p>
        {variant === 'page' && (
          <p className="text-[10px] text-muted-foreground mt-1">El leaderboard se actualiza cada lunes.</p>
        )}
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const totalCommissions = entries.reduce((s, e) => s + Number(e.total_commissions || 0), 0);
  const totalSales = entries.reduce((s, e) => s + Number(e.total_sales || 0), 0);

  if (variant === 'widget') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          <h3 className="font-display text-lg text-foreground">Leaderboard Semanal</h3>
        </div>

        {top3.length > 0 && (
          <div className={`grid gap-3 ${top3.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} ${top3.length >= 3 ? 'sm:grid-cols-3' : ''}`}>
            {top3.map((entry, i) => {
              const RankIcon = rankIcons[i] || TrendingUp;
              const colors = [
                'from-warning/20 to-warning/5 border-warning/30',
                'from-secondary/20 to-secondary/5 border-border',
                'from-accent/20 to-accent/5 border-accent/30',
              ];
              const iconColors = ['text-warning', 'text-secondary-foreground', 'text-accent'];

              return (
                <div key={entry.rep_id} className={`bg-gradient-to-b ${colors[i] || colors[2]} border rounded-xl p-4 text-center ${i === 0 ? 'sm:scale-105 sm:z-10' : ''}`}>
                  <RankIcon className={`w-6 h-6 mx-auto mb-2 ${iconColors[i] || iconColors[2]}`} />
                  <p className="text-sm font-bold text-foreground truncate">{entry.display_name}</p>
                  <TierBadge tier={entry.commission_tier} />
                  <p className="text-lg font-bold text-primary mt-2">{formatCLP(Math.abs(Number(entry.total_commissions)))}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{entry.total_sales} ventas · {formatCLP(Math.abs(Number(entry.total_revenue)))}</p>
                </div>
              );
            })}
          </div>
        )}

        {rest.length > 0 && (
          <div className="card-glow p-4 space-y-2">
            {rest.map(entry => (
              <div key={entry.rep_id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs font-mono text-muted-foreground w-6">#{entry.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.display_name}</p>
                </div>
                <TierBadge tier={entry.commission_tier} />
                <p className="text-sm font-bold text-primary">{formatCLP(Math.abs(Number(entry.total_commissions)))}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in relative">
      <ViewShell
        variant="compact"
        eyebrow="Equipo"
        title="Ranking Semanal"
        subtitle={`${weekLabel} · Ranking por comisiones`}
        icon={<Trophy size={22} />}
      />

      <div className="stats-grid">
        {[
          { icon: <Trophy size={18} />, val: entries.length, label: 'Representantes Activos', accent: '' },
          { icon: <TrendingUp size={18} />, val: formatCLP(totalCommissions), label: 'Comisiones Totales', accent: 'text-accent' },
          { icon: <Medal size={18} />, val: totalSales, label: 'Ventas Totales', accent: '' },
          { icon: <Crown size={18} />, val: entries[0]?.display_name || '—', label: 'Líder Semanal', accent: 'text-primary' },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header"><div className="stat-icon">{s.icon}</div></div>
            <div className={`stat-value ${s.accent}`}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {top3.length > 0 && (
        <div className={`grid gap-4 ${top3.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} ${top3.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
          {top3.map((entry, i) => {
            const RankIcon = rankIcons[i] || TrendingUp;
            const rankColors = [
              'bg-primary/10 border-primary/20 text-primary',
              'bg-muted/10 border-border/20 text-muted-foreground',
              'bg-warning/10 border-warning/20 text-warning',
            ];
            const rankIconColors = ['text-accent', 'text-muted-foreground', 'text-warning'];

            return (
              <div key={entry.rep_id} className={`card p-6 text-center border-2 ${rankColors[i] || 'border-border'} ${i === 0 ? 'lg:scale-105 lg:z-10' : ''}`}>
                <RankIcon className={`w-8 h-8 mx-auto mb-3 ${rankIconColors[i] || 'text-muted-foreground'}`} />
                <p className="text-lg font-bold text-primary">{entry.display_name}</p>
                <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[entry.commission_tier] || tierBadge.base}`}>
                  {entry.commission_tier}
                </span>
                <p className="text-2xl font-bold text-accent mt-3">{formatCLP(Math.abs(Number(entry.total_commissions)))}</p>
                <p className="text-xs text-muted-foreground mt-1">{entry.total_sales} ventas · {formatCLP(Math.abs(Number(entry.total_revenue)))}</p>
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-display text-lg">Clasificación Completa</h3>
          </div>
          <EnjTableShell>
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="text-left text-muted-foreground text-[0.65rem] uppercase tracking-wider border-b border-foreground/5">
                  <th className="pb-3 w-12">#</th>
                  <th className="pb-3">Representante</th>
                  <th className="pb-3">Nivel</th>
                  <th className="pb-3">Ventas</th>
                  <th className="pb-3">Ingresos</th>
                  <th className="pb-3 font-bold">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {rest.map(entry => (
                  <tr key={entry.rep_id} className="border-b border-foreground/[0.03] hover:bg-background/[0.02]">
                    <td className="py-3 font-mono text-muted-foreground">{entry.rank}</td>
                    <td className="py-3 font-medium text-primary">{entry.display_name}</td>
                    <td className="py-3">
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[entry.commission_tier] || tierBadge.base}`}>
                        {entry.commission_tier}
                      </span>
                    </td>
                    <td className="py-3">{entry.total_sales}</td>
                    <td className="py-3">{formatCLP(Math.abs(Number(entry.total_revenue)))}</td>
                    <td className="py-3 font-bold text-accent">{formatCLP(Math.abs(Number(entry.total_commissions)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EnjTableShell>
        </div>
      )}
    </div>
  );
}
