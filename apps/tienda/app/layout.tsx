import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  organizationJsonLd,
  webSiteJsonLd,
  mergeJsonLd,
} from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { VercelInsights } from '@/components/VercelInsights';
import { loadHeaderMenu } from '@/lib/shop/load-header-menu';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export async function generateMetadata(): Promise<Metadata> {
  const storeChrome = await loadStoreChrome();
  const { seo, brand } = storeChrome;
  const ogImage = seo.og_image_url || brand.og_image_url || undefined;
  const favicon = brand.favicon_url || '/icons/icon-192.svg';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.default_title,
      template: seo.title_template || '%s · La Obrera y el Zángano',
    },
    description: seo.default_description,
    manifest: '/manifest.webmanifest',
    icons: { icon: favicon },
    openGraph: {
      siteName: seo.site_name,
      title: seo.default_title,
      description: seo.default_description,
      url: SITE_URL,
      type: 'website',
      locale: 'es_CL',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.default_title,
      description: seo.default_description,
      site: seo.twitter_handle || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        es: SITE_URL,
        en: SITE_URL,
      },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') ?? '';
  const [headerMenu, storeChrome] = await Promise.all([loadHeaderMenu(), loadStoreChrome()]);
  const themeScript = `(function(){try{var t=localStorage.getItem('enjambre-theme');var r=t==='light'?'light':t==='dark'?'dark':window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r)}catch(e){}})()`;
  const rootJsonLd = mergeJsonLd([organizationJsonLd(), webSiteJsonLd()]);
  const favicon = storeChrome.brand.favicon_url || '/icons/icon-192.svg';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap"
        />
        <link rel="icon" href={favicon} />
        {nonce ? <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /> : null}
        <JsonLd data={rootJsonLd} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RegisterServiceWorker />
          <AppProviders
            headerSettings={headerMenu.settings}
            headerItems={headerMenu.items}
            storeChrome={storeChrome}
          >
            {children}
          </AppProviders>
        </NextIntlClientProvider>
        <VercelInsights />
      </body>
    </html>
  );
}
