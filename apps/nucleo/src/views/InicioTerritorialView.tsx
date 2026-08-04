'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sprout, MapPin, Hexagon, BellRing, ScanLine } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { WidgetRail } from '@/components/widgets/WidgetRail';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ResumenTerritorial {
  actor: {
    id: string;
    rol: string;
    nombre_actor: string;
    comuna: string;
    region: string | null;
    nivel_acreditacion: string;
    completo: boolean;
  } | null;
  apiarios: number;
  colmenas: number;
  alertasActivas: number;
  observaciones: number;
}

const NIVEL_LABEL: Record<string, string> = {
  base: 'Base',
  trazable: 'Trazable',
  comprometido: 'Comprometido',
  referente: 'Referente',
};

/**
 * Inicio del rol territorial: bienvenida + métricas personales del apicultor
 * residente (apiarios registrados, colmenas declaradas, alertas en su zona,
 * observaciones fenológicas) + widgets de sus herramientas.
 */
export function InicioTerritorialView() {
  const apiFetch = useApiFetch();
  const [resumen, setResumen] = useState<ResumenTerritorial | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const res = await apiFetch('/api/registro-territorial/resumen');
      if (res.ok) {
        const j = await res.json();
        setResumen(j.data ?? null);
      }
    } catch {
      /* el inicio se muestra sin métricas si el resumen falla */
    } finally {
      setCargando(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const stats = [
    { icon: <Hexagon size={20} />, val: resumen?.colmenas ?? 0, label: 'Colmenas declaradas' },
    { icon: <MapPin size={20} />, val: resumen?.apiarios ?? 0, label: 'Apiarios registrados' },
    { icon: <BellRing size={20} />, val: resumen?.alertasActivas ?? 0, label: 'Alertas en tu zona' },
    { icon: <ScanLine size={20} />, val: resumen?.observaciones ?? 0, label: 'Observaciones fenológicas' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Registro Territorial · Chiloé"
        greeting={resumen?.actor?.nombre_actor ? `¡Hola, ${resumen.actor.nombre_actor}!` : undefined}
        title="Inicio"
        subtitle={
          resumen?.actor
            ? `Tu territorio, tus herramientas — ${resumen.actor.comuna}${resumen.actor.region ? `, ${resumen.actor.region}` : ''}.`
            : 'Bienvenido al Registro Territorial Apícola de Chiloé.'
        }
        icon={<Sprout size={20} />}
      />

      {!cargando && !resumen?.actor && (
        <div className="card p-4 border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Aún no estás en el Registro Territorial</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inscríbete para declarar tus apiarios, recibir alertas fitosanitarias y sumarte al ordenamiento comunal.
            </p>
          </div>
          <a
            href="/territorio"
            className="px-4 py-2 text-xs rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Inscribirme
          </a>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {resumen?.actor && (
        <div className="card p-4 border border-border flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Inscrito/a como {resumen.actor.rol}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent uppercase tracking-wide">
            Nivel {NIVEL_LABEL[resumen.actor.nivel_acreditacion] ?? resumen.actor.nivel_acreditacion}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wide ${
              resumen.actor.completo ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}
          >
            Censo legal {resumen.actor.completo ? 'completo' : 'pendiente'}
          </span>
        </div>
      )}

      <WidgetRail contexto="inicio-territorial" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a href="/territorio" className="card p-4 border border-border hover:border-accent/40 transition-colors">
          <div className="section-title text-sm text-foreground">Mi Territorio</div>
          <p className="text-xs text-muted-foreground mt-1">Inscripción, mapa comunitario, alertas y trashumancia.</p>
        </a>
        <a href="/registro-territorial" className="card p-4 border border-border hover:border-accent/40 transition-colors">
          <div className="section-title text-sm text-foreground">Registro Comunitario</div>
          <p className="text-xs text-muted-foreground mt-1">La red de Chiloé: actores, predios y alertas de la zona.</p>
        </a>
        <a href="/fenologia" className="card p-4 border border-border hover:border-accent/40 transition-colors">
          <div className="section-title text-sm text-foreground">Oráculo Fenológico</div>
          <p className="text-xs text-muted-foreground mt-1">GDD por especie y estación para anticipar la floración.</p>
        </a>
      </div>
    </div>
  );
}
