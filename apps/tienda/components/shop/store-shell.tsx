import type { ReactNode } from 'react';
import { WhatsAppFloat } from '@/components/shop/whatsapp-float';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { MobileBottomNav } from '@/components/shop/mobile-bottom-nav';
import { MobileCartBar } from '@/components/shop/mobile-cart-bar';

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased tienda-shell">
      <div className="tienda-shell-content">{children}</div>
      <InstallPrompt />
      <MobileCartBar />
      <MobileBottomNav />
      <WhatsAppFloat />
    </div>
  );
}
