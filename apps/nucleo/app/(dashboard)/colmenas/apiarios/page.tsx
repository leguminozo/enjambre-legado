'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ViewLoading } from '@enjambre/ui';

/** Legacy: Apiarios se unificó en Colmenas (colección → workspace). */
export default function ApiariosRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/colmenas');
  }, [router]);
  return <ViewLoading variant="view" label="Colmenas" hideLabel />;
}
