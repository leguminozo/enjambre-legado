'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

type ChartBoxProps = {
  height: number;
  className?: string;
  children: ReactElement;
};

/** Evita el warning de Recharts (width/height -1) cuando el contenedor flex aún no tiene tamaño. */
export function ChartBox({ height, className = '', children }: ChartBoxProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={`w-full min-w-0 shrink-0 ${className}`.trim()}
      style={{ height, minHeight: height }}
    >
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}