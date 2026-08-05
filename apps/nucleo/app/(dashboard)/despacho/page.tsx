'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/** Hub DESPACHO → Envíos (herramienta principal). */
export default function DespachoHubPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/despacho/envios');
  }, [router]);
  return <ViewLoading variant="view" label="Despacho" hideLabel />;
}
