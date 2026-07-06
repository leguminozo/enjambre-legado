import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Sin app/[locale]/ — locale por cookie (NEXT_LOCALE), URLs estables en producción
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'never',
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];