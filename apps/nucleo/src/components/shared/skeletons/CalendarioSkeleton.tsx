'use client';

import { Skeleton } from '@enjambre/ui';

export function CalendarioSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando calendario">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-28 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-72 max-w-full h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-24 h-9 rounded-xl" />
          <Skeleton variant="rectangular" className="w-32 h-9 rounded-xl" />
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between px-2">
        <Skeleton variant="text" className="w-36 h-6" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-9 h-9 rounded-lg" />
          <Skeleton variant="rectangular" className="w-9 h-9 rounded-lg" />
        </div>
      </div>

      {/* Grid Header (7 days) */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="w-12 h-4 mx-auto" />
        ))}
      </div>

      {/* Grid Days (35 cells) */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" className="w-full h-20 sm:h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
