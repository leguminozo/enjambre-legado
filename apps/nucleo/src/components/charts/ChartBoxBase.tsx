'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

type ChartBoxProps = {
  height: number;
  className?: string;
  children: ReactElement;
};

/**
 * Evita el warning de Recharts (width/height -1) cuando el contenedor aún no
 * tiene tamaño (flex sin layout, tabs ocultos). El chart solo se monta cuando
 * el contenedor mide ancho y alto > 0, y initialDimension evita el -1 inicial
 * (recharts 3 arranca con {-1,-1} y emite el warning en el primer render).
 */
export function ChartBox({ height, className = '', children }: ChartBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [measurable, setMeasurable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setMeasurable(rect.width > 0 && rect.height > 0);
    };

    measure();
    // Tabs/collapse: al volverse visible, el ResizeObserver remonta el chart.
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    return () => {
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 shrink-0 ${className}`.trim()}
      style={{ height, minHeight: height }}
    >
      {measurable ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
          initialDimension={{ width: 1, height: 1 }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
