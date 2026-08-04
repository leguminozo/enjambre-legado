'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/** Bookmark legacy → Lotes (pasaporte QR). Sin UI propia. */
export default function TrazabilidadRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/produccion/lotes');
  }, [router]);
  return <ViewLoading variant="view" label="Redirigiendo" hideLabel />;
}
