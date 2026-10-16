'use client';

import { Skeleton } from '@enjambre/ui';

export function CrmOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2" aria-busy="true" aria-label="Cargando CRM">
      {/* Rendimiento Reps */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <Skeleton variant="text" className="w-36 h-5" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-sunken border border-border/50">
              <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="w-32 h-4" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="text" className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Distribución / Gráficos */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="rectangular" className="w-full h-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
}
