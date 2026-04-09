import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import React from 'react';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-campo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Campo · Enjambre Legado',
  description: 'POS offline-first y fidelización',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className={`${dmSans.className} antialiased`}>{children}</body>
    </html>
  );
}
