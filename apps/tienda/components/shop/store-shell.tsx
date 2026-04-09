import type { ReactNode } from 'react';
import { WhatsAppFloat } from '@/components/shop/whatsapp-float';

/** Fondo y texto base alineados al sitio oscuro obrerayzangano.com (imágenes hero/producto después). */
export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 antialiased">
      {children}
      <WhatsAppFloat />
    </div>
  );
}
