import type { WidgetContexto } from './types';
import { widgetsPara } from './registry';

interface WidgetRailProps {
  contexto: WidgetContexto;
  className?: string;
}

/** Apila verticalmente los widgets registrados para un contexto. */
export function WidgetRail({ contexto, className }: WidgetRailProps) {
  const widgets = widgetsPara(contexto);
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
