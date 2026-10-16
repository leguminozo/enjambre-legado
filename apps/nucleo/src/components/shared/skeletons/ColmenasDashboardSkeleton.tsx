'use client';

import { Skeleton } from '@enjambre/ui';

export function ColmenasDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando colmenas">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-44 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-36 h-10 rounded-xl" />
      </div>

      {/* Meta bar con métricas rápidas */}
      <div className="flex flex-wrap items-center gap-4 px-1 py-2 text-xs border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-3.5 h-3.5 rounded" />
          <Skeleton variant="text" className="w-20 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-3.5 h-3.5 rounded" />
          <Skeleton variant="text" className="w-24 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-3.5 h-3.5 rounded" />
          <Skeleton variant="text" className="w-24 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-3.5 h-3.5 rounded" />
          <Skeleton variant="text" className="w-28 h-3.5" />
        </div>
      </div>

      {/* Grid de apiarios / colmenas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-28 h-4" />
                  <Skeleton variant="text" className="w-20 h-3" />
                </div>
              </div>
              <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
              <div className="p-2.5 rounded-lg bg-surface-sunken space-y-1">
                <Skeleton variant="text" className="w-12 h-2.5" />
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
              <div className="p-2.5 rounded-lg bg-surface-sunken space-y-1">
                <Skeleton variant="text" className="w-14 h-2.5" />
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
