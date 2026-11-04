'use client';

import { Skeleton } from '@enjambre/ui';

export function QRsProductosSkeleton() {
  return (
    <div className="space-y-6 animate-in pb-12" aria-busy="true" aria-label="Cargando QRs de productos">
      {/* Shell Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-3" />
          <Skeleton variant="text" className="w-52 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-36 h-9 rounded-xl" />
      </div>

      {/* Toolbar / Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-44 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" className="w-48 sm:w-56 h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-36 h-8 rounded-lg" />
        </div>
      </div>

      {/* Banner QR Maestro Trípode */}
      <div className="p-5 rounded-2xl border border-border bg-card/60 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <Skeleton variant="rectangular" className="w-32 h-32 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-48 h-4 rounded-full" />
            <Skeleton variant="text" className="w-64 max-w-full h-6" />
            <Skeleton variant="text" className="w-full max-w-lg h-3.5" />
            <Skeleton variant="text" className="w-4/5 max-w-md h-3.5" />
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-52 shrink-0">
          <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
          <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
        </div>
      </div>

      {/* Grid de Tarjetas QR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <Skeleton variant="text" className="w-24 h-3" />
                <Skeleton variant="text" className="w-44 h-4" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-16 h-5 rounded" />
            </div>
            <div className="flex items-center justify-center p-3.5 bg-card/80 rounded-xl border border-border/40 w-36 h-36 mx-auto">
              <Skeleton variant="rectangular" className="w-28 h-28 rounded-lg" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex justify-between">
                <Skeleton variant="text" className="w-28 h-3" />
                <Skeleton variant="text" className="w-16 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-full h-8 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
                <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
