'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Package, Repeat, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  normalizeStorePath,
  STORE_PERFIL_BRIDGE,
  type StorePerfilBridgeKey,
} from '@/lib/shop/store-routes';

const BRIDGE_ICONS: Record<StorePerfilBridgeKey, LucideIcon> = {
  store: Grid3X3,
  orders: Package,
  reposicion: Repeat,
  bag: ShoppingBag,
};

type StorePerfilBridgeProps = {
  className?: string;
};

export function StorePerfilBridge({ className }: StorePerfilBridgeProps) {
  const pathname = usePathname();
  const normalized = normalizeStorePath(pathname || '/');
  const tBridge = useTranslations('perfil.bridge');

  return (
    <nav
      className={`tienda-store-perfil-bridge ${className ?? ''}`}
      aria-label={tBridge('aria')}
    >
      {STORE_PERFIL_BRIDGE.map((item) => {
        const isActive = item.match(normalized);
        const Icon = BRIDGE_ICONS[item.labelKey];
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`tienda-store-perfil-bridge-item ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={16} strokeWidth={isActive ? 2.25 : 2} />
            <span>{tBridge(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}