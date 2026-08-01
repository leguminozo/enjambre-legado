'use client';
import dynamic from 'next/dynamic';
import type { ReactElement } from 'react';

const ChartBoxBase = dynamic(
  () => import('./ChartBoxBase').then((mod) => mod.ChartBox),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[200px] flex items-center justify-center animate-pulse bg-muted/20 rounded-md">
        <div className="text-xs text-muted-foreground font-datos">Cargando gráfico...</div>
      </div>
    )
  }
);

type ChartBoxProps = {
  height: number;
  className?: string;
  children: ReactElement;
};

export function ChartBox(props: ChartBoxProps) {
  return <ChartBoxBase {...props} />;
}
