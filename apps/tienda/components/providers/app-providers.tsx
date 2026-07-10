'use client';

import { ThemeProvider, ToastProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';
import { HeaderMenuProvider } from '@/components/shop/header-menu-context';
import { StoreChromeProvider } from '@/components/shop/store-chrome-context';
import { PwaShellMarker } from '@/components/pwa/pwa-shell-marker';
import { ResenaClaimHandler } from '@/components/shop/resena-claim-handler';
import { CmsPreviewListener } from '@/components/shop/cms-preview-listener';
import type { HeaderMenuSettings, HeaderNavItem } from '@/lib/shop/header-menu';
import type { StoreChromeConfig } from '@/lib/shop/store-chrome';

export function AppProviders({
  children,
  headerSettings,
  headerItems,
  storeChrome,
}: {
  children: React.ReactNode;
  headerSettings?: HeaderMenuSettings | null;
  headerItems?: HeaderNavItem[] | null;
  storeChrome?: StoreChromeConfig | null;
}) {
  const themeDefault =
    storeChrome?.theme.force_dark_public
      ? 'dark'
      : storeChrome?.theme.default_theme === 'system'
        ? 'dark'
        : (storeChrome?.theme.default_theme ?? 'system');

  return (
    <ThemeProvider defaultTheme={themeDefault === 'light' ? 'light' : 'dark'}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <StoreChromeProvider value={storeChrome}>
              <HeaderMenuProvider settings={headerSettings} items={headerItems}>
                <PwaShellMarker />
                <ResenaClaimHandler />
                <CmsPreviewListener />
                {children}
              </HeaderMenuProvider>
            </StoreChromeProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
