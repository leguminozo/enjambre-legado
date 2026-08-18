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
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-6 bg-surface-sunken/60 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider font-datos">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-accent">
          {faseIcon}
          <span>{faseNombre}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Droplets size={16} />
          <span>Pureo · Chiloé</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Flower2 size={16} className="text-success" />
        <span>
          Floración activa:{' '}
          <strong className="text-foreground font-semibold">
            {floracion ? `${floracion.especie} (${floracion.count} colmenas)` : 'Sin datos'}
          </strong>
        </span>
      </div>
    </div>
  );
}