'use client';

import { Skeleton, SkeletonKpi } from '@enjambre/ui';

export function DashboardEjecutivoSkeleton() {
  return (
    <div className="relative animate-in space-y-4" aria-busy="true" aria-label="Cargando visión ejecutiva">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-72 h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
      </div>

      {/* Range Tab Bar skeleton */}
      <div className="flex gap-2 p-1 rounded-xl bg-surface-sunken w-fit border border-border">
        <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
        <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
        <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
      </div>

      {/* Sección Apícola */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
            <Skeleton variant="text" className="w-24 h-4" />
          </div>
          <Skeleton variant="text" className="w-16 h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-surface-sunken border border-border/50 space-y-2">
              <Skeleton variant="text" className="w-16 h-2.5" />
              <Skeleton variant="text" className="w-20 h-5" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-6 pt-2">
          <Skeleton variant="circular" className="w-20 h-20 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-32 h-3" />
            <Skeleton variant="text" className="w-28 h-3" />
            <Skeleton variant="text" className="w-36 h-3" />
          </div>
        </div>
      </div>

      {/* Sección Ventas */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
            <Skeleton variant="text" className="w-24 h-4" />
          </div>
          <Skeleton variant="text" className="w-16 h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-surface-sunken border border-border/50 space-y-2">
              <Skeleton variant="text" className="w-16 h-2.5" />
              <Skeleton variant="text" className="w-20 h-5" />
            </div>
          ))}
        </div>

        <Skeleton variant="rectangular" className="w-full h-44 rounded-xl" />
      </div>

      {/* Sección Finanzas */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
            <Skeleton variant="text" className="w-24 h-4" />
          </div>
          <Skeleton variant="text" className="w-16 h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-surface-sunken border border-border/50 space-y-2">
              <Skeleton variant="text" className="w-16 h-2.5" />
              <Skeleton variant="text" className="w-20 h-5" />
            </div>
          ))}
        </div>

        <Skeleton variant="rectangular" className="w-full h-40 rounded-xl" />
      </div>
    </div>
  );
}
