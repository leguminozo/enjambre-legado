'use client';

import { useEffect, useRef } from 'react';
import { useCartLines } from '@/components/shop/cart-context';
import { useAuth } from '@/components/providers/auth-context';

const SESSION_FLAG = 'oyz_abandonment_tracked';

/**
 * Registra abandono cuando un guardián autenticado sale del checkout con ítems.
 * Envía solo product_id + quantity; precios se resuelven server-side.
 */
export function useCartAbandonmentTracking(enabled: boolean) {
  const { lines } = useCartLines();
  const { isAuthenticated } = useAuth();
  const linesRef = useRef(lines);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const track = () => {
      const currentLines = linesRef.current;
      if (currentLines.length === 0) return;
      if (sessionStorage.getItem(SESSION_FLAG) === '1') return;

      const payload = {
        items: currentLines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
        })),
      };

      void fetch('/api/cart/abandonment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) sessionStorage.setItem(SESSION_FLAG, '1');
        })
        .catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') track();
    };

    window.addEventListener('pagehide', track);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pagehide', track);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, isAuthenticated]);
}