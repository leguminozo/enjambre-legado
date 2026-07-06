'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n-navigation';
import type { Locale } from '@/i18n-routing';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations('nav');

  const switchLocale = () => {
    router.replace(pathname, { locale: locale === 'es' ? 'en' : 'es' });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={`rounded-full border border-border bg-surface-sunken px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent ${className}`}
      aria-label={locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
    >
      {locale === 'es' ? tNav('switchToEnglish') : tNav('switchToSpanish')}
    </button>
  );
}