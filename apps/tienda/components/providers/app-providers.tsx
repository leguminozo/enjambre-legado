'use client';

import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
