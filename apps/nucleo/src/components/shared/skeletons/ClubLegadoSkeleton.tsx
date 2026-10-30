'use client';

import { Skeleton } from '@enjambre/ui';

export function ClubLegadoSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando Club Legado">
      {/* Shell header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-36 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
      </div>

      {/* Tabs selector */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-3">
        <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
        <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
        <Skeleton variant="rectangular" className="w-40 h-9 rounded-xl" />
        <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
      </div>

      {/* Main card body */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-5 h-5" />
          <Skeleton variant="text" className="w-48 h-5" />
        </div>
        <Skeleton variant="text" className="w-full max-w-md h-3.5" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border/30 last:border-b-0 gap-2"
            >
              <div className="space-y-1">
                <Skeleton variant="text" className="w-48 sm:w-64 h-4" />
                <Skeleton variant="text" className="w-32 sm:w-40 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-full sm:w-32 h-10 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
