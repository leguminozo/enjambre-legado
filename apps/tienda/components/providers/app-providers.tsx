'use client';

import { ThemeProvider, ToastProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';
import { PwaShellMarker } from '@/components/pwa/pwa-shell-marker';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <PwaShellMarker />
            {children}
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
