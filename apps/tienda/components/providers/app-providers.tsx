'use client';

import { ThemeProvider, ToastProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';
import { HeaderMenuProvider } from '@/components/shop/header-menu-context';
import { PwaShellMarker } from '@/components/pwa/pwa-shell-marker';
import { ResenaClaimHandler } from '@/components/shop/resena-claim-handler';
import type { HeaderMenuSettings, HeaderNavItem } from '@/lib/shop/header-menu';

export function AppProviders({
  children,
  headerSettings,
  headerItems,
}: {
  children: React.ReactNode;
  headerSettings?: HeaderMenuSettings | null;
  headerItems?: HeaderNavItem[] | null;
}) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <HeaderMenuProvider settings={headerSettings} items={headerItems}>
              <PwaShellMarker />
              <ResenaClaimHandler />
              {children}
            </HeaderMenuProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
