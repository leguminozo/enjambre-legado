import type { ReactNode } from 'react';
import { ModuleHero } from '@enjambre/ui';

/**
 * Cabecera canónica de páginas del shell guardián (/perfil/*).
 * Alinea con ModuleHero / design system (Cormorant display, tokens).
 */
export function PerfilPageHeader({
  greeting,
  title,
  mission,
  icon,
  action,
}: {
  greeting?: string;
  title: string;
  mission?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {icon && (
          <div className="w-10 h-10 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center text-accent mt-1">
            {icon}
          </div>
        )}
        <ModuleHero
          greeting={greeting}
          title={title}
          mission={mission}
          className="!mb-0 min-w-0"
        />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
