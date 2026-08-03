import { useState, useEffect } from 'react';
import { SCENE_DARK } from '@/lib/colors';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { fetchPronostico, calcularGDD } from '@/lib/meteo';

const FALLBACK_ESPECIES = [
  { id: 'ulmo', nombre: 'Ulmo', gddRequerido: 350, color: 'hsl(var(--primary-foreground))' },
  { id: 'tepu', nombre: 'Tepú', gddRequerido: 200, color: 'hsl(var(--accent))' },
  { id: 'tiaca', nombre: 'Tiaca', gddRequerido: 450, color: 'hsl(var(--primary-foreground))' },
] as const;

interface EspecieGDD {
  id: string;
  nombre: string;
  gddRequerido: number | null;
  gddActual: number;
  diasEstimados: number | null;
  enFloracion: boolean;
  color: string;
}

export function OraculoFloracion() {
  const apiFetch = useApiFetch();
  const [datos, setDatos] = useState<EspecieGDD[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function cargarDesdeBFF() {
      try {
        const res = await apiFetch('/api/fenologia/pronostico');
        if (!res.ok) return false;
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
          setLoading(false);
        }
        return true;
      } catch {
        return false;
      }
    }

    async function fallbackLocal() {
      const meteo = await fetchPronostico();
      if (cancelled) return;
      if (!meteo?.temperature_2m?.length) {
        setDatos(FALLBACK_ESPECIES.map((e) => ({ ...e, gddActual: 0, diasEstimados: null, enFloracion: false })));
        setLoading(false);
        return;
      }
      const dailyTemps: number[] = [];
      for (let d = 0; d < Math.min(14, Math.floor(meteo.temperature_2m.length / 24)); d++) {
        const slice = meteo.temperature_2m.slice(d * 24, (d + 1) * 24);
        const avg = slice.reduce((s, t) => s + t, 0) / slice.length;
        dailyTemps.push(avg);
      }
      const gddBase = calcularGDD(dailyTemps);
      setDatos(FALLBACK_ESPECIES.map((e) => ({
        ...e,
        gddActual: Math.round(gddBase * (e.id === 'tepu' ? 1.1 : e.id === 'tiaca' ? 0.7 : 1)),
        diasEstimados: null,
        enFloracion: false,
      })));
      setLoading(false);
    }

    void cargarDesdeBFF().then((ok) => {
      if (!ok && !cancelled) void fallbackLocal();
    });

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
        Grados-Día acumulados · calibración GBIF · iNaturalist · ERA5
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Calculando fenología...</p>
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
        </div>
      )}
    </div>
  );
}
