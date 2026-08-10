'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCartLines } from '@/components/shop/cart-context';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { CheckCircle, XCircle, Clock, Leaf, Trees, Package } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';
import { ResenaInvite } from '@/components/shop/resena-invite';
import { WalletButtons } from '@/components/shop/wallet-buttons';
import {
  CHECKOUT_SUCCESS_META_KEY,
  PENDING_CHECKOUT_STORAGE_KEY,
  PURCHASE_SNAPSHOT_STORAGE_KEY,
} from '@/lib/shop/commerce-storage';
import { commitPayment, parsePendingPayment } from '@/lib/shop/payment-commit';
import { useMetaTracking } from '@/lib/tracking/client';
import type { PurchaseSnapshot } from '@/lib/tracking/types';

type CommitState = 'loading' | 'success' | 'failed';

export function CheckoutResultClient() {
  const t = useTranslations('checkout.result');
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const buyOrderParam = params.get('buyOrder');
  const statusParam = params.get('status');
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState(t('confirming'));
  const [successMeta, setSuccessMeta] = useState<{ buyOrder?: string; puntosGanados?: number } | null>(
    null,
  );
  const { clear } = useCartLines();
  const track = useMetaTracking();

  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusParam === 'failed') {
      setState('failed');
      setMessage(t('paymentFailed'));
      return;
    }

    if (!token) {
      setState('failed');
      setMessage(t('noToken'));
      return;
    }

    const pending = parsePendingPayment(sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY));

    void (async () => {
      const { getNucleoApiUrl } = await import('@/lib/shop/nucleo-url');
      const NUCLEO_URL = getNucleoApiUrl();
      if (!NUCLEO_URL) {
        setState('failed');
        setMessage(t('serviceUnavailable'));
        return;
      }

      const result = await commitPayment({
        commitUrl: `${NUCLEO_URL}/api/checkout/commit`,
        token,
        buyOrder: buyOrderParam || pending?.buyOrder,
        provider: pending?.provider,
      });

      if (!result.ok) {
        setState('failed');
        setMessage(
          result.kind === 'rejected'
            ? friendlyApiError(undefined, result.message)
            : result.message,
        );
        return;
      }

      sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
      try {
        const raw = sessionStorage.getItem(CHECKOUT_SUCCESS_META_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { buyOrder?: string; puntosGanados?: number };
          // Solo confiar en la meta si pertenece a ESTA orden; si el checkout
          // anterior se abandonó, la meta stale mostraría puntos/pedido ajenos.
          if (parsed.buyOrder === result.data.buyOrder) {
            setSuccessMeta(parsed);
          } else if (result.data.buyOrder) {
            setSuccessMeta({ buyOrder: result.data.buyOrder });
          }
          sessionStorage.removeItem(CHECKOUT_SUCCESS_META_KEY);
        } else if (result.data.buyOrder) {
          setSuccessMeta({ buyOrder: result.data.buyOrder });
        }
      } catch {
        if (result.data.buyOrder) {
          setSuccessMeta({ buyOrder: result.data.buyOrder });
        }
      }

      // Purchase (Meta Ads): solo si el snapshot pertenece a ESTA orden
      // (buyOrder coincide) — evita fires stale/duplicados de checkouts previos.
      try {
        const rawSnapshot = sessionStorage.getItem(PURCHASE_SNAPSHOT_STORAGE_KEY);
        if (rawSnapshot) {
          const snapshot = JSON.parse(rawSnapshot) as PurchaseSnapshot;
          if (snapshot.buyOrder === result.data.buyOrder) {
            const items = snapshot.items ?? [];
            track({
              eventName: 'Purchase',
              value: Math.round(snapshot.total),
              currency: 'CLP',
              contents: items,
              contentIds: items.map((i) => i.id),
              numItems: items.reduce((sum, i) => sum + i.quantity, 0),
              orderId: result.data.buyOrder,
              email: snapshot.email,
            });
          }
          sessionStorage.removeItem(PURCHASE_SNAPSHOT_STORAGE_KEY);
        }
      } catch (err) {
        // El tracking nunca debe romper la página de confirmación
        if (process.env.NODE_ENV !== 'production') {
          console.error('[tracking] Purchase falló', err);
        }
      }

      clear();
      setState('success');
      setMessage(t('confirmed'));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con token
  }, [token]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (state === 'loading') {
        gsap.fromTo(
          iconRef.current,
          { opacity: 0, scale: 0.5, rotate: -180 },
          { opacity: 1, scale: 1, rotate: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' },
        );

        gsap.fromTo(
          '.loading-text',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' },
        );
      } else if (state === 'success') {
        gsap.fromTo(
          iconRef.current,
          { opacity: 0, scale: 0, rotate: -180 },
          { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.7)', delay: 0.2 },
        );

        gsap.fromTo(
          '.success-content',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out' },
        );

        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          particle.className = 'absolute w-2 h-2 rounded-full bg-accent/60';
          particle.style.left = '50%';
          particle.style.top = '50%';
          contentRef.current?.appendChild(particle);

          gsap.to(particle, {
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400,
            opacity: 0,
            scale: 0,
            duration: 1 + Math.random(),
            ease: 'power2.out',
            onComplete: () => particle.remove(),
          });
        }
      } else if (state === 'failed') {
        gsap.fromTo(
          iconRef.current,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
        );

        gsap.fromTo(
          '.failed-content',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        );
      }
    }, contentRef);

    return () => ctx.revert();
  }, [state]);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background px-4 pt-[max(3rem,calc(var(--safe-top)+1.5rem))] pb-12 sm:px-6 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
          {state === 'success' && (
            <>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-success/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
            </>
          )}
        </div>

        <div className="mx-auto max-w-xl relative z-10" ref={contentRef}>
          <div className="rounded-xl border border-border bg-card/50 p-8 sm:p-12 text-center backdrop-blur-sm">
            <div ref={iconRef} className="relative w-24 h-24 mx-auto mb-8">
              {state === 'loading' && (
                <div className="w-full h-full flex items-center justify-center">
                  <Clock className="w-16 h-16 text-accent animate-pulse" />
                </div>
              )}
              {state === 'success' && (
                <div className="w-full h-full flex items-center justify-center relative">
                  <CheckCircle className="w-20 h-20 text-success" strokeWidth={1.5} />
                  <div className="absolute inset-0 border-4 border-success/20 rounded-full animate-ping" />
                </div>
              )}
              {state === 'failed' && (
                <div className="w-full h-full flex items-center justify-center">
                  <XCircle className="w-20 h-20 text-destructive" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              {state === 'loading' && t('processingTitle')}
              {state === 'success' && t('successTitle')}
              {state === 'failed' && t('failedTitle')}
            </h1>

            <div
              className={
                state === 'loading'
                  ? 'loading-text'
                  : state === 'success'
                    ? 'success-content'
                    : 'failed-content'
              }
            >
              <p
                className={`text-base mb-8 ${
                  state === 'success'
                    ? 'text-success'
                    : state === 'failed'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                }`}
              >
                {message}
              </p>

              {state === 'success' && (
                <div className="space-y-6 mb-8">
                  {successMeta?.buyOrder && (
                    <p className="text-xs text-muted-foreground">
                      Pedido <span className="font-mono text-foreground">{successMeta.buyOrder}</span>
                    </p>
                  )}
                  {successMeta?.puntosGanados != null && successMeta.puntosGanados > 0 && (
                    <p className="text-sm text-accent font-medium">
                      +{successMeta.puntosGanados} puntos de fidelización
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Package className="w-5 h-5 text-accent" />
                    <span>{t('preparing')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Leaf className="w-5 h-5 text-accent" />
                    <span>{t('forestImpact')}</span>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">{t('emailNote')}</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-accent">
                      <Trees className="w-4 h-4" />
                      <span>{t('thanksLegado')}</span>
                    </div>
                  </div>
                  <ResenaInvite />
                  <div className="pt-4 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-3 text-center">{t('walletHint')}</p>
                    <WalletButtons compact />
                  </div>
                </div>
              )}

              {state === 'failed' && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('contactSupport')}{' '}
                    <a
                      href="mailto:comunidad@obrerayzangano.com"
                      className="inline-flex min-h-11 items-center text-accent underline hover:text-accent/80"
                    >
                      comunidad@obrerayzangano.com
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">{t('tryOtherPayment')}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/catalogo"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  {state === 'success' ? t('exploreMore') : t('backToShop')}
                </Link>
                {state === 'success' && (
                  <Link
                    href="/perfil/pedidos"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50 transition-colors"
                  >
                    {t('viewOrder')}
                  </Link>
                )}
                <Link
                  href="/"
                  className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-accent underline hover:text-accent/80 transition-colors"
                >
                  {t('goHome')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}