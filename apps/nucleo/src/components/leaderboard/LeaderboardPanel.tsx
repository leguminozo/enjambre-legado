'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast, ViewLoading } from '@enjambre/ui';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
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
const rankColors = [
  'bg-primary/10 border-primary/20 text-primary',
  'bg-slate-500/10 border-slate-500/20 text-slate-400',
  'bg-amber-700/10 border-amber-700/20 text-amber-600',
];
const rankIconColors = ['text-accent', 'text-muted-foreground', 'text-warning'];

const tierBadge: Record<string, string> = {
  base: 'bg-secondary text-muted-foreground',
  senior: 'bg-accent/15 text-accent',
  elite: 'bg-success/10 text-success',
  legend: 'bg-card text-foreground',
};

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('weekly_leaderboard');
      if (error) throw error;
      setEntries(Array.isArray(data) ? (data as LeaderboardEntry[]) : []);
    } catch (err) {
      toast(friendlyError(err, 'Error al cargar ranking'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const formatCLP = (n: number) => formatCurrency(n);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekLabel = `Semana del ${weekStart.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`;

  if (loading) {
    return <ViewLoading variant="view" label="Ranking" hideLabel />;
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const totalCommissions = entries.reduce((s, e) => s + Number(e.total_commissions || 0), 0);
  const totalSales = entries.reduce((s, e) => s + Number(e.total_sales || 0), 0);

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
            return (
              <div key={entry.rep_id} className={`card p-6 text-center border-2 ${rankColors[i] || 'border-border'} ${i === 0 ? 'lg:scale-105 lg:z-10' : ''}`}>
                <RankIcon className={`w-8 h-8 mx-auto mb-3 ${rankIconColors[i] || 'text-muted-foreground'}`} />
                <p className="text-lg font-bold text-primary">{entry.display_name}</p>
                <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[entry.commission_tier] || tierBadge.base}`}>
                  {entry.commission_tier}
                </span>
                <p className="text-2xl font-bold text-accent mt-3">{formatCLP(Number(entry.total_commissions))}</p>
                <p className="text-xs text-muted-foreground mt-1">{entry.total_sales} ventas · {formatCLP(Number(entry.total_revenue))}</p>
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
                    <td className="py-3">{formatCLP(Number(entry.total_revenue))}</td>
                    <td className="py-3 font-bold text-accent">{formatCLP(Number(entry.total_commissions))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EnjTableShell>
        </div>
      )}

      {entries.length === 0 && (
        <div className="card p-8 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground italic">Sin datos esta semana. El ranking se actualiza con cada venta.</p>
        </div>
      )}
    </div>
  );
}
