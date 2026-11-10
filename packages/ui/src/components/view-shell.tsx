'use client';

import { cn } from '../lib/utils';

export interface ViewShellProps {
  title: React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  greeting?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** clean (editorial, nucleo), compact (panel) o hero (banner). */
  variant?: 'hero' | 'compact' | 'clean';
  className?: string;
}

/** Cabecera de vista canónica (nucleo + campo). */
export function ViewShell({
  title,
  subtitle,
  eyebrow,
  greeting,
  icon,
  actions,
  children,
  variant = 'compact',
  className,
}: ViewShellProps) {
  if (variant === 'clean') {
    return (
      <header className={cn('view-shell view-shell--clean flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2', className)}>
        <div className="space-y-1 min-w-0">
          {eyebrow && <span className="view-shell-eyebrow">{eyebrow}</span>}
          {greeting && <span className="view-shell-greeting">{greeting}</span>}
          <h1 className="font-display italic text-2xl sm:text-3xl font-normal tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="view-shell-actions shrink-0">{actions}</div>}
        {children}
      </header>
    );
  }

  if (variant === 'compact') {
    return (
      <header className={cn('view-shell view-shell--compact', className)}>
        <div className="view-shell-compact-main">
          {icon && <div className="view-shell-icon">{icon}</div>}
          <div className="view-shell-text min-w-0">
            {eyebrow && <span className="view-shell-eyebrow">{eyebrow}</span>}
            {greeting && <span className="view-shell-greeting">{greeting}</span>}
            <h1 className="view-shell-title view-shell-title--compact">{title}</h1>
            {subtitle && <p className="view-shell-subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="view-shell-actions">{actions}</div>}
        {children}
      </header>
    );
  }

  return (
    <header className={cn('view-shell view-shell--hero hero-banner', className)}>
      <div className="view-shell-hero-inner">
        <div className="view-shell-text min-w-0">
          {eyebrow && <span className="view-shell-eyebrow">{eyebrow}</span>}
          {greeting && <span className="view-shell-greeting hero-greeting">{greeting}</span>}
          <h1 className="view-shell-title hero-title">{title}</h1>
          {subtitle && <p className="view-shell-subtitle hero-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="view-shell-actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
