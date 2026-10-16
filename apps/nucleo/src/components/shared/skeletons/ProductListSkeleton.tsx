'use client';

import { Skeleton } from '@enjambre/ui';

export function ProductListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando productos">
      {/* 2 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-border/60 bg-surface-sunken/40 space-y-2">
            <Skeleton variant="text" className="w-28 h-3" />
            <Skeleton variant="text" className="w-16 h-7" />
          </div>
        ))}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <Skeleton variant="rectangular" className="w-full sm:w-64 h-10 rounded-lg" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton variant="rectangular" className="w-28 h-10 rounded-lg" />
          <Skeleton variant="rectangular" className="w-24 h-10 rounded-lg" />
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Encabezado */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-surface-sunken border-b border-border text-xs">
          <div className="col-span-1"><Skeleton variant="text" className="w-8 h-3.5" /></div>
          <div className="col-span-4"><Skeleton variant="text" className="w-24 h-3.5" /></div>
          <div className="col-span-2 text-right"><Skeleton variant="text" className="w-16 h-3.5 ml-auto" /></div>
          <div className="col-span-2"><Skeleton variant="text" className="w-16 h-3.5" /></div>
          <div className="col-span-3 text-right"><Skeleton variant="text" className="w-20 h-3.5 ml-auto" /></div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
              {/* Foto */}
              <div className="col-span-1">
                <Skeleton variant="rectangular" className="w-12 h-12 rounded-lg" />
              </div>
              {/* Nombre y descripción */}
              <div className="col-span-4 space-y-1.5">
                <Skeleton variant="text" className="w-40 h-4" />
                <Skeleton variant="text" className="w-56 h-3" />
              </div>
              {/* Precio */}
              <div className="col-span-2 text-right">
                <Skeleton variant="text" className="w-20 h-4 ml-auto" />
              </div>
              {/* Formato */}
              <div className="col-span-2">
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
              {/* Acciones */}
              <div className="col-span-3 flex items-center justify-end gap-2">
                <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
                <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
                <Skeleton variant="rectangular" className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
