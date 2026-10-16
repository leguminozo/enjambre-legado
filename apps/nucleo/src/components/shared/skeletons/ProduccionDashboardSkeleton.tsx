'use client';

import { Skeleton } from '@enjambre/ui';

export function ProduccionDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando producción">
      {/* 2 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-32 h-3" />
            <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
          </div>
          <Skeleton variant="text" className="w-24 h-7" />
          <Skeleton variant="text" className="w-36 h-3" />
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-36 h-3" />
            <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
          </div>
          <Skeleton variant="text" className="w-16 h-7" />
          <Skeleton variant="text" className="w-40 h-3" />
        </div>
      </div>

      {/* Card de Lotes */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border space-y-2">
          <Skeleton variant="text" className="w-44 h-5" />
          <Skeleton variant="text" className="w-96 max-w-full h-3.5" />
        </div>

        {/* Encabezado */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-sunken border-b border-border text-xs">
          <div className="col-span-3"><Skeleton variant="text" className="w-16 h-3.5" /></div>
          <div className="col-span-2"><Skeleton variant="text" className="w-20 h-3.5" /></div>
          <div className="col-span-2 text-center"><Skeleton variant="text" className="w-16 h-3.5 mx-auto" /></div>
          <div className="col-span-2"><Skeleton variant="text" className="w-16 h-3.5" /></div>
          <div className="col-span-3 text-right"><Skeleton variant="text" className="w-20 h-3.5 ml-auto" /></div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 md:px-6 items-center">
              <div className="col-span-1 md:col-span-3 space-y-1">
                <Skeleton variant="text" className="w-28 h-4" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Skeleton variant="text" className="w-24 h-4" />
              </div>
              <div className="col-span-1 md:col-span-2 flex justify-center">
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
              </div>
              <div className="col-span-1 md:col-span-3 flex items-center justify-start md:justify-end gap-2">
                <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
                <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
