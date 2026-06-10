import { Moon, Droplets, Flower2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Fase lunar simulada. En el futuro integrar SunCalc.js
const fasesLunares = [
  { nombre: 'Luna Nueva', icon: <Moon size={16} fill="transparent" /> },
  { nombre: 'Cuarto Creciente', icon: <Moon size={16} fill="hsl(var(--foreground) / 0.5)" /> },
  { nombre: 'Luna Llena', icon: <Moon size={16} fill="currentColor" /> },
  { nombre: 'Cuarto Menguante', icon: <Moon size={16} fill="hsl(var(--foreground) / 0.2)" /> },
];

export function HeaderEcosistema() {
  const [faseActual, setFaseActual] = useState(fasesLunares[1]); // Simulando cuarto creciente
  const [marea, setMarea] = useState('Subiendo - Alta a las 14:30');
  const [floracion, setFloracion] = useState({ especie: 'Tepú', porcentaje: 45 });

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-md)',
      padding: 'var(--space-md) var(--space-xl)',
      background: 'var(--surface-app)',
      borderBottom: '1px solid hsl(var(--foreground) / 0.05)',
      color: 'hsl(var(--muted-foreground))',
      fontSize: '0.8rem',
      fontFamily: 'var(--font-datos)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
        
        {/* Fase Lunar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--accent))' }}>
          {faseActual.icon}
          <span>{faseActual.nombre}</span>
        </div>

        {/* Marea */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--muted-foreground))' }}>
          <Droplets size={16} />
          <span>Marea: {marea}</span>
        </div>

      </div>

      {/* Floración */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flower2 size={16} style={{ color: 'hsl(var(--success))' }} />
        <span>Floración Actual: <strong style={{ color: 'hsl(var(--foreground))' }}>{floracion.especie} ({floracion.porcentaje}%)</strong></span>
      </div>
    </div>
  );
}
