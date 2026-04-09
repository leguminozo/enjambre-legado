import React from 'react';
import { CartProvider } from '@/components/pos/cart-context';
import { PosHeader } from '@/components/pos/pos-header';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <PosHeader />
        <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
      </div>
    </CartProvider>
  );
}
