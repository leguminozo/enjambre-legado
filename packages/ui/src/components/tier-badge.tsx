import React from 'react';
import { cn } from '../lib/utils';

export type GuardianTier = 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA' | string;

const tierConfig: Record<string, { 
  label: string; 
  icon: React.ReactNode;
  className: string;
  description: string;
}> = {
  OBRERA: {
    label: 'Iniciador',
    icon: <span className="text-[0.7rem]">🌱</span>,
    className: 'bg-muted text-muted-foreground border-border',
    description: 'Comienzas tu trayectoria. Cada compra genera impacto territorial.',
  },
  'ZÁNGANO': {
    label: 'Aliado',
    icon: <span className="text-[0.7rem]">🌿</span>,
    className: 'bg-warning/15 text-warning border-warning/30',
    description: 'Vínculo profundo con el territorio. Acceso a recolecciones anticipadas.',
  },
  REINA: {
    label: 'Círculo de la Reina',
    icon: <span className="text-[0.7rem]">👑</span>,
    className: 'bg-accent/15 text-accent border-accent/30',
    description: 'Presencia consolidada. Reservas exclusivas y partidas de origen.',
  },
  COLMENA: {
    label: 'Guardián Legado',
    icon: <span className="text-[0.7rem]">✨</span>,
    className: 'bg-info/15 text-info border-info/30',
    description: 'Máxima distinción. Acceso completo al patrimonio territorial.',
  },
};

export interface TierBadgeProps {
  tier?: GuardianTier;
  label?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  description?: string;
  className?: string;
}

export function TierBadge({
  tier = 'OBRERA',
  label,
  icon,
  size = 'md',
  showDescription = false,
  description,
  className = '',
}: TierBadgeProps) {
  const normalizedKey = typeof tier === 'string' ? tier.toUpperCase() : 'OBRERA';
  const baseConfig = tierConfig[normalizedKey] || {
    label: label || tier,
    icon: icon || <span className="text-[0.7rem]">🌱</span>,
    className: 'bg-accent/15 text-accent border-accent/30',
    description: description || 'Miembro de la red territorial.',
  };

  const finalLabel = label || baseConfig.label;
  const finalIcon = icon !== undefined ? icon : baseConfig.icon;
  const finalDesc = description || baseConfig.description;

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
          baseConfig.className,
        )}
      >
        {finalIcon}
        {finalLabel}
      </span>
      {showDescription && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed max-w-xs">
          {finalDesc}
        </p>
      )}
    </div>
  );
}

export interface TierBadgeCompactProps {
  tier?: GuardianTier;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function TierBadgeCompact({ tier = 'OBRERA', label, icon, className = '' }: TierBadgeCompactProps) {
  const normalizedKey = typeof tier === 'string' ? tier.toUpperCase() : 'OBRERA';
  const baseConfig = tierConfig[normalizedKey] || {
    label: label || tier,
    icon: icon || <span className="text-[0.7rem]">🌱</span>,
    className: 'bg-accent/15 text-accent border-accent/30',
    description: '',
  };

  const finalLabel = label || baseConfig.label;
  const finalIcon = icon !== undefined ? icon : baseConfig.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-[0.6rem] font-semibold tracking-wider uppercase',
        'border',
        baseConfig.className,
        className,
      )}
    >
      {finalIcon}
      {finalLabel}
    </span>
  );
}

export { tierConfig };