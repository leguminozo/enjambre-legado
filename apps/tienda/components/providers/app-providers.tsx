'use client';

import { ThemeProvider, ToastProvider } from '@enjambre/ui';
import { AuthProvider } from './auth-context';
import { CartProvider } from '@/components/shop/cart-context';
import { HeaderMenuProvider } from '@/components/shop/header-menu-context';
import { StoreChromeProvider } from '@/components/shop/store-chrome-context';
import { PwaShellMarker } from '@/components/pwa/pwa-shell-marker';
import { OnlineStatusListener } from '@/components/pwa/online-status-listener';
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
  const forceDark = Boolean(storeChrome?.theme.force_dark_public);
  const rawDefault = storeChrome?.theme.default_theme ?? 'dark';
  const shouldForceDark = forceDark || rawDefault === 'dark';
  const themeDefault: 'light' | 'dark' = shouldForceDark ? 'dark' : 'light';

  return (
    <ThemeProvider
      defaultTheme={themeDefault}
      forcedTheme={shouldForceDark ? 'dark' : undefined}
      enableSystem={!shouldForceDark && rawDefault === 'system'}
      storageKey="enjambre-theme"
    >
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <StoreChromeProvider value={storeChrome}>
              <HeaderMenuProvider settings={headerSettings} items={headerItems}>
                <PwaShellMarker />
                <OnlineStatusListener />
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
