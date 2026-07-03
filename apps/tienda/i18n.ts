import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n-routing';

export type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async () => {
  const locale = routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});