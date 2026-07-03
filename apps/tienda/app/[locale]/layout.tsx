import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n-routing';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

const localeNames: Record<string, string> = {
  es: 'es_CL',
  en: 'en_US',
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: messages.common.siteTitle || 'La Obrera y el Zángano · Tienda',
      template: '%s · La Obrera y el Zángano',
    },
    description: messages.common.siteDescription || 'Miel cruda del bosque nativo de Chiloé.',
    openGraph: {
      locale: localeNames[locale] || 'es_CL',
    },
    alternates: {
      canonical: locale === 'en' ? `${SITE_URL}/en` : SITE_URL,
      languages: {
        es: SITE_URL,
        en: `${SITE_URL}/en`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}