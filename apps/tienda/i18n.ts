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
  const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value;
  const fromRequest = await requestLocale;
  const headerLocale = (await headers()).get('x-next-intl-locale') ?? undefined;
  const locale = resolveLocale(cookieLocale ?? fromRequest ?? headerLocale);

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});