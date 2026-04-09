import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import React from 'react';

const fontDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const fontBody = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="font-sans antialiased">
        <RegisterServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
