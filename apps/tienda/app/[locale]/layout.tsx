import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n-routing';
import '../globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import {
  organizationJsonLd,
  webSiteJsonLd,
  mergeJsonLd,
} from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { VercelInsights } from '@/components/VercelInsights';

const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const fontBody = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

const localeNames: Record<string, string> = {
  es: 'es_CL',
  en: 'en_US',
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: messages.common.siteTitle || 'La Obrera y el Zángano · Tienda',
      template: '%s · La Obrera y el Zángano',
    },
    description: messages.common.siteDescription || 'Miel cruda del bosque nativo de Chiloé.',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: '/icons/icon-192.svg',
    },
    openGraph: {
      type: 'website',
      locale: localeNames[locale] || 'es_CL',
      siteName: 'La Obrera y el Zángano',
      title: {
        default: 'La Obrera y el Zángano · Miel cruda del bosque nativo',
        template: '%s · La Obrera y el Zángano',
      },
      description: 'Miel cruda del bosque nativo de Chiloé. Trazable desde el apiario hasta tu mesa. Regeneración biocultural.',
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: 'La Obrera y el Zángano',
        template: '%s · La Obrera y el Zángano',
      },
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        es: `${SITE_URL}/es`,
        en: `${SITE_URL}/en`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Enjambre Legado',
    },
    other: {
      'mobile-web-app-capable': 'yes',
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
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') ?? '';

  const themeScript = `(function(){try{var t=localStorage.getItem('enjambre-theme');var r=t==='light'?'light':t==='dark'?'dark':window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r)}catch(e){}})()`;

  const rootJsonLd = mergeJsonLd([organizationJsonLd(), webSiteJsonLd()]);

  return (
    <html lang={locale} className={`${fontDisplay.variable} ${fontBody.variable}`} suppressHydrationWarning>
      <head>
        {nonce && (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        )}
        <JsonLd data={rootJsonLd} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <RegisterServiceWorker />
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <VercelInsights />
      </body>
    </html>
  );
}