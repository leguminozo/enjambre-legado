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
        Los primeros apicultores fundadores se están inscribiendo. Datos protegidos: tu ubicación exacta nunca es pública.
      </p>
    );
  }

  // Si al inicio hay pocos actores, mostrar colmenas (número más grande) —
  // regla del plan de lanzamiento.
  const mostrarColmenas = stats.actores_activos < 20;
  const numero = mostrarColmenas ? stats.colmenas_registradas : stats.actores_activos;
  const rotulo = mostrarColmenas ? 'colmenas registradas' : 'apicultores inscritos';

  return (
    <p className="text-sm text-muted-foreground z-10">
      <span className="font-semibold text-foreground">
        {numero.toLocaleString('es-CL')} {rotulo}
      </span>
      {' · '}
      <span className="font-semibold text-foreground">{stats.comunas.toLocaleString('es-CL')}</span> comunas
      {' · '}Datos protegidos: tu ubicación exacta nunca es pública
    </p>
  );
}
