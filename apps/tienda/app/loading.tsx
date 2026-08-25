'use client';

import { usePathname } from 'next/navigation';
import { ViewLoading, BrandWordmark } from '@enjambre/ui';

const ROUTE_LABELS: Record<string, string> = {
  '/catalogo': 'Abriendo el catálogo',
  '/carrito': 'Revisando tu cesta',
  '/checkout': 'Preparando tu pago',
  '/login': 'Verificando sesión',
  '/ciencia': 'Conectando con la ciencia',
  '/galeria': 'Cargando la galería',
  '/experiencias': 'Preparando experiencias',
  '/club-legado-del-bosque': 'Abriendo el club',
  '/contacto': 'Cargando contacto',
};

function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-16" aria-busy="true" aria-label="Cargando">
      <div className="h-3 w-24 bg-muted animate-pulse mb-4" />
      <div className="h-8 w-64 max-w-full bg-muted animate-pulse mb-3" />
      <div className="h-4 w-80 max-w-full bg-muted/70 animate-pulse mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function TiendaLoading() {
  const pathname = usePathname();

  if (pathname === '/catalogo') {
    return <CatalogSkeleton />;
  }

  return (
    <ViewLoading
      variant="page"
      label={ROUTE_LABELS[pathname] ?? 'Cargando la tienda'}
      context="tienda"
      brand={<BrandWordmark name="La Obrera y el Zángano" ecosystem="Enjambre Legado" />}
    />
  );
}
