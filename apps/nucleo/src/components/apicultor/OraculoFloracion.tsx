import { useState, useEffect } from 'react';
import { SCENE_DARK } from '@/lib/colors';

// Estructura simulada de GDD. Luego vendrá de API Meteo.
const especiesNativas = [
  { id: 'ulmo', nombre: 'Ulmo', gddRequerido: 350, gddActual: 310, color: 'hsl(var(--primary-foreground))' },
  { id: 'tepu', nombre: 'Tepú', gddRequerido: 200, gddActual: 205, color: 'hsl(var(--accent))' },
  { id: 'tiaca', nombre: 'Tiaca', gddRequerido: 450, gddActual: 120, color: 'hsl(var(--primary-foreground))' }
];

export function OraculoFloracion() {
  const [datos, setDatos] = useState(especiesNativas);

  return (
    <div className="card card-accent animate-in delay-2" style={{ background: SCENE_DARK, border: '1px solid hsl(var(--accent) / 0.2)' }}>
      <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'hsl(var(--accent))' }}>
        Oráculo Fenológico (GDD)
      </div>
      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-lg)' }}>
        Grados-Día de Crecimiento acumulados. Modelo térmico de flora nativa.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {datos.map(esp => {
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
              
              {/* Barra de Progreso Minimalista */}
              <div style={{ height: 4, width: '100%', background: 'hsl(var(--foreground) / 0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progreso}%`, 
                  background: enFlor ? esp.color : 'hsl(var(--accent))',
                  opacity: enFlor ? 1 : 0.6,
                  transition: 'width 1s ease-in-out'
                }} />
              </div>
              
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: enFlor ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>
                {enFlor ? 'Floración Activa. Néctar disponible.' : `Probabilidad de flor en aprox. ${Math.ceil((esp.gddRequerido - esp.gddActual)/12)} días.`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
