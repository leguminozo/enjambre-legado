'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useCartLines } from '@/components/shop/cart-context';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { CheckCircle, XCircle, Clock, Leaf, Trees, Package } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';
import { ResenaInvite } from '@/components/shop/resena-invite';
import { WalletButtons } from '@/components/shop/wallet-buttons';

type CommitState = 'loading' | 'success' | 'failed';

type PendingCheckout = { buyOrder?: string; provider?: string };

function parsePendingCheckout(raw: string | null): PendingCheckout | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      return {
        buyOrder: typeof obj.buyOrder === 'string' ? obj.buyOrder : undefined,
        provider: typeof obj.provider === 'string' ? obj.provider : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

type CommitResponse = { ok?: boolean; authorized?: boolean; error?: string; buyOrder?: string };

function parseCommitResponse(obj: unknown): CommitResponse {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return {};
  const record = obj as Record<string, unknown>;
  return {
    ok: typeof record.ok === 'boolean' ? record.ok : undefined,
    authorized: typeof record.authorized === 'boolean' ? record.authorized : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    buyOrder: typeof record.buyOrder === 'string' ? record.buyOrder : undefined,
  };
}

export function CheckoutResultClient() {
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const buyOrderParam = params.get('buyOrder');
  const statusParam = params.get('status');
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState('Confirmando pago...');
  const { clear } = useCartLines();
  
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statusParam === 'failed') {
      setState('failed');
      setMessage('El pago fue rechazado o cancelado.');
      return;
    }

    if (!token) {
      setState('failed');
      setMessage('No se recibió la confirmación de pago.');
      return;
    }

  const raw = sessionStorage.getItem('oyz_pending_checkout');
  const pending = parsePendingCheckout(raw);

    void (async () => {
      const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_API_URL || 'http://localhost:3001';
      let res: Response;
      try {
        res = await fetch(`${NUCLEO_URL}/api/checkout/commit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            token_ws: token,
            buyOrder: buyOrderParam || pending?.buyOrder || undefined,
            provider: pending?.provider || undefined,
          }),
        });
      } catch (networkError) {
        setState('failed');
        setMessage('Error de conexión. Verifica tu internet e intenta de nuevo.');
        return;
      }
      const json = parseCommitResponse(await res.json());

      if (!res.ok || !json.ok || !json.authorized) {
        setState('failed');
        setMessage(json.error ? friendlyApiError(undefined, json.error) : 'Pago no autorizado.');
        return;
      }

      sessionStorage.removeItem('oyz_pending_checkout');
      clear();
      setState('success');
      setMessage('Pago confirmado. Tu pedido fue registrado.');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con token
  }, [token]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (state === 'loading') {
        gsap.fromTo(iconRef.current, 
          { opacity: 0, scale: 0.5, rotate: -180 },
          { opacity: 1, scale: 1, rotate: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)' }
        );
        
        gsap.fromTo('.loading-text',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power2.out' }
        );
      } else if (state === 'success') {
        gsap.fromTo(iconRef.current,
          { opacity: 0, scale: 0, rotate: -180 },
          { opacity: 1, scale: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.7)', delay: 0.2 }
        );
        
        gsap.fromTo('.success-content',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out' }
        );
        
        // Confetti-like particles
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
        gsap.fromTo(iconRef.current,
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
        );
        
        gsap.fromTo('.failed-content',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
        );
      }
    }, contentRef);

    return () => ctx.revert();
  }, [state]);

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-[60vh] bg-background px-4 py-12 sm:px-6 relative overflow-hidden">
        {/* Background decorative elements */}
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
            {/* Animated Icon */}
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

            {/* Status Message */}
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              {state === 'loading' && 'Procesando tu pago'}
              {state === 'success' && '¡Pago Confirmado!'}
              {state === 'failed' && 'Pago No Completado'}
            </h1>

            <div className={state === 'loading' ? 'loading-text' : state === 'success' ? 'success-content' : 'failed-content'}>
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
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Package className="w-5 h-5 text-accent" />
                    <span>Tu pedido está siendo preparado con cuidado en Chiloé</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Leaf className="w-5 h-5 text-accent" />
                    <span>Esta compra contribuye a regenerar el bosque nativo</span>
                  </div>
                  
                  <div className="pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Te hemos enviado un correo con los detalles de tu pedido y el seguimiento del envío.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-accent">
                      <Trees className="w-4 h-4" />
                      <span>Gracias por ser parte del Legado del Bosque</span>
                    </div>
                  </div>
                  <ResenaInvite />
                  <div className="pt-4 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-3 text-center">
                      Lleva tu progreso de sellos en el teléfono
                    </p>
                    <WalletButtons compact />
                  </div>
                </div>
              )}

              {state === 'failed' && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Si el problema persiste, contáctanos a{' '}
                    <a href="mailto:comunidad@obrerayzangano.com" className="text-accent underline hover:text-accent/80">
                      comunidad@obrerayzangano.com
                    </a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    También puedes intentar con otro método de pago.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  {state === 'success' ? 'Seguir explorando' : 'Volver a la tienda'}
                </Link>
                {state === 'success' && (
                  <Link 
                    href="/perfil/pedidos" 
                    className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-card/50 transition-colors"
                  >
                    Ver mi pedido
                  </Link>
                )}
                <Link 
                  href="/" 
                  className="inline-flex items-center justify-center text-sm font-semibold text-accent underline hover:text-accent/80 transition-colors"
                >
                  Ir al inicio
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