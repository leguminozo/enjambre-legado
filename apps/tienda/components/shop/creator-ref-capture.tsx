'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CREATOR_REF_CODE_KEY } from '@/lib/shop/commerce-storage';

/**
 * Persiste el código de embajador cuando un visitante llega con
 * `?ref=CODIGO` o `?codigo=CODIGO` (link compartido desde portal creador).
 */
export function CreatorRefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const raw = searchParams.get('ref') ?? searchParams.get('codigo');
    const code = raw?.trim().toUpperCase();
    if (!code || code.length < 2 || code.length > 40) return;
    try {
      sessionStorage.setItem(CREATOR_REF_CODE_KEY, code);
    } catch {
      // private mode / blocked storage
    }
  }, [searchParams]);

  return null;
}
