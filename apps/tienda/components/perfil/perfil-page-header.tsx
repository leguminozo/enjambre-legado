import type { ReactNode } from 'react';

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
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
      <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
        {icon && (
          <div className="w-11 h-11 shrink-0 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent-text mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          {greeting && (
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-text font-semibold block">
              {greeting}
            </span>
          )}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-light text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {mission && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              {mission}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
