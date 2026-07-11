import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import React from 'react';
import { ThemeProvider, ThemeInitScript, ToastProvider } from '@enjambre/ui';
import { CampoAuthProvider } from '@/components/campo-auth-provider';
import { SyncProvider } from '@/components/sync-provider';
import { VercelInsights } from '@/components/VercelInsights';
import { CampoShell } from '@/components/layout/campo-shell';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Campo · POS Experiencial',
  description: 'Vanguardia en experiencia de marca y fidelización cíclica.',
  robots: { index: false, follow: false },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A3D2F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} bg-background antialiased`} suppressHydrationWarning>
        <ThemeInitScript storageKey="enjambre-theme" defaultTheme="system" enableSystem />
        <ThemeProvider defaultTheme="system" storageKey="enjambre-theme" enableSystem>
          <ToastProvider>
            <CampoAuthProvider>
              <SyncProvider>
                <CampoShell>
                  {children}
                </CampoShell>
              </SyncProvider>
            </CampoAuthProvider>
          </ToastProvider>
        </ThemeProvider>
        <VercelInsights />
      </body>
    </html>
  );
}