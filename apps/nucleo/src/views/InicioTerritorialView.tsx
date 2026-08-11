'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sprout, MapPin, Hexagon, BellRing, ScanLine } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useAuthStore } from '@enjambre/auth';
import {
  getTerritorialHomeCopy,
  getTerritorialHomeTools,
  resolveTerritorialMenuFamily,
  TERRITORIAL_ROL_LABELS,
  type TerritorialRol,
} from '@/lib/territorial-rol';

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
 * Inicio del rol territorial — home por familia de sub-rol (PR5 oleada 2a).
 * - api_* : registro propio, planes, fenología
 * - institucion_publica : censo comunal, mapa, fenología
 * - mínimo / 2b : CTA de inscripción
 */
export function InicioTerritorialView() {
  const apiFetch = useApiFetch();
  const sessionTerritorialRol = useAuthStore((s) => s.user?.territorial_rol ?? null);
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

  // SoT en UI: actor inscrito > sesión (auth store) > null
  const effectiveRol =
    resumen?.actor?.rol ?? sessionTerritorialRol ?? null;
  const family = resolveTerritorialMenuFamily(effectiveRol);
  const homeCopy = getTerritorialHomeCopy(effectiveRol);
  const tools = useMemo(() => getTerritorialHomeTools(effectiveRol), [effectiveRol]);

  const rolLabel =
    effectiveRol && effectiveRol in TERRITORIAL_ROL_LABELS
      ? TERRITORIAL_ROL_LABELS[effectiveRol as TerritorialRol]
      : effectiveRol;

  const showApiStats = family === 'api' || family === 'minimo';
  const stats =
    family === 'institucion'
      ? [
          {
            icon: <Hexagon size={20} />,
            val: resumen?.colmenas ?? 0,
            label: 'Colmenas en red (agregado)',
          },
          {
            icon: <MapPin size={20} />,
            val: resumen?.apiarios ?? 0,
            label: 'Apiarios en red',
          },
          {
            icon: <BellRing size={20} />,
            val: resumen?.alertasActivas ?? 0,
            label: 'Alertas activas',
          },
          {
            icon: <ScanLine size={20} />,
            val: resumen?.observaciones ?? 0,
            label: 'Observaciones fenológicas',
          },
        ]
      : [
          { icon: <Hexagon size={20} />, val: resumen?.colmenas ?? 0, label: 'Colmenas declaradas' },
          { icon: <MapPin size={20} />, val: resumen?.apiarios ?? 0, label: 'Apiarios registrados' },
          {
            icon: <BellRing size={20} />,
            val: resumen?.alertasActivas ?? 0,
            label: 'Alertas en tu zona',
          },
          {
            icon: <ScanLine size={20} />,
            val: resumen?.observaciones ?? 0,
            label: 'Observaciones fenológicas',
          },
        ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow={homeCopy.eyebrow}
        greeting={
          resumen?.actor?.nombre_actor ? `¡Hola, ${resumen.actor.nombre_actor}!` : undefined
        }
        title="Inicio"
        subtitle={
          resumen?.actor
            ? `Tu territorio, tus herramientas — ${resumen.actor.comuna}${resumen.actor.region ? `, ${resumen.actor.region}` : ''}.`
            : homeCopy.subtitleFallback
        }
        icon={<Sprout size={20} />}
      />

      {!cargando && !resumen?.actor && (
        <div className="card p-4 border border-warning/30 bg-warning/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {family === 'institucion'
                ? 'Aún no hay ficha de institución vinculada'
                : 'Aún no estás en el Registro Territorial'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {family === 'institucion'
                ? 'Completá la inscripción institucional para ver censo y mapa con tu rol.'
                : 'Inscríbete para declarar tus apiarios, recibir alertas fitosanitarias y sumarte al ordenamiento comunal.'}
            </p>
          </div>
          <Link
            href="/territorio"
            className="px-4 py-2 text-xs rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {family === 'institucion' ? 'Abrir territorio' : 'Inscribirme'}
          </Link>
        </div>
      )}

      {(showApiStats || family === 'institucion') && (
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
      )}

      {resumen?.actor && (
        <div className="card p-4 border border-border flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Inscrito/a como {rolLabel ?? resumen.actor.rol}
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
          <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">
            Menú {family === 'api' ? 'red apícola' : family === 'institucion' ? 'institución' : 'mínimo'}
          </span>
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-3 ${tools.length >= 3 ? 'sm:grid-cols-3' : tools.length === 2 ? 'sm:grid-cols-2' : ''}`}
      >
        {tools.map((t) => (
          <Link
            key={`${t.href}-${t.title}`}
            href={t.href}
            className={`card p-4 border transition-colors ${
              t.primary
                ? 'border-accent/40 bg-accent/5 hover:border-accent/60'
                : 'border-border hover:border-accent/40'
            }`}
          >
            <div className="section-title text-sm text-foreground">{t.title}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
