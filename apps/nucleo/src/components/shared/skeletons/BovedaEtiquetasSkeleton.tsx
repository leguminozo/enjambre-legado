'use client';

import { Skeleton } from '@enjambre/ui';

export function BovedaEtiquetasSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando bóveda de etiquetas">
      {/* Shell Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-3" />
          <Skeleton variant="text" className="w-56 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-40 h-9 rounded-xl" />
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
        <Skeleton variant="rectangular" className="w-40 h-8 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-48 sm:w-56 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        </div>
      </div>

      {/* Grid de Etiquetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton variant="rectangular" className="w-20 h-5 rounded" />
                  <Skeleton variant="text" className="w-16 h-3" />
                </div>
                <Skeleton variant="text" className="w-48 h-5" />
                <Skeleton variant="text" className="w-32 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-16 h-8 rounded-lg" />
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-surface-sunken border border-border/50">
              <div className="flex justify-between">
                <Skeleton variant="text" className="w-24 h-3" />
                <Skeleton variant="text" className="w-36 h-3" />
              </div>
              <div className="flex justify-between">
                <Skeleton variant="text" className="w-20 h-3" />
                <Skeleton variant="text" className="w-28 h-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Skeleton variant="text" className="w-24 h-3" />
              <div className="flex items-center gap-2">
                <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
                <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
