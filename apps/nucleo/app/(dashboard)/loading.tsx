'use client';

import { usePathname } from 'next/navigation';
import { ViewLoading, BrandWordmark } from '@enjambre/ui';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Cargando el núcleo',
  '/inicio': 'Cargando el núcleo',
  '/banco': 'Consultando el banco',
  '/sii': 'Sincronizando con el SII',
  '/contable': 'Preparando lo contable',
  '/catalogo': 'Abriendo el catálogo',
  '/colmenas': 'Revisando las colmenas',
  '/produccion': 'Cargando producción',
  '/despacho': 'Cargando despacho',
  '/configuracion': 'Cargando configuración',
  '/territorio': 'Cargando el territorio',
  '/registro-territorial': 'Cargando el registro territorial',
  '/editor-tienda': 'Abriendo el editor de tienda',
  '/reportes': 'Preparando reportes',
  '/costeo': 'Calculando costos',
  '/pagos': 'Cargando pagos',
  '/mapa': 'Cargando el mapa',
};

export default function NucleoLoading() {
  const pathname = usePathname();

  return (
    <ViewLoading
      variant="page"
      label={ROUTE_LABELS[pathname] ?? 'Cargando módulo'}
      context="nucleo"
      brand={<BrandWordmark />}
    />
  );
}
