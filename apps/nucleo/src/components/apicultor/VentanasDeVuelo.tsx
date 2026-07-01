import { useState, useEffect } from 'react';
import { SCENE_DARK } from '@/lib/colors';
import { fetchPronostico, esVolable } from '@/lib/meteo';

interface HoraPronostico {
  hora: number;
  esVolable: boolean;
  temp: number;
  hr: number;
}

export function VentanasDeVuelo() {
  const [pronostico, setPronostico] = useState<HoraPronostico[]>([]);
  const [tempAhora, setTempAhora] = useState<number | null>(null);

  useEffect(() => {
    fetchPronostico().then((data) => {
      if (!data?.temperature_2m?.length) return;
      const startHour = new Date().getHours();
      const hours: HoraPronostico[] = Array.from({ length: 24 }, (_, i) => {
        const idx = i;
        const temp = data.temperature_2m[idx] ?? data.temperature_2m[0];
        const hr = data.relative_humidity_2m[idx] ?? 70;
        const precip = data.precipitation[idx] ?? 0;
        return {
          hora: (startHour + i) % 24,
          esVolable: esVolable(temp, hr, precip),
          temp: Math.round(temp),
          hr: Math.round(hr),
        };
      });
      setPronostico(hours);
      setTempAhora(Math.round(data.temperature_2m[startHour] ?? data.temperature_2m[0]));
    });
  }, []);

  const radius = 80;
  const cx = 100;
  const cy = 100;
  const proximaVolable = pronostico.find((p) => p.esVolable);

  return (
    <div className="card animate-in delay-3" style={{ background: SCENE_DARK, border: '1px solid hsl(var(--foreground) / 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="section-title" style={{ width: '100%', fontSize: '1rem', marginBottom: 'var(--space-md)', color: 'hsl(var(--primary-foreground))' }}>
        Ventanas de Vuelo
      </div>
      <p style={{ width: '100%', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-lg)' }}>
        Reloj de pecoreo 24h · Open-Meteo Pureo
      </p>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="hsl(var(--foreground) / 0.05)" strokeWidth="15" />
          {pronostico.map((p, i) => {
            const angleStep = 360 / 24;
            const startAngle = (i * angleStep) - 90;
            const endAngle = ((i + 1) * angleStep) - 90;
            const x1 = cx + radius * Math.cos(startAngle * Math.PI / 180);
            const y1 = cy + radius * Math.sin(startAngle * Math.PI / 180);
            const x2 = cx + radius * Math.cos(endAngle * Math.PI / 180);
            const y2 = cy + radius * Math.sin(endAngle * Math.PI / 180);
            const largeArcFlag = angleStep > 180 ? 1 : 0;
            const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`].join(' ');
            return (
              <path
                key={i}
                d={pathData}
                fill="none"
                stroke={p.esVolable ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.02)'}
                strokeWidth={p.esVolable ? '16' : '14'}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>

        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          textAlign: 'center', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-existencial)',
        }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 600 }}>{tempAhora != null ? `${tempAhora}°C` : '—'}</div>
          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-datos)', textTransform: 'uppercase' }}>Ahora</div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'hsl(var(--accent))' }}>
        {proximaVolable
          ? `Próxima ventana: ${proximaVolable.hora}:00 hrs`
          : 'Sin ventanas volables en las próximas 24h'}
      </div>
    </div>
  );
}