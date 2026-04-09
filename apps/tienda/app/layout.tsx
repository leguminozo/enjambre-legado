import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { RegisterServiceWorker } from '@/components/pwa/register-sw';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Tienda · Enjambre Legado',
    template: '%s · Enjambre Legado',
  },
  description: 'Tienda y panel de administración Enjambre Legado',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <RegisterServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
