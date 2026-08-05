'use client';

import type { HiveState, RiskLevel } from '@/lib/hive-state';
import { RISK_COLORS, RISK_LABELS } from '@/lib/hive-state';

const CSS_FALLBACK: Record<RiskLevel, string> = {
  ok: 'hsl(var(--success))',
  watch: 'hsl(var(--warning))',
  alert: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))',
  unknown: 'hsl(var(--muted-foreground))',
};

interface HiveStateBadgeProps {
  state: HiveState;
  /** compact = solo pastilla; default incluye acción si hay */
  size?: 'sm' | 'md';
  showAction?: boolean;
  className?: string;
}

/**
 * Misma verdad visual que el gemelo 3D: color + label de riesgo compuesto.
 */
export function HiveStateBadge({
  state,
  size = 'sm',
  showAction = false,
  className,
}: HiveStateBadgeProps) {
  const color = state.color || RISK_COLORS[state.risk] || CSS_FALLBACK[state.risk];
  const pad = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '0.65rem' : '0.72rem';

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: pad,
          borderRadius: 999,
          fontSize,
          fontWeight: 600,
          letterSpacing: '0.02em',
          color,
          background: `${color}22`,
          border: `1px solid ${color}44`,
          lineHeight: 1.2,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
            flexShrink: 0,
          }}
        />
        {state.riskLabel || RISK_LABELS[state.risk]}
        {state.alertsNearby > 0 && (
          <span style={{ opacity: 0.85, fontWeight: 500 }}>· fitosanitario</span>
        )}
      </span>
      {showAction && state.primaryAction && (
        <span
          style={{
            fontSize: '0.62rem',
            color: 'hsl(var(--muted-foreground))',
            maxWidth: 220,
            lineHeight: 1.3,
          }}
        >
          {state.primaryAction}
        </span>
      )}
    </span>
  );
}

/** Punto de estado para strips / avatares (mismo color que HiveState). */
export function HiveStateDot({
  risk,
  color,
  size = 10,
}: {
  risk?: RiskLevel;
  color?: string;
  size?: number;
}) {
  const c = color ?? (risk ? RISK_COLORS[risk] : RISK_COLORS.unknown);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c,
        boxShadow: `0 0 8px ${c}`,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  );
}
