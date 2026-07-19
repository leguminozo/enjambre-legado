import React from 'react';
import { cn } from '../lib/utils';
import { ProgressRing } from './progress-ring';
import { TierBadge } from './tier-badge';

export interface AchievementCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  tier?: 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA';
  progress?: number; // 0-100
  status?: 'locked' | 'in_progress' | 'achieved';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const statusStyles = {
  locked: 'opacity-40 border-border bg-surface-sunken/50',
  in_progress: 'border-primary/30 bg-primary/5',
  achieved: 'border-success/30 bg-success/5',
};

export function AchievementCard({
  title,
  description,
  icon,
  tier,
  progress = 0,
  status = 'locked',
  onClick,
  className = '',
  children,
}: AchievementCardProps) {
  const isInteractive = onClick !== undefined;

  return (
    <article
      className={cn(
        'relative rounded-xl p-5 transition-all duration-300',
        'border',
        statusStyles[status],
        isInteractive && 'cursor-pointer hover:border-primary/50 hover:bg-surface-raised/50',
        className,
      )}
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }} : undefined}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-surface-raised flex items-center justify-center text-2xl">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-medium text-foreground truncate">{title}</h3>
            {tier && <TierBadgeCompact tier={tier} />}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
          
          {progress !== undefined && progress > 0 && status !== 'achieved' && (
            <div className="mt-3 flex items-center gap-3">
              <ProgressRing progress={progress} size={40} strokeWidth={3} variant={status === 'in_progress' ? 'default' : 'accent'} />
              <div className="text-xs text-muted-foreground font-mono">
                {Math.round(progress)}% completado
              </div>
            </div>
          )}
          
          {status === 'achieved' && (
            <div className="mt-3 flex items-center gap-2 text-success">
              <span className="text-sm font-medium">✓ Logrado</span>
            </div>
          )}
          
          {status === 'locked' && (
            <div className="mt-3 flex items-center gap-2 text-muted-foreground/50">
              <span className="text-sm">🔒 Bloqueado</span>
            </div>
          )}

          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </article>
  );
}

interface AchievementCardCompactProps {
  title: string;
  icon?: React.ReactNode;
  tier?: 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA';
  progress?: number;
  status?: 'locked' | 'in_progress' | 'achieved';
  className?: string;
}

export function AchievementCardCompact({
  title,
  icon,
  tier,
  progress = 0,
  status = 'locked',
  className = '',
}: AchievementCardCompactProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      statusStyles[status],
      className,
    )}>
      {icon && <span className="text-xl">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          {tier && <TierBadgeCompact tier={tier} />}
        </div>
        {progress > 0 && status !== 'achieved' && (
          <ProgressRing progress={progress} size={32} strokeWidth={3} variant={status === 'in_progress' ? 'default' : 'accent'} showValue={false} className="mt-1" />
        )}
        {status === 'achieved' && <span className="text-xs text-success mt-1 block">✓ Completado</span>}
        {status === 'locked' && <span className="text-xs text-muted-foreground/50 mt-1 block">🔒 Bloqueado</span>}
      </div>
    </div>
  );
}

function TierBadgeCompact({ tier, className = '' }: { tier: 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA'; className?: string }) {
  const config = {
    OBRERA: { label: 'Obrera', className: 'bg-stone-600/20 text-stone-300 border-stone-500/30' },
    ZÁNGANO: { label: 'Zángano', className: 'bg-amber-600/20 text-amber-300 border-amber-500/30' },
    REINA: { label: 'Reina', className: 'bg-rose-600/20 text-rose-300 border-rose-500/30' },
    COLMENA: { label: 'Colmena', className: 'bg-violet-600/20 text-violet-300 border-violet-500/30' },
  }[tier];

  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[0.55rem] font-semibold uppercase tracking-wider border', config.className, className)}>
      {config.label}
    </span>
  );
}