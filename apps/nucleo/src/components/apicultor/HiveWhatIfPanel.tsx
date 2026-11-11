'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import type { HiveState } from '@/lib/hive-state';
import { RISK_LABELS } from '@/lib/hive-state';
import {
  SCENARIOS,
  projectHiveScenario,
  type ScenarioId,
} from '@/lib/hive-decision';

interface HiveWhatIfPanelProps {
  state: HiveState;
  defaultExpanded?: boolean;
}

/**
 * Escenarios what-if sobre el riesgo compuesto (capa de decisión mínima).
 */
export function HiveWhatIfPanel({ state, defaultExpanded = false }: HiveWhatIfPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [scenario, setScenario] = useState<ScenarioId>('ignore_varroa_30d');
  const projection = useMemo(
    () => projectHiveScenario(state, scenario),
    [state, scenario],
  );

  return (
    <div
      style={{
        borderRadius: 'var(--radius-sm)',
        border: '1px solid hsl(var(--border) / 0.6)',
        background: 'hsl(var(--muted) / 0.35)',
        padding: '10px 14px',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sliders size={12} style={{ color: 'hsl(var(--primary))' }} />
            <span>Simulador de Escenarios (What-If)</span>
          </div>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'hsl(var(--muted-foreground))',
              margin: '2px 0 0 0',
            }}
          >
            {expanded
              ? 'Proyección de riesgo biológico según decisiones de manejo.'
              : `Puntaje actual: ${projection.baseline.score} (${RISK_LABELS[projection.baseline.risk]}) · Clic para simular escenarios`}
          </p>
        </div>
        <div style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid hsl(var(--border) / 0.4)' }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {SCENARIOS.map((s) => {
          const active = s.id === scenario;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              style={{
                fontSize: '0.65rem',
                padding: '5px 10px',
                borderRadius: 999,
                border: active
                  ? '1px solid hsl(var(--primary))'
                  : '1px solid hsl(var(--border))',
                background: active ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 8,
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'hsl(var(--muted-foreground))' }}>Hoy</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: state.color }}>
            {projection.baseline.score}
          </div>
          <div style={{ fontSize: '0.65rem', color: state.color }}>
            {RISK_LABELS[projection.baseline.risk]}
          </div>
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color:
              projection.direction === 'worse'
                ? 'hsl(var(--destructive))'
                : projection.direction === 'better'
                  ? 'hsl(var(--success))'
                  : 'hsl(var(--muted-foreground))',
          }}
        >
          {projection.deltaScore > 0
            ? `+${projection.deltaScore}`
            : projection.deltaScore === 0
              ? '='
              : projection.deltaScore}
          {' →'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'hsl(var(--muted-foreground))' }}>
            Si ocurre
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: projection.color }}>
            {projection.projected.score}
          </div>
          <div style={{ fontSize: '0.65rem', color: projection.color }}>
            {RISK_LABELS[projection.projected.risk]}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'hsl(var(--foreground) / 0.85)', margin: 0 }}>
        {projection.narrative}
      </p>
      </div>
      )}
    </div>
  );
}
