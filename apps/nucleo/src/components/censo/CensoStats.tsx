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
}

/**
 * Contador en vivo del censo (hero público). Recibe los datos renderizados
 * en servidor (ISR 120 s) y solo revalida al volver al foco, cada 30 min o
 * una vez al montar si el SSR falló — el cache del BFF (s-maxage=120) ya
 * cubre la frescura por segundo.
 */
export function CensoStats({ initialStats }: CensoStatsProps) {
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
          // Conservar los datos actuales si el refresco falla.
        });
    };

    refresh(); // cubre el caso en que el SSR falló y el cliente sí puede
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(refresh, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, []);

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground z-10">
        <span className="font-semibold text-foreground">Hoy partimos desde cero: sé de los primeros en inscribirte.</span>
        {' '}· Datos protegidos: tu ubicación exacta nunca es pública.
      </p>
    );
  }

  // Fase inicial: si hay pocos actores, mostrar colmenas (número más grande);
  // con red formada, apicultores por comuna — regla del plan de lanzamiento.
  const mostrarColmenas = stats.actores_activos < 20;

  return (
    <p className="text-sm text-muted-foreground z-10">
      {mostrarColmenas ? (
        <>
          <span className="font-semibold text-foreground">
            {stats.colmenas_registradas.toLocaleString('es-CL')} colmenas registradas
          </span>
          {' · '}
          <span className="font-semibold text-foreground">{stats.comunas.toLocaleString('es-CL')}</span> comunas
        </>
      ) : (
        <>
          <span className="font-semibold text-foreground">
            {stats.actores_activos.toLocaleString('es-CL')} apicultores
          </span>
          {' '}ya están en el mapa, en{' '}
          <span className="font-semibold text-foreground">{stats.comunas.toLocaleString('es-CL')}</span> comunas
        </>
      )}
      {' · '}Datos protegidos: tu ubicación exacta nunca es pública
    </p>
  );
}
