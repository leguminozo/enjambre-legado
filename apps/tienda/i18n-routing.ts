import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // v1 producción: solo ES; rutas en app/ (sin [locale]/) — sin pathnames para no reescribir URLs
  locales: ['es'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];