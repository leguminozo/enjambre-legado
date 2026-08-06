'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@enjambre/ui';
import { ChartBox } from '@/components/charts/ChartBox';
import { ORO_MIEL, TEXT_MUTED } from '@/lib/colors';
import type { HidromielMedicion } from '@/components/hidromiel/types';

function etiquetaFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/**
 * Curva de cualquier medición numérica registrada: el usuario elige el tipo
 * (densidad, temperatura, pH, presión, ...). Sin tipos numéricos, no hay curva.
 */
export function CurvaMediciones({ mediciones }: { mediciones: HidromielMedicion[] }) {
  const tipos = useMemo(() => {
    const porTipo = new Map<string, number>();
    for (const m of mediciones) {
      if (m.valor === null || m.valor === undefined) continue;
      const key = m.tipo.trim().toLowerCase();
      porTipo.set(key, (porTipo.get(key) ?? 0) + 1);
    }
    return Array.from(porTipo.keys());
  }, [mediciones]);

  const [tipo, setTipo] = useState<string | null>(null);
  const tipoActivo = tipo ?? tipos[0] ?? null;

  const datos = useMemo(() => {
    if (!tipoActivo) return [];
    return mediciones
      .filter((m) => m.tipo.trim().toLowerCase() === tipoActivo && m.valor !== null && m.valor !== undefined)
      .map((m) => ({ fecha: etiquetaFecha(m.fecha), valor: m.valor as number, unidad: m.unidad ?? '' }));
  }, [mediciones, tipoActivo]);

  if (tipos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-sunken">
        <EmptyState
          icon={<span className="text-2xl">📈</span>}
          title="Sin curva todavía"
          description="Registra mediciones con valor numérico (densidad, temperatura, pH…) y la curva aparece aquí."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {tipos.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors border ${
              tipoActivo === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-surface-raised text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ChartBox height={220}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              fontFamily: 'Inter',
              fontSize: '0.8rem',
              background: 'hsl(var(--card) / 0.95)',
              border: '1px solid hsl(var(--border))',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={ORO_MIEL}
            strokeWidth={2}
            dot={{ fill: ORO_MIEL, r: 4 }}
            name={tipoActivo.charAt(0).toUpperCase() + tipoActivo.slice(1)}
          />
        </LineChart>
      </ChartBox>
    </div>
  );
}
