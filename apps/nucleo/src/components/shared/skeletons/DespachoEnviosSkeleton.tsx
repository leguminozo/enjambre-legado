'use client';

import { Skeleton } from '@enjambre/ui';

export function DespachoEnviosSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando envíos y despacho">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-32 h-10 rounded-xl" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
            </div>
            <Skeleton variant="text" className="w-16 h-7" />
            <Skeleton variant="text" className="w-28 h-3" />
          </div>
        ))}
      </div>

      {/* Lista de envíos */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton variant="text" className="w-32 h-5" />
            <Skeleton variant="text" className="w-24 h-3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" className="w-9 h-9 rounded-lg" />
            <Skeleton variant="rectangular" className="w-28 h-9 rounded-lg" />
          </div>
        </div>

        {/* Filter chips bar */}
        <div className="flex gap-2 pb-2">
          <Skeleton variant="rectangular" className="w-16 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
        </div>

        {/* Filas de tracking */}
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-sunken border border-border/60">
              <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" className="w-28 h-4 font-mono" />
                  <Skeleton variant="rectangular" className="w-20 h-5 rounded-full" />
                </div>
                <Skeleton variant="text" className="w-48 h-3" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton variant="text" className="w-20 h-4 ml-auto" />
                <Skeleton variant="text" className="w-16 h-3 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
