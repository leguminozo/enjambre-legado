'use client';

import { Skeleton } from '@enjambre/ui';

export function CarritoSkeleton() {
  return (
    <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando carrito de venta">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-36 h-6" />
          <Skeleton variant="text" className="w-56 h-3.5" />
        </div>
        <Skeleton variant="rectangular" className="w-24 h-8 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-12 h-12 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton variant="text" className="w-40 h-4" />
                  <Skeleton variant="text" className="w-24 h-3" />
                </div>
              </div>
              <Skeleton variant="rectangular" className="w-20 h-8 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 h-fit">
          <Skeleton variant="text" className="w-28 h-5" />
          <Skeleton variant="rectangular" className="w-full h-10 rounded-xl" />
          <Skeleton variant="rectangular" className="w-full h-10 rounded-xl" />
          <Skeleton variant="rectangular" className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
