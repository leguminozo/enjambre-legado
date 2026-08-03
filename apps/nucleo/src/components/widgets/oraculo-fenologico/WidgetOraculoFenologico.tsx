import { useState, useEffect } from 'react';
import { SCENE_DARK } from '@/lib/colors';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface EspecieGDD {
  id: string;
  nombre: string;
  gddRequerido: number | null;
  gddActual: number;
  diasEstimados: number | null;
  enFloracion: boolean;
  color: string;
}

/**
 * Widget del Oráculo Fenológico (GDD): consume el BFF `/api/fenologia/pronostico`
 * con la estación activa por defecto. Sin datos locales: si el BFF falla o no hay
 * especies activas, enlaza a la herramienta completa `/fenologia`.
 */
export function WidgetOraculoFenologico() {
  const apiFetch = useApiFetch();
  const [datos, setDatos] = useState<EspecieGDD[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [estacion, setEstacion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const res = await apiFetch('/api/fenologia/pronostico');
        if (!res.ok) {
          if (!cancelled) setCargando(false);
          return;
        }
        const j = await res.json();
        const data: EspecieGDD[] = (j.data ?? []).map((e: Record<string, unknown>) => ({
          id: String(e.id),
          nombre: String(e.nombreComun ?? ''),
          gddRequerido: typeof e.gddUmbral === 'number' ? e.gddUmbral : null,
          gddActual: Number(e.gddActual ?? 0),
          diasEstimados: typeof e.diasEstimados === 'number' ? (e.diasEstimados as number) : null,
          enFloracion: Boolean(e.enFloracion),
          color: 'hsl(var(--accent))',
        }));
        if (!cancelled) {
          setDatos(data);
          setEstacion(j.meta?.estacion?.nombre ?? null);
          setCargando(false);
        }
      } catch {
        if (!cancelled) setCargando(false);
      }
    }

    void cargar();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  return (
    <div className="card card-accent animate-in delay-2" style={{ background: SCENE_DARK, border: '1px solid hsl(var(--accent) / 0.2)' }}>
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'hsl(var(--accent))' }}>
        Oráculo Fenológico (GDD)
      </div>
      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-lg)' }}>
        Grados-Día acumulados · calibración GBIF · iNaturalist · ERA5{estacion ? ` · ${estacion}` : ''}
      </p>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Calculando fenología...</p>
      ) : !datos || datos.length === 0 ? (
        <div className="text-sm text-muted-foreground space-y-3">
          <p>El oráculo aún no tiene especies activas (o el pronóstico no está disponible).</p>
          <a
            href="/fenologia"
            className="inline-block px-3 py-1.5 text-xs rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            Abrir Oráculo Fenológico →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {datos.map((esp) => {
            const progreso =
              esp.gddRequerido != null && esp.gddRequerido > 0
                ? Math.min((esp.gddActual / esp.gddRequerido) * 100, 100)
                : 0;
            const enFlor = esp.enFloracion || (esp.gddRequerido != null && progreso >= 100);
            return (
              <div key={esp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', color: enFlor ? esp.color : 'hsl(var(--muted-foreground))' }}>
                    {esp.nombre} {enFlor && '✨'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-datos)' }}>
                    {esp.gddRequerido != null ? `${esp.gddActual} / ${esp.gddRequerido} GDD` : `${esp.gddActual} GDD`}
                  </span>
                </div>
                <div style={{ height: 4, width: '100%', background: 'hsl(var(--foreground) / 0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progreso}%`,
                    background: enFlor ? esp.color : 'hsl(var(--accent))',
                    opacity: enFlor ? 1 : 0.6,
                    transition: 'width 1s ease-in-out',
                  }} />
                </div>
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: enFlor ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                  {enFlor
                    ? 'Floración activa. Néctar disponible.'
                    : esp.gddRequerido != null && esp.diasEstimados != null
                      ? `Floración estimada en ~${Math.max(1, esp.diasEstimados)} días.`
                      : esp.gddRequerido != null
                        ? 'Aún lejos del umbral calibrado.'
                        : 'Umbral en calibración.'}
                </div>
              </div>
            );
          })}
          <a
            href="/fenologia"
            className="text-xs text-accent hover:opacity-80 transition-opacity"
          >
            Ver herramienta completa →
          </a>
        </div>
      )}
    </div>
  );
}
