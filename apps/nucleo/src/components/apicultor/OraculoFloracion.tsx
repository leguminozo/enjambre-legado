import { useState, useEffect } from 'react';
import { SCENE_DARK } from '@/lib/colors';
import { fetchPronostico, calcularGDD } from '@/lib/meteo';

const ESPECIES = [
  { id: 'ulmo', nombre: 'Ulmo', gddRequerido: 350, color: 'hsl(var(--primary-foreground))' },
  { id: 'tepu', nombre: 'Tepú', gddRequerido: 200, color: 'hsl(var(--accent))' },
  { id: 'tiaca', nombre: 'Tiaca', gddRequerido: 450, color: 'hsl(var(--primary-foreground))' },
] as const;

interface EspecieGDD {
  id: string;
  nombre: string;
  gddRequerido: number;
  gddActual: number;
  color: string;
}

export function OraculoFloracion() {
  const [datos, setDatos] = useState<EspecieGDD[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPronostico().then((meteo) => {
      if (!meteo?.temperature_2m?.length) {
        setDatos(ESPECIES.map((e) => ({ ...e, gddActual: 0 })));
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
      setDatos(ESPECIES.map((e) => ({
        ...e,
        gddActual: Math.round(gddBase * (e.id === 'tepu' ? 1.1 : e.id === 'tiaca' ? 0.7 : 1)),
      })));
      setLoading(false);
    });
  }, []);

  return (
    <div className="card card-accent animate-in delay-2" style={{ background: SCENE_DARK, border: '1px solid hsl(var(--accent) / 0.2)' }}>
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'hsl(var(--accent))' }}>
        Oráculo Fenológico (GDD)
      </div>
      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-lg)' }}>
        Grados-Día acumulados · pronóstico Open-Meteo Pureo
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Calculando fenología...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {datos.map((esp) => {
            const progreso = Math.min((esp.gddActual / esp.gddRequerido) * 100, 100);
            const enFlor = progreso >= 100;
            return (
              <div key={esp.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', color: enFlor ? esp.color : 'hsl(var(--muted-foreground))' }}>
                    {esp.nombre} {enFlor && '✨'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-datos)' }}>
                    {esp.gddActual} / {esp.gddRequerido} GDD
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
                    : `Aprox. ${Math.max(1, Math.ceil((esp.gddRequerido - esp.gddActual) / 12))} días hasta floración.`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}