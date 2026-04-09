import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Campo · Enjambre Legado',
  description: 'POS offline-first y fidelización',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
