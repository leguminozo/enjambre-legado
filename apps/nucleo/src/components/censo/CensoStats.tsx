'use client';

import { useEffect, useState } from 'react';

export interface CensoStatsData {
  actores_activos: number;
  comunas: number;
  apiarios_activos: number;
  colmenas_registradas: number;
  cierre: string | null;
}

interface CensoStatsProps {
  initialStats: CensoStatsData | null;
  /** strip = métricas bajo el mapa; prose = una línea */
  variant?: 'strip' | 'prose';
}

/**
 * Contador del censo público. SSR + revalidación en foco / 30 min.
 */
export function CensoStats({ initialStats, variant = 'prose' }: CensoStatsProps) {
  const [stats, setStats] = useState<CensoStatsData | null>(initialStats);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      fetch('/api/censo-publico/stats')
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (!cancelled && json?.data) setStats(json.data);
        })
        .catch(() => {
          /* conservar datos actuales */
        });
    };

    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(refresh, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, []);

  if (variant === 'strip') {
    // Fase fundacional: menos de 20 actores no muestra contadores de personas
    // para evitar señal de escasez. Solo comunas representadas.
    const actores = stats?.actores_activos ?? 0;
    const comunas = stats?.comunas ?? 0;
    const colmenas = stats?.colmenas_registradas ?? 0;

    if (!stats || actores === 0) {
      return (
        <p className="text-sm text-muted-foreground" role="status">
          Registro fundacional abierto · Chiloé 2026–2027
        </p>
      );
    }

    // Umbral: mostrar contadores completos solo cuando hay masa crítica
    if (actores >= 20) {
      const items: { rawValue: number; value: string; label: string }[] = [];
      items.push({
        rawValue: actores,
        value: actores.toLocaleString('es-CL'),
        label: actores === 1 ? 'apicultor' : 'apicultores',
      });
      if (comunas > 0) {
        items.push({
          rawValue: comunas,
          value: comunas.toLocaleString('es-CL'),
          label: comunas === 1 ? 'comuna' : 'comunas',
        });
      }
      if (colmenas > 0) {
        items.push({
          rawValue: colmenas,
          value: colmenas.toLocaleString('es-CL'),
          label: 'colmenas',
        });
      }
      return (
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3" role="status" aria-live="polite">
          {items.map((item) => (
            <div key={item.label}>
              <p
                className="counter-value text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-foreground"
                data-target={item.rawValue}
              >
                {item.value}
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // Fase temprana: mostrar solo comunas representadas (dato territorial, no de masa)
    if (comunas > 0) {
      return (
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3" role="status" aria-live="polite">
          <div>
            <p
              className="counter-value text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-foreground"
              data-target={comunas}
            >
              {comunas.toLocaleString('es-CL')}
            </p>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
              {comunas === 1 ? 'comuna' : 'comunas'} en el mapa
            </p>
          </div>
        </div>
      );
    }

    return (
      <p className="text-sm text-muted-foreground" role="status">
        Registro fundacional abierto · Chiloé 2026–2027
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        <span className="font-medium text-foreground">Censo fundacional abierto.</span>
      </p>
    );
  }

  if (stats.actores_activos >= 20) {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {stats.actores_activos.toLocaleString('es-CL')} apicultores
        </span>{' '}
        ya están en el mapa, en{' '}
        <span className="font-medium text-foreground">
          {stats.comunas.toLocaleString('es-CL')}
        </span>{' '}
        comunas.
      </p>
    );
  }

  if (stats.colmenas_registradas > 1000) {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {stats.colmenas_registradas.toLocaleString('es-CL')} colmenas
        </span>{' '}
        registradas en{' '}
        <span className="font-medium text-foreground">
          {stats.comunas.toLocaleString('es-CL')}
        </span>{' '}
        comunas.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground" role="status">
      <span className="font-medium text-foreground">Censo fundacional abierto.</span>
      {' '}Aún casi no hay registros.
    </p>
  );
}
