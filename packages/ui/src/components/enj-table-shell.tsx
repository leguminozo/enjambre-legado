'use client';

import { cn } from '../lib/utils';

export interface EnjTableShellProps {
  children: React.ReactNode;
  className?: string;
  caption?: string;
}

/** Contenedor de tablas con scroll horizontal — canónico (nucleo + campo). */
export function EnjTableShell({ children, className, caption }: EnjTableShellProps) {
  return (
    <div className={cn('enj-table-shell', className)}>
      {caption && <p className="enj-table-shell-caption">{caption}</p>}
      <div className="enj-table-shell-scroll">
        {children}
      </div>
    </div>
  );
}
