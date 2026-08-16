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
    if (!stats || (stats.actores_activos === 0 && stats.apiarios_activos === 0)) {
      return (
        <p className="text-sm text-muted-foreground">
          Aún casi no hay registros. Tiene sentido ser de los que empiezan.
        </p>
      );
    }

    const items: { rawValue: number; value: string; label: string }[] = [];
    if (stats.actores_activos > 0) {
      items.push({
        rawValue: stats.actores_activos,
        value: stats.actores_activos.toLocaleString('es-CL'),
        label: stats.actores_activos === 1 ? 'apicultor' : 'apicultores',
      });
    }
    if (stats.comunas > 0) {
      items.push({
        rawValue: stats.comunas,
        value: stats.comunas.toLocaleString('es-CL'),
        label: stats.comunas === 1 ? 'comuna' : 'comunas',
      });
    }
    if (stats.colmenas_registradas > 0) {
      items.push({
        rawValue: stats.colmenas_registradas,
        value: stats.colmenas_registradas.toLocaleString('es-CL'),
        label: 'colmenas',
      });
    }

    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Aún casi no hay registros. Tiene sentido ser de los que empiezan.
        </p>
      );
    }

    return (
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
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

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          Aún casi no hay registros. Tiene sentido ser de los que empiezan.
        </span>
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
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">
        Aún casi no hay registros. Tiene sentido ser de los que empiezan.
      </span>
    </p>
  );
}
