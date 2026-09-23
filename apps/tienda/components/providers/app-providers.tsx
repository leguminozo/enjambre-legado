'use client';

import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const isPerfil = pathname?.startsWith('/perfil');
  const forceDarkPublic = Boolean(storeChrome?.theme.force_dark_public);
  // En /perfil jamás se fuerza el modo oscuro para respetar los ajustes del usuario
  const forcedTheme = (!isPerfil && forceDarkPublic) ? 'dark' : undefined;
  const rawDefault = storeChrome?.theme.default_theme ?? 'dark';
  const defaultTheme: 'light' | 'dark' | 'system' =
    rawDefault === 'light' || rawDefault === 'system' ? rawDefault : 'dark';

  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      enableSystem={!forcedTheme}
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
