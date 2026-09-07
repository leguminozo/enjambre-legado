import React from 'react';
import { cn } from '../lib/utils';

type GuardianTier = 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA';

const tierConfig: Record<GuardianTier, { 
  label: string; 
  icon: React.ReactNode;
  className: string;
  description: string;
}> = {
  OBRERA: {
    label: 'Obrera',
    icon: <span className="text-[0.7rem]">🐝</span>,
    className: 'bg-muted text-muted-foreground border-border',
    description: 'Comienzas tu camino. Cada compra genera impacto.',
  },
  'ZÁNGANO': {
    label: 'Zángano',
    icon: <span className="text-[0.7rem]">🍯</span>,
    className: 'bg-warning/15 text-warning border-warning/30',
    description: 'Conexión profunda con el territorio. Acceso a recolecciones anticipadas.',
  },
  REINA: {
    label: 'Reina',
    icon: <span className="text-[0.7rem]">👑</span>,
    className: 'bg-accent/15 text-accent border-accent/30',
    description: 'Impacto regenerativo consolidado. Reservas exclusivas y contenido territorial.',
  },
  COLMENA: {
    label: 'Colmena',
    icon: <span className="text-[0.7rem]">🏛️</span>,
    className: 'bg-info/15 text-info border-info/30',
    description: 'Guardiana del legado. Acceso completo a la red de custodia del patrimonio forestal.',
  },
};

export interface TierBadgeProps {
  tier: GuardianTier;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = 'md', showDescription = false, className = '' }: TierBadgeProps) {
  const config = tierConfig[tier];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[0.6rem] gap-1',
    md: 'px-3 py-1 text-[0.7rem] gap-1.5',
    lg: 'px-4 py-1.5 text-[0.8rem] gap-2',
  };

  return (
    <div className={cn('flex flex-col items-start', className)}>
      <span
        className={cn(
          'inline-flex items-center font-semibold tracking-wider uppercase rounded-full border',
          sizeClasses[size],
          config.className,
        )}
      >
        {config.icon}
        {config.label}
      </span>
      {showDescription && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-xs">
          {config.description}
        </p>
      )}
    </div>
  );
}

export interface TierBadgeCompactProps {
  tier: GuardianTier;
  className?: string;
}

export function TierBadgeCompact({ tier, className = '' }: TierBadgeCompactProps) {
  const config = tierConfig[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-[0.6rem] font-semibold tracking-wider uppercase',
        'border',
        config.className,
        className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

export { tierConfig };