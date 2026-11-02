'use client';

import { Skeleton, SkeletonCard } from '@enjambre/ui';

export function CuadernoCampoSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando cuaderno de campo">
      {/* Shell header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-28 h-3" />
          <Skeleton variant="text" className="w-56 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-28 h-9 rounded-xl" />
          <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton variant="rectangular" className="w-48 sm:w-56 h-10 rounded-lg" />
        <Skeleton variant="rectangular" className="w-48 sm:w-64 h-10 rounded-lg" />
        <Skeleton variant="rectangular" className="flex-1 min-w-[14rem] h-10 rounded-lg" />
      </div>

      {/* Grid de tarjetas de hojas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={4} />
        ))}
      </div>
    </div>
  );
}

export function EscenaHojaSkeleton() {
  return (
    <div className="space-y-4 animate-in" aria-busy="true" aria-label="Cargando hoja de visita">
      <div className="flex items-center justify-between gap-3 text-xs border-b border-border/50 pb-2.5">
        <Skeleton variant="text" className="w-32 h-4" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-20 h-6 rounded-md" />
          <Skeleton variant="rectangular" className="w-20 h-6 rounded-md" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-64 h-6" />
          <Skeleton variant="text" className="w-48 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-full" />
          <Skeleton variant="rectangular" className="w-24 h-8 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[420px] rounded-2xl border border-border bg-card p-4">
          <Skeleton variant="rectangular" className="w-full h-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="rectangular" className="w-full h-24 rounded-xl" />
          <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
