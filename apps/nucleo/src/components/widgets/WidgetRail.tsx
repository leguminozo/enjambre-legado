'use client';

import { useAuthStore } from '@enjambre/auth';
import type { WidgetContexto } from './types';
import { widgetsPara } from './registry';

interface WidgetRailProps {
  contexto: WidgetContexto;
  className?: string;
}

/** Apila verticalmente los widgets registrados para un contexto y rol del usuario. */
export function WidgetRail({ contexto, className }: WidgetRailProps) {
  const userRole = useAuthStore((s) => s.user?.role);
  const widgets = widgetsPara(contexto, userRole);

  if (widgets.length === 0) return null;

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
    >
      {widgets.map((w) => (
        <w.Componente key={w.key} />
      ))}
    </div>
  );
}
