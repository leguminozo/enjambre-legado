'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useLegacyDevice } from '@enjambre/ui';
import { buildHiveState } from '@/lib/hive-state';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import type { TerritorialAlertInput } from '@/lib/hive-state';

interface GemeloApiarioProps {
  colmenas?: ColmenaWithRelations[];
  apiarioName?: string;
  apiarioLat?: number | null;
  apiarioLng?: number | null;
  territorialAlerts?: TerritorialAlertInput[];
  onSelectColmena?: (colmena: ColmenaWithRelations) => void;
}

const GemeloApiarioBase = dynamic(
  () => import('./GemeloApiarioBase').then((mod) => mod.GemeloApiario),
  {
    ssr: false,
    loading: () => (
      <div className="card animate-pulse w-full h-[500px] bg-surface-sunken border border-accent/15 flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-datos flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Cargando entorno 3D...
        </div>
      </div>
    ),
  },
);

/** Fallback 2D para tier legacy / sin WebGL: misma derivación de estado y stats que el 3D. */
function GemeloApiario2D({
  colmenas = [],
  apiarioName,
  territorialAlerts = [],
  onSelectColmena,
}: GemeloApiarioProps) {
  return (
    <div className="card w-full min-h-[500px] bg-surface-sunken border border-accent/15 overflow-y-auto p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-border/50">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-mono text-accent">
            Apiario · Vista 2D
          </div>
          <h3 className="text-base font-bold text-foreground font-display">
            {apiarioName ?? 'Apiario sin nombre'}
          </h3>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {colmenas.length} colmena{colmenas.length === 1 ? '' : 's'}
        </div>
      </div>

      {colmenas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {colmenas.map((c) => {
            const state = buildHiveState(c);
            const trendSymbol =
              state.weightTrend === 'up' ? '↑' : state.weightTrend === 'down' ? '↓' : '→';
            return (
              <button
                key={c.id}
                onClick={() => onSelectColmena?.(c)}
                className="w-full text-left rounded-xl border border-border/60 bg-card/80 p-3.5 hover:border-accent/60 hover:bg-surface-raised transition-all space-y-2.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ background: state.color }}
                    />
                    <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                      {state.name}
                    </span>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                    style={{
                      background: `${state.color}15`,
                      color: state.color,
                      border: `1px solid ${state.color}35`,
                    }}
                  >
                    {state.riskLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-datos">
                  <div className="rounded-lg bg-surface-sunken/80 px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground uppercase">Peso</div>
                    <div className="text-xs font-semibold text-foreground">
                      {state.weightKg != null ? `${state.weightKg.toFixed(1)}k ${trendSymbol}` : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-sunken/80 px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground uppercase">Varroa</div>
                    <div
                      className="text-xs font-semibold"
                      style={{
                        color:
                          state.varroaLevel != null && state.varroaLevel > 3
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--foreground))',
                      }}
                    >
                      {state.varroaLevel != null ? `${state.varroaLevel}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-sunken/80 px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground uppercase">Visita</div>
                    <div className="text-xs font-semibold text-foreground">
                      {state.daysSinceInspection != null ? `${state.daysSinceInspection}d` : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-sunken/80 px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground uppercase">Reina</div>
                    <div className="text-xs font-semibold text-foreground">
                      {state.queenPresent === true ? '👑 OK' : state.queenPresent === false ? 'Sin reina' : '—'}
                    </div>
                  </div>
                </div>

                {state.primaryAction && (
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/30 truncate">
                    <span className="text-accent font-medium">Recomendación:</span> {state.primaryAction}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-6 text-center">
          Sin colmenas registradas en este apiario.
        </p>
      )}

      {territorialAlerts.length > 0 && (
        <p className="text-xs text-destructive mt-4 font-medium">
          ⚠️ {territorialAlerts.length} alerta(s) fitosanitaria(s) en radio.
        </p>
      )}
    </div>
  );
}

export function GemeloApiario(props: GemeloApiarioProps) {
  const { legacy, motionReduced } = useLegacyDevice();
  // WebGL se verifica post-mount: en SSR (null) renderiza el placeholder de
  // carga, igual que hace hoy el dynamic ssr:false.
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebglOk(
        !!canvas.getContext('webgl2') ||
          !!canvas.getContext('webgl') ||
          !!canvas.getContext('experimental-webgl'),
      );
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (legacy || motionReduced || webglOk === false) {
    return <GemeloApiario2D {...props} />;
  }
  if (webglOk === null) {
    return (
      <div className="card animate-pulse w-full h-[500px] bg-surface-sunken border border-accent/15 flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-datos flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Cargando entorno 3D...
        </div>
      </div>
    );
  }
  return <GemeloApiarioBase {...props} />;
}
