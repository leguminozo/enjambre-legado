'use client';

import { useEffect, useRef } from 'react';
import { useCartLines } from '@/components/shop/cart-context';
import { useAuth } from '@/components/providers/auth-context';

const SESSION_FLAG = 'oyz_abandonment_tracked';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registra abandono cuando un comprador autenticado o un visitante anónimo
 * (con correo ingresado en checkout) sale del proceso de compra con ítems en el carrito.
 */
export function useCartAbandonmentTracking(enabled: boolean, guestEmail?: string) {
  const { lines } = useCartLines();
  const { isAuthenticated } = useAuth();
  const linesRef = useRef(lines);
  const emailRef = useRef(guestEmail);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    emailRef.current = guestEmail;
  }, [guestEmail]);

  useEffect(() => {
    const validEmail = Boolean(guestEmail && EMAIL_REGEX.test(guestEmail.trim()));
    if (!enabled || (!isAuthenticated && !validEmail)) return;

    const track = () => {
      const currentLines = linesRef.current;
      if (currentLines.length === 0) return;
      if (sessionStorage.getItem(SESSION_FLAG) === '1') return;

      const effectiveEmail = emailRef.current?.trim();
      const payload: { items: Array<{ product_id: string; quantity: number }>; email?: string } = {
        items: currentLines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
        })),
        ...(effectiveEmail ? { email: effectiveEmail } : {}),
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
  }, [enabled, isAuthenticated, guestEmail]);
}