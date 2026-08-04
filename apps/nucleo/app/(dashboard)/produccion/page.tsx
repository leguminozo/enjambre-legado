'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/**
 * Hub PRODUCCIÓN: redirige a Inventario (punto operativo principal).
 * Las micro-herramientas viven en /recoleccion, /lotes, /inventario.
 */
export default function ProduccionHubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/produccion/inventario');
  }, [router]);
  return <ViewLoading variant="view" label="Producción" hideLabel />;
}
