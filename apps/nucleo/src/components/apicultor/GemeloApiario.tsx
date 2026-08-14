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
      <div className="card animate-pulse w-full h-[500px] bg-[#0c1410] border border-accent/15 flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-datos flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Cargando entorno 3D...
        </div>
      </div>
    ),
  },
);

/** Fallback 2D para tier legacy / sin WebGL: misma derivación de estado que el 3D. */
function GemeloApiario2D({
  colmenas = [],
  apiarioName,
  territorialAlerts = [],
  onSelectColmena,
}: GemeloApiarioProps) {
  return (
    <div className="card w-full h-[500px] bg-[#0c1410] border border-accent/15 overflow-y-auto">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-accent mb-1">
          Apiario: {apiarioName ?? 'Sin nombre'}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Vista 2D (modo compatibilidad — el 3D requiere WebGL y más memoria).
        </p>
        {colmenas.length > 0 ? (
          <ul className="space-y-2">
            {colmenas.map((c) => {
              // Misma derivación de estado que el 3D (buildHiveState por colmena).
              const state = buildHiveState(c);
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelectColmena?.(c)}
                    className="w-full text-left flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2 hover:border-accent/50 transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: state.color }}
                    />
                    <span className="text-sm text-foreground truncate">{state.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Sin colmenas registradas.</p>
        )}
        {territorialAlerts.length > 0 ? (
          <p className="text-xs text-destructive mt-4">
            {territorialAlerts.length} alerta(s) territorial(es) activa(s).
          </p>
        ) : null}
      </div>
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
      <div className="card animate-pulse w-full h-[500px] bg-[#0c1410] border border-accent/15 flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-datos flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Cargando entorno 3D...
        </div>
      </div>
    );
  }
  return <GemeloApiarioBase {...props} />;
}
