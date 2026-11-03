'use client';

import { cn } from '@/lib/cn';

export interface Metric {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  badge?: string;
  description?: string;
}

const toneClass: Record<NonNullable<Metric['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  primary: 'text-primary',
};

const toneDotClass: Record<NonNullable<Metric['tone']>, string> = {
  default: 'bg-muted-foreground/40',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  primary: 'bg-primary',
};

export interface EscenaHudProps {
  metricas: Metric[];
  variant?: 'cards' | 'inline';
  className?: string;
}

/** HUD de escena (patrón RSNSceneHud de Trama): métricas en mono tabular con soporte de tarjetas o inline. */
export function EscenaHud({ metricas, variant = 'cards', className }: EscenaHudProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-2', className)}>
        {metricas.map((m) => (
          <div key={m.label} className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">{m.label}</span>
            <span className={cn('text-xl font-bold font-mono tabular-nums leading-tight', toneClass[m.tone ?? 'default'])}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5', className)}>
      {metricas.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 flex flex-col justify-between hover:border-border/90 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 truncate">
              {m.label}
            </span>
            {m.tone && m.tone !== 'default' && (
              <span className={cn('size-1.5 rounded-full shrink-0', toneDotClass[m.tone])} />
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1 gap-2">
            <span className={cn('text-xl sm:text-2xl font-bold font-mono tabular-nums leading-none', toneClass[m.tone ?? 'default'])}>
              {m.value}
            </span>
            {m.badge && (
              <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-raised text-muted-foreground border border-border/40 shrink-0">
                {m.badge}
              </span>
            )}
          </div>
          {m.description && (
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 truncate">
              {m.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
