'use client';

import { cn } from '../lib/utils';

export type PanelFocus = 'a' | 'b' | null;

interface PanelFocusToggleProps {
  /** Claves de los paneles (para aria-pressed y data-focus) */
  aKey: string;
  bKey: string;
  /** Etiquetas visibles de cada panel */
  aLabel: string;
  bLabel: string;
  /** Panel maximizado: 'a' | 'b' | null (null = ambos visibles) */
  focus: PanelFocus;
  onFocusChange: (focus: PanelFocus) => void;
  className?: string;
}

/**
 * Segmented control para vistas de dos paneles (lista+detalle, editor+preview):
 * maximiza un panel y colapsa el otro, recuperando espacio para la tarea concreta.
 * Es presentacional: la vista aplica el layout (p. ej. grid-template-columns).
 */
export function PanelFocusToggle({
  aKey,
  bKey,
  aLabel,
  bLabel,
  focus,
  onFocusChange,
  className,
}: PanelFocusToggleProps) {
  const options: { value: PanelFocus; label: string; title: string }[] = [
    { value: null, label: 'Ambos', title: 'Mostrar ambos paneles' },
    { value: 'a', label: aLabel, title: `Maximizar ${aLabel}` },
    { value: 'b', label: bLabel, title: `Maximizar ${bLabel}` },
  ];

  return (
    <div
      role="group"
      aria-label="Distribución de paneles"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-sunken/40 p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = focus === opt.value;
        return (
          <button
            key={opt.value ?? 'both'}
            type="button"
            onClick={() => onFocusChange(opt.value)}
            aria-pressed={isActive}
            title={opt.title}
            className={cn(
              'min-h-9 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
