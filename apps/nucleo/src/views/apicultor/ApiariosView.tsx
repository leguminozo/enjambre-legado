'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/** Legacy reexport: la herramienta Apiarios vive dentro de Colmenas. */
export function ApiariosView() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/colmenas');
  }, [router]);
  return <ViewLoading variant="view" label="Colmenas" hideLabel />;
}
