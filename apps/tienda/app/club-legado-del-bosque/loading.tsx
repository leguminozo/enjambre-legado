'use client';

import { Skeleton, SkeletonCard } from '@enjambre/ui';

export default function ClubLegadoLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 pt-[max(4rem,calc(var(--safe-top)+3rem))] pb-20 space-y-12 animate-in"
      aria-busy="true"
      aria-label="Cargando Club Legado del Bosque"
    >
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Skeleton variant="rectangular" className="w-32 h-6 rounded-full mx-auto" />
        <Skeleton variant="text" className="w-80 max-w-full h-10 mx-auto" />
        <Skeleton variant="text" className="w-96 max-w-full h-4 mx-auto" />
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-8 rounded-3xl border border-border bg-card space-y-6">
            <div className="space-y-2">
              <Skeleton variant="text" className="w-28 h-5" />
              <Skeleton variant="text" className="w-36 h-8" />
              <Skeleton variant="text" className="w-full h-3.5" />
            </div>
            <div className="space-y-2 pt-4 border-t border-border/50">
              <Skeleton variant="text" className="w-full h-3" />
              <Skeleton variant="text" className="w-4/5 h-3" />
              <Skeleton variant="text" className="w-3/4 h-3" />
            </div>
            <Skeleton variant="rectangular" className="w-full h-12 rounded-full mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
