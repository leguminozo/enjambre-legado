'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // En rutas de degustación en vivo y escaneo QR (/cata, /qr, /trazabilidad), suprimir el banner
  // para que no bloquee ni interrumpa la experiencia sensorial en el punto de cata.
  if (
    pathname?.startsWith('/cata') ||
    pathname?.startsWith('/qr') ||
    pathname?.startsWith('/trazabilidad')
  ) {
    return null;
  }

  if (status !== 'unknown') return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('bannerTitle')}
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="mx-auto max-w-4xl px-4 py-3 pb-[max(0.75rem,var(--safe-bottom))] sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-start gap-3 sm:max-w-xl">
            <Cookie size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('bannerTitle')}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.rich('bannerText', {
                  cookies: (chunks) => (
                    <Link href="/cookies" className="text-accent-text underline hover:text-accent/80">
                      {chunks}
                    </Link>
                  ),
                  privacidad: (chunks) => (
                    <Link href="/privacidad" className="text-accent-text underline hover:text-accent/80">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={acceptEssential}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 sm:w-auto"
            >
              {t('essentialOnly')}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 sm:w-auto"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
