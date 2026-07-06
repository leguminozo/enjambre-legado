'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Clock, Repeat } from 'lucide-react';
import { friendlyApiError } from '@enjambre/ui';
import { PENDING_SUBSCRIPTION_STORAGE_KEY } from '@/lib/shop/commerce-storage';
import { commitPayment, parsePendingPayment } from '@/lib/shop/payment-commit';
import { REPOSICION_PATH } from '@/lib/shop/store-routes';

type CommitState = 'loading' | 'success' | 'failed';

export function ReplenishmentResultClient() {
  const t = useTranslations('perfil.reposicion.result');
  const params = useSearchParams();
  const token = params.get('token_ws') || params.get('token');
  const buyOrderParam = params.get('buyOrder');
  const statusParam = params.get('status');
  const [state, setState] = useState<CommitState>('loading');
  const [message, setMessage] = useState(t('confirming'));

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

    const pending = parsePendingPayment(sessionStorage.getItem(PENDING_SUBSCRIPTION_STORAGE_KEY));

    void (async () => {
      const { getNucleoApiUrl } = await import('@/lib/shop/nucleo-url');
      const NUCLEO_URL = getNucleoApiUrl();
      if (!NUCLEO_URL) {
        setState('failed');
        setMessage(t('noToken'));
        return;
      }

      const result = await commitPayment({
        commitUrl: `${NUCLEO_URL}/api/subscriptions/checkout/commit`,
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

      sessionStorage.removeItem(PENDING_SUBSCRIPTION_STORAGE_KEY);
      setState('success');
      setMessage(
        result.data.alreadyProcessed ? t('alreadyActive') : t('confirmed'),
      );
    })();
  }, [token, buyOrderParam, statusParam]);

  useEffect(() => {
    if (state === 'loading') return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' });
      gsap.from(iconRef.current, { scale: 0, duration: 0.6, ease: 'back.out(1.7)', delay: 0.2 });
    });
    return () => ctx.revert();
  }, [state]);

  const Icon = state === 'success' ? CheckCircle : state === 'failed' ? XCircle : Clock;
  const iconColor =
    state === 'success' ? 'text-accent' : state === 'failed' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div ref={contentRef} className="max-w-lg w-full text-center space-y-8">
        <div ref={iconRef} className="flex justify-center">
          <div className={`w-20 h-20 rounded-full bg-secondary flex items-center justify-center ${iconColor}`}>
            <Icon size={40} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Repeat size={16} className="text-accent" />
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">{t('kicker')}</span>
          </div>
          <h1 className="font-display text-3xl text-foreground mb-4">
            {state === 'loading' ? t('processing') : state === 'success' ? t('successTitle') : t('errorTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {state !== 'loading' ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={REPOSICION_PATH}
              className="px-8 py-3 bg-accent text-accent-foreground text-[0.65rem] uppercase tracking-[0.25em] font-bold rounded-xl hover:shadow-glow transition-all"
            >
              {t('viewReplenishment')}
            </Link>
            <Link
              href="/catalogo"
              className="px-8 py-3 border border-border text-foreground text-[0.65rem] uppercase tracking-[0.25em] rounded-xl hover:border-accent/30 transition-all"
            >
              {t('exploreCatalog')}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}