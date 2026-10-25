'use client';

import { useEffect, useRef } from 'react';
import type gsap from 'gsap';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCartLines } from '@/components/shop/cart-context';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { CheckCircle, XCircle, Clock, ShoppingBag, Leaf, Trees, Package, ShieldCheck, Award, Wallet, Compass, Megaphone, ArrowRight, ArrowUpRight } from 'lucide-react';
import { friendlyError, friendlyApiError, formatCLP, useLegacyDevice } from '@enjambre/ui';
import { ResenaInvite } from '@/components/shop/resena-invite';
import { WalletButtons } from '@/components/shop/wallet-buttons';
import { useAuth } from '@/components/providers/auth-context';
import {
  CHECKOUT_SUCCESS_META_KEY,
  PENDING_CHECKOUT_STORAGE_KEY,
  PURCHASE_SNAPSHOT_STORAGE_KEY,
  clearCommerceStorage,
  readCommerceStorage,
} from '@/lib/shop/commerce-storage';
import { commitPayment, parsePendingPayment } from '@/lib/shop/payment-commit';
import { useMetaTracking } from '@/lib/tracking/client';
import type { PurchaseSnapshot } from '@/lib/tracking/types';

type EnrichedSnapshot = Omit<PurchaseSnapshot, 'items'> & {
  nombre?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  region?: string;
  courier?: string;
  subtotal?: number;
  shippingCost?: number;
  items: Array<{
    id: string;
    quantity: number;
    itemPrice?: number;
    name?: string;
    slug?: string;
  }>;
};

type CommitState = 'loading' | 'success' | 'failed' | 'pending' | 'canceled';

