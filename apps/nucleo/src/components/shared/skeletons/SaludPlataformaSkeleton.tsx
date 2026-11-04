'use client';

import { Skeleton, SkeletonCard, SkeletonKpi } from '@enjambre/ui';

export function SaludPlataformaSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando salud de la plataforma">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-56 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-28 h-9 rounded-xl" />
        </div>
      </div>

      {/* Grid de KPIs de infraestructura */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
        <SkeletonKpi />
      </div>

      {/* Secciones de Salud del Sistema y Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-36 h-5" />
            <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-44 h-5" />
            <Skeleton variant="rectangular" className="w-24 h-6 rounded-full" />
          </div>
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
