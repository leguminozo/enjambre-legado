'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n-navigation';
import type { Locale } from '@/i18n-routing';

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Persiste idioma sin prefijo /es|/en en la URL (localePrefix: never). */
export function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
}

export function useSwitchLocale() {
  const locale = useLocale() as Locale;
  const router = useRouter();

  return useCallback(() => {
    const next: Locale = locale === 'es' ? 'en' : 'es';
    setLocaleCookie(next);
    router.refresh();
  }, [locale, router]);
}