/** Reintentos cortos mientras el webhook libera el claim de liquidación. */
const PROCESSING_RETRY_DELAYS_MS = [1000, 2500, 4000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function CheckoutResultClient() {
  const t = useTranslations('checkout.result');
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const tbkToken = params.get('TBK_TOKEN') || params.get('tbk_token');
  const buyOrderParam = params.get('buyOrder');
  const statusParam = params.get('status');
  const providerParam = params.get('provider');
  const provider =
    providerParam === 'transbank' || providerParam === 'flow' ? providerParam : undefined;
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState(t('confirming'));
  const [successMeta, setSuccessMeta] = useState<{ buyOrder?: string; puntosGanados?: number } | null>(
    null,
  );
  const [orderSnapshot, setOrderSnapshot] = useState<EnrichedSnapshot | null>(null);
  const { isAuthenticated } = useAuth();
  const { clear } = useCartLines();
  const { legacy, motionReduced } = useLegacyDevice();
  const track = useMetaTracking();

  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusParam === 'canceled' || statusParam === 'cancelled' || (tbkToken && !token)) {
      setState('canceled');
      setMessage(t('canceledMessage'));
      return;
    }

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

    const pending = parsePendingPayment(readCommerceStorage(PENDING_CHECKOUT_STORAGE_KEY));

    void (async () => {
      const { getNucleoApiUrl } = await import('@/lib/shop/nucleo-url');
      const NUCLEO_URL = getNucleoApiUrl();
      if (!NUCLEO_URL) {
        setState('failed');
        setMessage(t('serviceUnavailable'));
        return;
      }

      const commitInput = {
        commitUrl: `${NUCLEO_URL}/api/checkout/commit`,
        token,
        buyOrder: buyOrderParam || pending?.buyOrder,
        provider: provider ?? pending?.provider,
      };

      // `processing` = el webhook tiene el claim de liquidación y puede fallar
      // después: reintentamos antes de mostrar éxito (sin Purchase ni vaciar
      // carrito hasta la confirmación real).
      let result = await commitPayment(commitInput);
      for (const delay of PROCESSING_RETRY_DELAYS_MS) {
        if (!result.ok || !result.data.processing) break;
        await sleep(delay);
        result = await commitPayment(commitInput);
      }

      if (!result.ok) {
        if (result.kind === 'canceled') {
          setState('canceled');
          setMessage(t('canceledMessage'));
          return;
        }
        setState('failed');
        setMessage(
          friendlyError(result.message, t('paymentFailed')),
        );
        return;
      }

      if (result.data.processing) {
        setState('pending');
        setMessage(t('pendingMessage'));
        if (result.data.buyOrder) {
          setSuccessMeta({ buyOrder: result.data.buyOrder });
        }
        return;
      }

      clearCommerceStorage(PENDING_CHECKOUT_STORAGE_KEY);
      try {
        const raw = readCommerceStorage(CHECKOUT_SUCCESS_META_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { buyOrder?: string; puntosGanados?: number };
          // Solo confiar en la meta si pertenece a ESTA orden; si el checkout
          // anterior se abandonó, la meta stale mostraría puntos/pedido ajenos.
          if (parsed.buyOrder === result.data.buyOrder) {
            setSuccessMeta(parsed);
          } else if (result.data.buyOrder) {
            setSuccessMeta({ buyOrder: result.data.buyOrder });
          }
          clearCommerceStorage(CHECKOUT_SUCCESS_META_KEY);
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
        const rawSnapshot = readCommerceStorage(PURCHASE_SNAPSHOT_STORAGE_KEY);
        if (rawSnapshot) {
          const snapshot = JSON.parse(rawSnapshot) as EnrichedSnapshot;
          if (snapshot.buyOrder === result.data.buyOrder) {
            setOrderSnapshot(snapshot);
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
          clearCommerceStorage(PURCHASE_SNAPSHOT_STORAGE_KEY);
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
    let ctx: gsap.Context | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import('gsap');
      if (cancelled) return;
      ctx = gsap.context(() => {
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

          // Explosión de partículas: 20 nodos animados en GPU vieja (iPhone 7) es
          // caro → se omite en tier legacy / reduced-motion (el resto de la
          // transición queda igual).
          if (!legacy && !motionReduced) {
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
          }
        } else if (state === 'failed' || state === 'pending' || state === 'canceled') {
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
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [state, legacy, motionReduced]);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background px-4 pt-[max(3rem,calc(var(--safe-top)+1.5rem))] pb-12 sm:px-6 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="enj-blur-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
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
              {state === 'canceled' && (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-20 h-20 text-accent" strokeWidth={1.5} />
                </div>
              )}
              {state === 'pending' && (
                <div className="w-full h-full flex items-center justify-center">
                  <Clock className="w-20 h-20 text-accent" strokeWidth={1.5} />
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              {state === 'loading' && t('processingTitle')}
              {state === 'success' && t('successTitle')}
              {state === 'failed' && t('failedTitle')}
              {state === 'canceled' && t('canceledTitle')}
              {state === 'pending' && t('pendingTitle')}
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
                    ? 'text-success-text'
                    : state === 'failed'
                      ? 'text-destructive'
                      : state === 'canceled'
                        ? 'text-foreground/90'
                        : 'text-muted-foreground'
                }`}
              >
                {message}
              </p>

              {state === 'canceled' && (
                <div className="rounded-2xl border border-border/80 bg-surface-sunken/60 p-5 text-center mb-8 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {t('cartPreserved')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('tryOtherPayment')}
                  </p>
                </div>
              )}

              {state === 'pending' && successMeta?.buyOrder && (
                <p className="text-xs text-muted-foreground mb-8">
                  Pedido <span className="font-mono text-foreground font-semibold">{successMeta.buyOrder}</span>
                </p>
              )}

              {state === 'success' && (
                <div className="space-y-6 mb-8 text-left sm:text-center">
                  {successMeta?.buyOrder && (
                    <p className="text-xs text-muted-foreground text-center">
                      Pedido <span className="font-mono text-foreground font-semibold">{successMeta.buyOrder}</span>
                    </p>
                  )}
                  {successMeta?.puntosGanados != null && successMeta.puntosGanados > 0 && (
                    <p className="text-sm text-accent-text font-medium text-center">
                      +{successMeta.puntosGanados} puntos de fidelización
                    </p>
                  )}

                  {/* Recibo Itemizado de Lujo */}
                  {orderSnapshot && orderSnapshot.items && orderSnapshot.items.length > 0 && (
                    <div className="rounded-2xl border border-border/80 bg-surface-sunken/60 p-5 text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                          Detalle del Pedido
                        </span>
                        <span className="font-mono text-xs text-foreground">
                          {orderSnapshot.buyOrder}
                        </span>
                      </div>
                      <ul className="divide-y divide-border/40 text-xs">
                        {orderSnapshot.items.map((item, idx) => (
                          <li key={item.id + idx} className="py-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">
                                {item.name || 'Miel Nativa Virgen'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Cantidad: {item.quantity}
                              </p>
                            </div>
                            <span className="font-mono font-medium text-foreground shrink-0">
                              {formatCLP((item.itemPrice ?? 0) * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border/60 pt-3 flex items-center justify-between text-sm font-semibold">
                        <span className="text-muted-foreground">Total Pagado</span>
                        <span className="text-accent-text font-display text-base">
                          {formatCLP(orderSnapshot.total)}
                        </span>
                      </div>
                      {orderSnapshot.direccion && (
                        <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 leading-relaxed">
                          Envío a: {orderSnapshot.direccion}, {orderSnapshot.comuna} · {orderSnapshot.courier}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Onboarding Inteligente para Compradores Invitados */}
                  {!isAuthenticated && (
                    <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5 text-left space-y-3">
                      <div className="flex items-center gap-2 text-accent-text">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <h3 className="font-display text-base font-semibold text-foreground">
                          Tu compra quedó a salvo
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tu recibo y el sello de autenticidad digital están aquí arriba, sin necesidad de cuenta. Crea una cuando quieras para acumular ciclos y hacer seguimiento de este envío.
                      </p>
                      <Link
                        href="/register?returnTo=/perfil/pedidos"
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-accent/50 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-text hover:bg-accent/10 transition-colors text-center"
                      >
                        Crear cuenta y acumular ciclos
                      </Link>
                    </div>
                  )}

                  {/* ── EL PODER DE TU LEGADO SE EXPANDE ── */}
                  <div className="rounded-2xl border border-border/80 bg-card/60 p-6 text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-medium text-foreground">
                            El Poder de tu Legado se Expande
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Tu compra activa beneficios reales y tangibles en el ecosistema
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      {/* Poder 1: Premios */}
                      <div className="p-3 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-medium text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-accent" />
                              Catálogo de Premios
                            </span>
                            <span className="text-[10px] font-mono text-accent font-semibold">
                              {successMeta?.puntosGanados != null && successMeta.puntosGanados > 0
                                ? `+${successMeta.puntosGanados} pts`
                                : 'Según tu compra'}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                            Puntos acreditados para canjear por frascos exclusivos y catas de autor.
                          </p>
                        </div>
                        <Link
                          href="/perfil/canje"
                          className="pt-2 text-[11px] font-mono uppercase tracking-wider text-accent inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Ver premios disponibles</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Poder 2: Pase Digital & Sellos */}
                      <div className="p-3 rounded-xl bg-surface-sunken/60 border border-border/40 space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-medium text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-accent" />
                              Billetera & Sellos
                            </span>
                            <span className="text-[10px] font-mono text-accent font-semibold">Sello Sumado</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                            Suma sellos por formato en tu Pase Digital para canjes físicos en feria.
                          </p>
                        </div>
                        <Link
                          href="/perfil/billetera"
                          className="pt-2 text-[11px] font-mono uppercase tracking-wider text-accent inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Abrir Billetera y Pase</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Poder 3 & 4: Trazabilidad y Colmena */}
                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <Link
                        href="/perfil/trazabilidad"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-accent" />
                        <span>Trazabilidad del apiario en Pureo</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link
                        href="/perfil/pasaporte"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Leaf className="w-3.5 h-3.5 text-accent" />
                        <span>Pasaporte de Colmena</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <Link
                        href="/embajadores"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-accent" />
                        <span>{t('embajadorLink')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground pt-2">
                    <Package className="w-5 h-5 text-accent shrink-0" />
                    <span>{t('preparing')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Leaf className="w-5 h-5 text-accent shrink-0" />
                    <span>{t('forestImpact')}</span>
                  </div>

                  <div className="pt-6 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground mb-2">{t('emailNote')}</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-accent-text">
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
                      href="mailto:contacto@obrerayzangano.cl"
                      className="inline-flex min-h-11 items-center text-accent underline hover:text-accent/80"
                    >
                      contacto@obrerayzangano.cl
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">{t('tryOtherPayment')}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {state === 'canceled' && (
                  <Link
                    href="/carrito"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
                  >
                    {t('backToCart')}
                  </Link>
                )}
                <Link
                  href="/catalogo"
                  className={`inline-flex min-h-12 items-center justify-center rounded-full ${
                    state === 'canceled'
                      ? 'border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50'
                      : 'bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80'
                  } transition-colors`}
                >
                  {state === 'success' ? t('exploreMore') : t('backToShop')}
                </Link>
                {(state === 'success' || state === 'pending') && isAuthenticated && (
                  <>
                    <Link
                      href="/perfil/pedidos"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50 transition-colors"
                    >
                      {t('viewOrder')}
                    </Link>
                  </>
                )}
                {state === 'success' && !isAuthenticated && (
                  <Link
                    href="/perfil/trazabilidad"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50 transition-colors"
                  >
                    Certificado de origen
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