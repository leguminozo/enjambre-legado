'use client';

interface Metric {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

const toneClass: Record<NonNullable<Metric['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  primary: 'text-primary',
};

interface EscenaHudProps {
  metricas: Metric[];
}

/** HUD de escena (patrón RSNSceneHud de Trama): métricas en mono tabular. */
export function EscenaHud({ metricas }: EscenaHudProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {metricas.map((m) => (
        <div key={m.label} className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">{m.label}</span>
          <span className={`text-xl font-bold font-mono tabular-nums leading-tight ${toneClass[m.tone ?? 'default']}`}>{m.value}</span>
        </div>
      ))}
    </div>
  );
}
