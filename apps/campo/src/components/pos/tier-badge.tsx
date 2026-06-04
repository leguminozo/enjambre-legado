'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { Crown, Star, Shield, Flame } from 'lucide-react';

interface TierProgress {
  current_tier: string;
  tier_override: string | null;
  next_tier: string | null;
  metrics: {
    sales: number;
    revenue: number;
    best_streak: number;
    clients: number;
  };
  thresholds: {
    sales: number;
    revenue: number;
    best_streak: number;
    clients: number;
  } | null;
  progress: {
    sales: number;
    revenue: number;
    best_streak: number;
    clients: number;
    overall: number;
  };
}

const TIER_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; glow: string }> = {
  base: { label: 'Base', icon: Shield, color: 'text-muted-foreground', glow: 'bg-card text-muted-foreground' },
  senior: { label: 'Senior', icon: Star, color: 'text-primary', glow: 'bg-primary/10 text-primary' },
  elite: { label: 'Elite', icon: Crown, color: 'text-green-400', glow: 'bg-green-500/10 text-green-400' },
  legend: { label: 'Legend', icon: Flame, color: 'text-amber-400', glow: 'bg-amber-500/10 text-amber-400' },
};

export function TierBadge({ tier, size = 'sm' }: { tier: string; size?: 'sm' | 'lg' }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.base;
  const Icon = config.icon;
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-xs gap-2' : 'px-2 py-0.5 text-[10px] gap-1';
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <span className={`inline-flex items-center rounded-md font-bold uppercase tracking-widest ${config.glow} ${sizeClass}`}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}

export function TierProgressBar({ progress }: { progress: TierProgress }) {
  const pct = Math.round(progress.progress.overall * 100);
  const nextTier = progress.next_tier;
  if (!nextTier) return null;

  const nextConfig = TIER_CONFIG[nextTier];

  return (
    <div className="bg-background/20 rounded-lg p-3 border border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Progreso a <span className={nextConfig?.color || 'text-foreground'}>{nextConfig?.label || nextTier}</span>
        </span>
        <span className="text-[10px] font-mono font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-2 bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.thresholds && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {progress.thresholds.sales > 0 && (
            <MetricRow label="Ventas" current={progress.metrics.sales} target={progress.thresholds.sales} pct={progress.progress.sales} />
          )}
          {progress.thresholds.revenue > 0 && (
            <MetricRow label="Revenue" current={progress.metrics.revenue} target={progress.thresholds.revenue} pct={progress.progress.revenue} isMoney />
          )}
          {progress.thresholds.best_streak > 0 && (
            <MetricRow label="Racha" current={progress.metrics.best_streak} target={progress.thresholds.best_streak} pct={progress.progress.best_streak} suffix="d" />
          )}
          {progress.thresholds.clients > 0 && (
            <MetricRow label="Clientes" current={progress.metrics.clients} target={progress.thresholds.clients} pct={progress.progress.clients} />
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, current, target, pct, isMoney, suffix }: {
  label: string; current: number; target: number; pct: number; isMoney?: boolean; suffix?: string;
}) {
  const fmt = (n: number) => isMoney ? '$' + n.toLocaleString('es-CL') : n.toLocaleString('es-CL');
  const done = pct >= 1;

  return (
    <div className="flex items-center justify-between text-[10px]">
    <span className="text-muted-foreground">{label}</span>
        <span className={done ? 'text-green-400 font-bold' : 'text-muted-foreground'}>
        {fmt(current)}{suffix}/{fmt(target)}{suffix}
        {done && ' ✓'}
      </span>
    </div>
  );
}

export function useTierProgress() {
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTierProgress = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';
      const res = await fetch(`${API_BASE}/api/rep-ventas/tier-progress`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTierProgress(json.data);
      }
    } catch (err) {
      console.error('[TierProgress] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTierProgress(); }, [fetchTierProgress]);

  return { tierProgress, loading, refetch: fetchTierProgress };
}
