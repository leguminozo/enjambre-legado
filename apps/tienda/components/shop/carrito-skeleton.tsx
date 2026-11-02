'use client';

import { Skeleton } from '@enjambre/ui';

export function CarritoTiendaSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 pt-[max(3rem,calc(var(--safe-top)+2rem))] pb-16 space-y-8 animate-in"
      aria-busy="true"
      aria-label="Cargando carrito de compras"
    >
      <div className="space-y-2">
        <Skeleton variant="text" className="w-48 h-8" />
        <Skeleton variant="text" className="w-72 max-w-full h-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-16 h-16 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton variant="text" className="w-40 h-4" />
                  <Skeleton variant="text" className="w-24 h-3.5" />
                </div>
              </div>
              <Skeleton variant="rectangular" className="w-24 h-9 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4 h-fit">
          <Skeleton variant="text" className="w-32 h-5" />
          <div className="space-y-2 pt-2">
            <div className="flex justify-between">
              <Skeleton variant="text" className="w-20 h-4" />
              <Skeleton variant="text" className="w-16 h-4" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="text" className="w-24 h-4" />
              <Skeleton variant="text" className="w-16 h-4" />
            </div>
          </div>
          <Skeleton variant="rectangular" className="w-full h-12 rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
