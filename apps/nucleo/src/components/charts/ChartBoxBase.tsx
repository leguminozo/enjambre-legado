'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';

type ChartBoxProps = {
  height: number;
  width?: number | string;
  className?: string;
  children: ReactElement;
};

/**
 * Evita el warning de Recharts (width/height -1) cuando el contenedor aún no
 * tiene tamaño (flex sin layout, tabs ocultos). El chart solo se monta cuando
 * el contenedor mide ancho y alto > 0, y initialDimension evita el -1 inicial
 * (recharts 3 arranca con {-1,-1} y emite el warning en el primer render).
 */
export function ChartBox({ height, width, className = '', children }: ChartBoxProps) {
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
      className={cn(width == null && 'w-full', 'min-w-0 shrink-0', className)}
      style={{
        height,
        minHeight: height,
        ...(width != null ? { width, minWidth: width, maxWidth: width } : {}),
      }}
    >
      {measurable ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
          initialDimension={{
            width: typeof width === 'number' ? width : 1,
            height,
          }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
