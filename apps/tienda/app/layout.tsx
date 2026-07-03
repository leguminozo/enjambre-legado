import { NextIntlClientProvider } from 'next-intl';
import './globals.css';
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
import esMessages from '../messages/es.json';

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'La Obrera y el Zángano · Tienda',
    template: '%s · La Obrera y el Zángano',
  },
  description: 'Miel cruda del bosque nativo de Chiloé.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.svg' },
  alternates: {
    canonical: SITE_URL,
    languages: {
      es: SITE_URL,
      en: `${SITE_URL}/en`,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-csp-nonce') ?? '';
  const themeScript = `(function(){try{var t=localStorage.getItem('enjambre-theme');var r=t==='light'?'light':t==='dark'?'dark':window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r)}catch(e){}})()`;
  const rootJsonLd = mergeJsonLd([organizationJsonLd(), webSiteJsonLd()]);

  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable}`} suppressHydrationWarning>
      <head>
        {nonce ? <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /> : null}
        <JsonLd data={rootJsonLd} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <NextIntlClientProvider locale="es" messages={esMessages}>
          <RegisterServiceWorker />
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <VercelInsights />
      </body>
    </html>
  );
}