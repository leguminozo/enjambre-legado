import { useState, useEffect } from 'react';

// Simularemos 24 horas de predicción
// HR < 85, precip < 0.2, viento < 25 -> Volable
const generarPronosticoDummy = () => {
  return Array.from({ length: 24 }).map((_, i) => {
    const hora = (new Date().getHours() + i) % 24;
    // Lógica dummy: de 11 a 16 es volable, resto llueve o mucha HR
    const esVolable = hora >= 11 && hora <= 16;
    return {
      hora,
      esVolable,
      temp: esVolable ? 18 : 12,
      hr: esVolable ? 60 : 92,
    };
  });
};

export default function VentanasDeVuelo() {
  const [pronostico, setPronostico] = useState(generarPronosticoDummy());

  const radius = 80;
  const cx = 100;
  const cy = 100;

  return (
    <div className="card animate-in delay-3" style={{ background: '#1a1614', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="section-title" style={{ width: '100%', fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'var(--crema-natural)' }}>
        Ventanas de Vuelo
      </div>
      <p style={{ width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
        Reloj de pecoreo 24h. Basado en Temperatura, Precipitación y Humedad.
      </p>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Circulo Base */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="15" />
          
          {/* Segmentos del pronóstico */}
          {pronostico.map((p, i) => {
            const angleStep = 360 / 24;
            const startAngle = (i * angleStep) - 90; // Empezar en top (hora actual)
            const endAngle = ((i + 1) * angleStep) - 90;
            
            // Math for SVG arc
            const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
            const x2 = cx + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = cy + radius * Math.sin(endAngle * Math.PI / 180);
            
            const largeArcFlag = angleStep > 180 ? 1 : 0;
            const pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
            ].join(' ');

            return (
              <path 
                key={i}
                d={pathData}
                fill="none"
                stroke={p.esVolable ? 'var(--oro-miel)' : 'rgba(255,255,255,0.02)'}
                strokeWidth={p.esVolable ? '16' : '14'}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>

        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'var(--text-primary)', fontFamily: 'var(--font-existencial)'
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>14°C</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-datos)', textTransform: 'uppercase' }}>Ahora</div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--oro-miel)' }}>
        Próximo claro: {pronostico.find(p => p.esVolable)?.hora}:00 hrs
      </div>
    </div>
  );
}
