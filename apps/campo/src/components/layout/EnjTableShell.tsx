'use client';

import { cn } from '@/lib/cn';

interface EnjTableShellProps {
  children: React.ReactNode;
  className?: string;
  caption?: string;
}

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