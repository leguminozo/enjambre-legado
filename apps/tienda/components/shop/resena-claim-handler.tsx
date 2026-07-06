'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@enjambre/ui';
import { useAuth } from '@/components/providers/auth-context';
import {
  claimResena,
  clearPendingClaimToken,
  getAuthToken,
  getPendingClaimToken,
} from '@/lib/shop/resenas-api';

/** Vincula reseña anónima tras login/registro (token en localStorage). */
export function ResenaClaimHandler() {
  const { isAuthenticated } = useAuth();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;

    const claimToken = getPendingClaimToken();
    if (!claimToken) return;

    attempted.current = true;

    void (async () => {
      const authToken = await getAuthToken();
      if (!authToken) {
        attempted.current = false;
        return;
      }

      const result = await claimResena(claimToken, authToken);
      clearPendingClaimToken();

      if (result.ok) {
        toast(result.message ?? 'Reseña vinculada a tu cuenta', { type: 'success' });
      } else if (result.message && !result.message.includes('Ya vinculada')) {
        toast(result.message, { type: 'info' });
      }
    })();
  }, [isAuthenticated]);

  return null;
}