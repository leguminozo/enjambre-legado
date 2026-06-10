'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { TierBadge } from './tier-badge';

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

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';
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

  const formatCLP = (n: number) => '$' + Math.abs(n).toLocaleString('es-CL');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Cargando ranking...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card-glow p-6 text-center">
      <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Sin datos esta semana.</p>
      <p className="text-[10px] text-muted-foreground mt-1">El leaderboard se actualiza cada lunes.</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-warning" />
        <h3 className="font-serif text-lg text-foreground">Leaderboard Semanal</h3>
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
                <p className="text-lg font-bold text-primary mt-2">{formatCLP(Number(entry.total_commissions))}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{entry.total_sales} ventas · {formatCLP(Number(entry.total_revenue))}</p>
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
              <p className="text-sm font-bold text-primary">{formatCLP(Number(entry.total_commissions))}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
