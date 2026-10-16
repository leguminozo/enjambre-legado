'use client';

import { Skeleton, SkeletonKpi, SkeletonTable } from '@enjambre/ui';

export function ModuloGenericoSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando módulo">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-56 h-7" />
          <Skeleton variant="text" className="w-96 max-w-full h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-28 h-10 rounded-xl" />
        </div>
      </div>

      {/* 4 KPIs de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </div>

      {/* Tarjeta de contenido principal o tabla */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-40 h-5" />
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  );
}
