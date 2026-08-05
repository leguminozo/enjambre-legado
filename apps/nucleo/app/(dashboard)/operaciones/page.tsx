'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/** Legacy /operaciones → /despacho/envios */
export default function OperacionesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/despacho/envios');
  }, [router]);
  return <ViewLoading variant="view" label="Despacho" hideLabel />;
}
