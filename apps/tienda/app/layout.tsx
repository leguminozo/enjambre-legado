import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import React from 'react';
import {
  organizationJsonLd,
  webSiteJsonLd,
  mergeJsonLd,
  renderJsonLd,
} from '@/lib/shop/json-ld';

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
  variable: '--font-body',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'La Obrera y el Zángano · Tienda',
    template: '%s · La Obrera y el Zángano',
  },
  description:
    'Miel cruda del bosque nativo de Chiloé. Creaciones con legado y regeneración — La Obrera y el Zángano.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    title: {
      default: 'La Obrera y el Zángano · Miel cruda del bosque nativo',
      template: '%s · La Obrera y el Zángano',
    },
    description:
      'Miel cruda del bosque nativo de Chiloé. Trazable desde el apiario hasta tu mesa. Regeneración biocultural.',
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
  },
  robots: {
    index: true,
    follow: true,
  },
};

const rootJsonLd = mergeJsonLd([organizationJsonLd(), webSiteJsonLd()]);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable}`} suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('enjambre-theme');var r=t==='light'?'light':t==='dark'?'dark':window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r)}catch(e){}})()` }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: renderJsonLd(rootJsonLd) }}
      />
    </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <RegisterServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
