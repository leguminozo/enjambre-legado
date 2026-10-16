'use client';

import { Skeleton, SkeletonTable } from '@enjambre/ui';

export function FiscalSiiSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando facturación y módulo fiscal">
      {/* Header ViewShell skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20 h-3" />
          <Skeleton variant="text" className="w-52 h-7" />
          <Skeleton variant="text" className="w-80 max-w-full h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-48 h-10 rounded-xl" />
      </div>

      {/* 3 KPI Cards de Estado Fiscal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-24 h-3.5" />
              <Skeleton variant="rectangular" className="w-4 h-4 rounded" />
            </div>
            <Skeleton variant="text" className="w-20 h-7" />
            <Skeleton variant="text" className="w-32 h-3" />
          </div>
        ))}
      </div>

      {/* Tabla de DTEs / Documentos */}
      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}
