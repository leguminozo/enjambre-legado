import React from 'react';
import { cn } from '../lib/utils';
import { ProgressRing } from './progress-ring';

export interface ImpactStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number; // positive or negative percentage
    label?: string;
  };
  progress?: number; // 0-100 for ring
  progressLabel?: string;
  variant?: 'default' | 'co2' | 'bosque' | 'azucar' | 'irr' | 'arboles' | 'ciclos';
  className?: string;
}

type VariantKey = NonNullable<ImpactStatCardProps['variant']>;

const variantConfig: Record<VariantKey, { iconBg: string; border: string }> = {
  default: { iconBg: 'bg-primary/10 text-primary', border: 'border-border' },
  co2: { iconBg: 'bg-success/10 text-success', border: 'border-success/20' },
  bosque: { iconBg: 'bg-primary/10 text-primary', border: 'border-primary/20' },
  azucar: { iconBg: 'bg-warning/10 text-warning', border: 'border-warning/20' },
  irr: { iconBg: 'bg-info/10 text-info', border: 'border-info/20' },
  arboles: { iconBg: 'bg-success/10 text-success', border: 'border-success/20' },
  ciclos: { iconBg: 'bg-accent/10 text-accent', border: 'border-accent/20' },
};

const defaultIcons: Record<VariantKey, React.ReactNode> = {
  default: <span className="text-2xl">📊</span>,
  co2: <span className="text-2xl">🌿</span>,
  bosque: <span className="text-2xl">🌲</span>,
  azucar: <span className="text-2xl">🍃</span>,
  irr: <span className="text-2xl">✨</span>,
  arboles: <span className="text-2xl">🌳</span>,
  ciclos: <span className="text-2xl">🔄</span>,
};

export function ImpactStatCard({
  title,
  value,
  unit,
  icon,
  trend,
  progress,
  progressLabel,
  variant = 'default',
  className = '',
}: ImpactStatCardProps) {
  const v = variant as VariantKey;
  const config = variantConfig[v];
  const defaultIcon = defaultIcons[v];

  return (
    <article
      className={cn(
        'relative rounded-xl p-5 border transition-all duration-300',
        'bg-card hover:bg-surface-raised/50',
        config.border,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.iconBg)}>
              {icon ?? defaultIcon}
            </span>
            <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
          </div>
          
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-3xl font-bold text-foreground">
              {value}
            </span>
            {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
          </div>

          {trend && (
            <div className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', trend.value >= 0 ? 'text-success' : 'text-destructive')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
            </div>
          )}
        </div>

        {(progress !== undefined || progressLabel) && (
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {progress !== undefined && (
              <ProgressRing
                progress={progress}
                size={56}
                strokeWidth={4}
                variant={variant === 'co2' ? 'success' : variant === 'bosque' ? 'success' : variant === 'azucar' ? 'warning' : variant === 'irr' ? 'accent' : 'default'}
                showValue
              />
            )}
            {progressLabel && (
              <span className="text-[0.6rem] text-muted-foreground text-center max-w-[60px]">
                {progressLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ImpactStatGrid({ 
  stats, 
  columns = 2, 
  gap = 'gap-4',
  className = '' 
}: { 
  stats: ImpactStatCardProps[]; 
  columns?: 1 | 2 | 3 | 4;
  gap?: string;
  className?: string;
}) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid', colClass, gap, className)}>
      {stats.map((stat, i) => (
        <ImpactStatCard key={i} {...stat} />
      ))}
    </div>
  );
}