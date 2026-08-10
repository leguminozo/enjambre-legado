'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';
import { useConsent } from './consent-provider';

/**
 * Banner de consentimiento (Ley 19.628 / 21.719).
 * Se muestra solo mientras el estado es 'unknown' (sin cookie preference-consent).
 * Enlaza a las páginas legales existentes (/cookies, /privacidad).
 */
export function ConsentBanner() {
  const { status, acceptAll, acceptEssential } = useConsent();
  const t = useTranslations('cookies');

  if (status !== 'unknown') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('bannerTitle')}
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="mx-auto max-w-4xl px-4 py-4 pb-[max(1rem,var(--safe-bottom))] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:max-w-xl">
            <Cookie size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{t('bannerTitle')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t.rich('bannerText', {
                  cookies: (chunks) => (
                    <Link href="/cookies" className="text-accent underline hover:text-accent/80">
                      {chunks}
                    </Link>
                  ),
                  privacidad: (chunks) => (
                    <Link href="/privacidad" className="text-accent underline hover:text-accent/80">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={acceptEssential}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:bg-secondary/60 transition-colors"
            >
              {t('essentialOnly')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
