'use client';

import { cn } from '@/lib/cn';

interface ViewShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  greeting?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'hero' | 'compact';
  className?: string;
}

export function ViewShell({
  title,
  subtitle,
  eyebrow,
  greeting,
  icon,
  actions,
  children,
  variant = 'hero',
  className,
}: ViewShellProps) {
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