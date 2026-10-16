'use client';

import { Skeleton, SkeletonKpi } from '@enjambre/ui';

export function ContableDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando contabilidad">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-24 h-3.5" />
              <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
            </div>
            <Skeleton variant="text" className="w-32 h-7" />
            <Skeleton variant="text" className="w-36 h-3" />
          </div>
        ))}
      </div>

      {/* Resumen de actividad / tabla */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-48 h-5" />
          <Skeleton variant="text" className="w-24 h-3.5" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton variant="text" className="w-40 h-4" />
                <Skeleton variant="text" className="w-24 h-3" />
              </div>
              <Skeleton variant="text" className="w-24 h-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
