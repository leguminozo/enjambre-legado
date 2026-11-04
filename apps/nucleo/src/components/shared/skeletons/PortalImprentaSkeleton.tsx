'use client';

import { Skeleton } from '@enjambre/ui';

export function PortalImprentaSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando portal de imprenta">
      {/* Shell Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-44 h-9 rounded-xl" />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-4">
        <div className="flex items-center gap-4">
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-48 sm:w-56 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        </div>
      </div>

      {/* Grid of Product Photos / Label Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="w-44 h-5" />
                <Skeleton variant="text" className="w-24 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-16 h-5 rounded" />
            </div>
            <Skeleton variant="rectangular" className="w-full h-48 rounded-xl" />
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Skeleton variant="text" className="w-28 h-3" />
              <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
