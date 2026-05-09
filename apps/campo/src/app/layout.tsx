import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import React from 'react';
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable}`}>
      <body className={`${inter.className} bg-black antialiased`}>{children}</body>
    </html>
  );
}

