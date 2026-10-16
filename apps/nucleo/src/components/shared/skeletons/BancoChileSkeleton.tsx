'use client';

import { Skeleton, SkeletonTable } from '@enjambre/ui';

export function BancoChileSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando banco y cartola">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-40 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-10 h-10 rounded-xl" />
      </div>

      {/* Card de Cuenta Bancaria y Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-32 h-4" />
            <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton variant="text" className="w-44 h-8" />
          <Skeleton variant="text" className="w-36 h-3" />
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" className="w-36 h-4" />
            <Skeleton variant="rectangular" className="w-5 h-5 rounded" />
          </div>
          <Skeleton variant="text" className="w-40 h-8" />
          <Skeleton variant="text" className="w-48 h-3" />
        </div>
      </div>

      {/* Cartola de Movimientos Bancarios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <Skeleton variant="text" className="w-48 h-5" />
          <Skeleton variant="rectangular" className="w-24 h-9 rounded-lg" />
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    </div>
  );
}
