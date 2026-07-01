import { Moon, Droplets, Flower2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMoonPhaseIndex, getMoonPhaseName } from '@/lib/moon-phase';
import { supabase } from '@/lib/supabase';

const MOON_ICONS = [
  <Moon key="nueva" size={16} fill="transparent" />,
  <Moon key="creciente" size={16} fill="hsl(var(--foreground) / 0.5)" />,
  <Moon key="llena" size={16} fill="currentColor" />,
  <Moon key="menguante" size={16} fill="hsl(var(--foreground) / 0.2)" />,
];

export function HeaderEcosistema() {
  const [faseNombre, setFaseNombre] = useState(getMoonPhaseName());
  const [faseIcon, setFaseIcon] = useState(MOON_ICONS[getMoonPhaseIndex()]);
  const [floracion, setFloracion] = useState<{ especie: string; count: number } | null>(null);

  useEffect(() => {
    const idx = getMoonPhaseIndex();
    setFaseNombre(getMoonPhaseName());
    setFaseIcon(MOON_ICONS[idx]);

    supabase
      .from('colmenas')
      .select('floracion')
      .not('floracion', 'is', null)
      .then(({ data }: { data: { floracion: string | null }[] | null }) => {
        const counts = new Map<string, number>();
        (data ?? []).forEach((row) => {
          const raw = String(row.floracion ?? '').trim();
          if (!raw) return;
          const especie = raw.split('+')[0].trim().split(',')[0].trim();
          counts.set(especie, (counts.get(especie) ?? 0) + 1);
        });
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (top) setFloracion({ especie: top[0], count: top[1] });
      });
  }, []);

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
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--accent))' }}>
          {faseIcon}
          <span>{faseNombre}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--muted-foreground))' }}>
          <Droplets size={16} />
          <span>Pureo · Chiloé</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flower2 size={16} style={{ color: 'hsl(var(--success))' }} />
        <span>
          Floración activa:{' '}
          <strong style={{ color: 'hsl(var(--foreground))' }}>
            {floracion ? `${floracion.especie} (${floracion.count} colmenas)` : 'Sin datos'}
          </strong>
        </span>
      </div>
    </div>
  );
}