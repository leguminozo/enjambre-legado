import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Montserrat } from 'next/font/google';
import React from 'react';

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

const fontCarousel = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-carousel',
  display: 'swap',
});

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable} ${fontCarousel.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('enjambre-theme');var r=t==='light'?'light':t==='dark'?'dark':window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(r)}catch(e){}})()` }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <RegisterServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
