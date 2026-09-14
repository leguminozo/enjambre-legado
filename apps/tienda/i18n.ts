import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './i18n-routing';

export type Locale = (typeof routing.locales)[number];

function resolveLocale(raw: string | undefined): Locale {
  if (raw && routing.locales.includes(raw as Locale)) {
    return raw as Locale;
  }
  return routing.defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const fromRequest = await requestLocale;
  let rawLocale = fromRequest;

  // En build estático / generación de páginas ISR, no invocar cookies() ni headers()
  // para permitir que Next.js prerenderice las páginas estáticamente en español.
  if (!rawLocale && process.env.NEXT_PHASE !== 'phase-production-build') {
    try {
      const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
      const headerLocale = (await headers()).get('x-next-intl-locale') ?? undefined;
      rawLocale = cookieLocale ?? headerLocale;
    } catch {
      // Sin contexto de request HTTP
    }
  }

  const locale = resolveLocale(rawLocale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});