'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSwitchLocale } from '@/lib/shop/switch-locale';
import type { Locale } from '@/i18n-routing';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const switchLocale = useSwitchLocale();
  const tNav = useTranslations('nav');

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={`text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/70 transition-colors hover:text-accent ${className}`}
      aria-label={locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  );
}