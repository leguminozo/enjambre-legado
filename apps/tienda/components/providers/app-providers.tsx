'use client';

import { ThemeProvider, ToastProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';
import { PwaShellMarker } from '@/components/pwa/pwa-shell-marker';
import { ResenaClaimHandler } from '@/components/shop/resena-claim-handler';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <PwaShellMarker />
            <ResenaClaimHandler />
            {children}
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
