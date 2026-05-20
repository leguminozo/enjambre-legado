'use client';

import { ThemeProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
