import React from 'react';

/**
 * Skeleton local del perfil de clientes:
 * Se monta instantáneamente dentro de PerfilLayoutClient mientras Next.js
 * procesa o revalida la sección solicitada (pedidos, ajustes, billetera, etc.).
 * Mantiene el sidebar y header 100% estables, evitando parpadeos de pantalla completa.
 */
export default function PerfilLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando sección de Mi Legado"
      className="space-y-8 animate-pulse motion-reduce:animate-none"
    >
      <span className="sr-only">Cargando contenido de la sección...</span>

      {/* Cabecera de la sección */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-raised/60 border border-border/40 shrink-0" />
          <div className="h-8 w-48 sm:w-64 bg-surface-raised/60 rounded-lg" />
        </div>
        <div className="h-4 w-72 max-w-full bg-surface-raised/35 rounded" />
      </div>

      {/* Tarjeta principal de contenido */}
      <div className="rounded-2xl border border-border/40 bg-surface-raised/20 p-6 space-y-4">
        <div className="h-5 w-40 bg-surface-raised/50 rounded" />
        <div className="h-4 w-full max-w-md bg-surface-raised/30 rounded" />
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-20 rounded-xl bg-surface-raised/30 border border-border/30" />
          <div className="h-20 rounded-xl bg-surface-raised/30 border border-border/30" />
          <div className="h-20 rounded-xl bg-surface-raised/30 border border-border/30" />
        </div>
      </div>

      {/* Grid secundario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 rounded-2xl border border-border/40 bg-surface-raised/15 p-6 space-y-3">
          <div className="h-4 w-32 bg-surface-raised/40 rounded" />
          <div className="h-16 w-full bg-surface-raised/25 rounded-xl" />
        </div>
        <div className="h-44 rounded-2xl border border-border/40 bg-surface-raised/15 p-6 space-y-3">
          <div className="h-4 w-32 bg-surface-raised/40 rounded" />
          <div className="h-16 w-full bg-surface-raised/25 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
