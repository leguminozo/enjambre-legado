'use client';

import { useEffect, useRef } from 'react';

interface AxeAuditProps {
  children: React.ReactNode;
  enabled?: boolean;
  onViolation?: (violations: unknown[]) => void;
}

export function AxeAudit({ children, enabled = process.env.NODE_ENV === 'development', onViolation }: AxeAuditProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const runAxe = async () => {
      const axe = await import('axe-core');
      const results = await axe.default.run(containerRef.current!);
      
      if (results.violations.length > 0) {
        console.warn('[A11y Audit] Violations found:', results.violations);
        onViolation?.(results.violations);
      }
    };

    runAxe();
  }, [enabled, onViolation]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
