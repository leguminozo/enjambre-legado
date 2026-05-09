import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
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
      <body className="font-sans antialiased bg-[#050505] text-[#f5f0e8]">
        <RegisterServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
