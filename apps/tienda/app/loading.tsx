'use client';

import { usePathname } from 'next/navigation';
import { ViewLoading, BrandWordmark } from '@enjambre/ui';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Despertando el bosque',
  '/catalogo': 'Abriendo el catálogo',
  '/carrito': 'Revisando tu cesta',
  '/checkout': 'Preparando tu pago',
  '/login': 'Verificando sesión',
  '/ciencia': 'Conectando con la ciencia',
  '/galeria': 'Cargando la galería',
  '/experiencias': 'Preparando experiencias',
  '/club-cosecha': 'Abriendo el club',
  '/contacto': 'Cargando contacto',
};

export default function TiendaLoading() {
  const pathname = usePathname();

  return (
    <ViewLoading
      variant="page"
      label={ROUTE_LABELS[pathname] ?? 'Cargando la tienda'}
      context="tienda"
      brand={<BrandWordmark name="La Obrera y el Zángano" ecosystem="Enjambre Legado" />}
    />
  );
}
