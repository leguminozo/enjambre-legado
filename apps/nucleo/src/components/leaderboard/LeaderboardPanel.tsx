'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError } from '@enjambre/ui';
import { Trophy, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';

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
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-primary-foreground border-border text-muted-foreground',
  'bg-orange-50 border-orange-200 text-orange-700',
];
const rankIconColors = ['text-accent', 'text-muted-foreground', 'text-warning'];

const tierBadge: Record<string, string> = {
  base: 'bg-secondary text-muted-foreground',
  senior: 'bg-oro-miel-glow/30 text-oro-miel-dark',
  elite: 'bg-salud-optima/10 text-salud-optima',
  legend: 'bg-purple-100 text-purple-600',
};

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { fetchLeaderboard(); }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('weekly_leaderboard', {
        p_empresa_id: (await supabase.from('usuarios_empresas').select('empresa_id').limit(1).single()).data?.empresa_id,
      });
      if (error) throw error;
      setEntries((data as unknown as LeaderboardEntry[]) || []);
    } catch (err) {
      showToast(friendlyError(err, 'Error al cargar ranking'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCLP = (n: number) => '$' + Number(n || 0).toLocaleString('es-CL');

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekLabel = `Semana del ${weekStart.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-oro-miel-dark" size={32} />
        <p className="text-sm text-text-muted font-datos uppercase tracking-widest">Cargando ranking...</p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const totalCommissions = entries.reduce((s, e) => s + Number(e.total_commissions || 0), 0);
  const totalSales = entries.reduce((s, e) => s + Number(e.total_sales || 0), 0);

  return (
    <div className="space-y-8 animate-in relative">
      {toast && (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-in ${
          toast.type === 'success' ? 'bg-salud-optima/10 border-salud-optima text-salud-optima' : 'bg-salud-riesgo/10 border-salud-riesgo text-salud-riesgo'
        }`}>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-oro-miel-glow flex items-center justify-center text-oro-miel-dark">
          <Trophy size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display text-bosque-ulmo">Ranking Semanal</h2>
          <p className="text-sm text-text-muted">{weekLabel} · Ranking por comisiones</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Trophy size={18} />, val: entries.length, label: 'Representantes Activos', accent: '' },
          { icon: <TrendingUp size={18} />, val: formatCLP(totalCommissions), label: 'Comisiones Totales', accent: 'text-oro-miel-dark' },
          { icon: <Medal size={18} />, val: totalSales, label: 'Ventas Totales', accent: '' },
          { icon: <Crown size={18} />, val: entries[0]?.display_name || '—', label: 'Líder Semanal', accent: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-in" style={{ animationDelay: `${i * 80}ms` }}>
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
              <div key={entry.rep_id} className={`card p-6 text-center border-2 ${rankColors[i] || 'border-white/10'} ${i === 0 ? 'lg:scale-105 lg:z-10' : ''}`}>
                <RankIcon className={`w-8 h-8 mx-auto mb-3 ${rankIconColors[i] || 'text-muted-foreground'}`} />
                <p className="text-lg font-bold text-bosque-ulmo">{entry.display_name}</p>
                <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[entry.commission_tier] || tierBadge.base}`}>
                  {entry.commission_tier}
                </span>
                <p className="text-2xl font-bold text-oro-miel-dark mt-3">{formatCLP(Number(entry.total_commissions))}</p>
                <p className="text-xs text-text-muted mt-1">{entry.total_sales} ventas · {formatCLP(Number(entry.total_revenue))}</p>
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-oro-miel-dark" />
            <h3 className="font-display text-lg">Clasificación Completa</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-[0.65rem] uppercase tracking-wider border-b border-foreground/5">
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
                    <td className="py-3 font-mono text-text-muted">{entry.rank}</td>
                    <td className="py-3 font-medium text-bosque-ulmo">{entry.display_name}</td>
                    <td className="py-3">
                      <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tierBadge[entry.commission_tier] || tierBadge.base}`}>
                        {entry.commission_tier}
                      </span>
                    </td>
                    <td className="py-3">{entry.total_sales}</td>
                    <td className="py-3">{formatCLP(Number(entry.total_revenue))}</td>
                    <td className="py-3 font-bold text-oro-miel-dark">{formatCLP(Number(entry.total_commissions))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="card p-8 text-center">
          <Trophy className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted italic">Sin datos esta semana. El ranking se actualiza con cada venta.</p>
        </div>
      )}
    </div>
  );
}
